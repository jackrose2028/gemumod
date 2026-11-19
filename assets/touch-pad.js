// On-screen controller for NostalgistMod on phones and tablets (EmulatorJSMod has its own).
// Multi-touch: every finger is tracked on its own, a finger can slide from one button to the next (B to A,
// or around the d-pad including diagonals) like on a real pad, and a short vibration confirms a press where
// the device supports it. Button sets follow the system, so an NES shows B and A and a SNES shows Y X B A, L, R.

const LAYOUTS = {
    nes: { face: [["B", "b"], ["A", "a"]], meta: [["Select", "select"], ["Start", "start"]] },
    gb: { face: [["B", "b"], ["A", "a"]], meta: [["Select", "select"], ["Start", "start"]] },
    gba: { face: [["B", "b"], ["A", "a"]], shoulders: [["L", "l"], ["R", "r"]], meta: [["Select", "select"], ["Start", "start"]] },
    segaGG: { face: [["1", "b"], ["2", "a"]], meta: [["Start", "start"]] },
    segaMS: { face: [["1", "b"], ["2", "a"]], meta: [["Pause", "start"]] },
    segaMD: { face: [["A", "y"], ["B", "b"], ["C", "a"]], meta: [["Mode", "select"], ["Start", "start"]] },
    atari2600: { face: [["Fire", "b"]], meta: [["Select", "select"], ["Reset", "start"]] },
    snes: { face: [["Y", "y"], ["X", "x"], ["B", "b"], ["A", "a"]], shoulders: [["L", "l"], ["R", "r"]], meta: [["Select", "select"], ["Start", "start"]] },
    n64: { face: [["B", "y"], ["A", "b"]], shoulders: [["L", "l"], ["Z", "l2"], ["R", "r"]], meta: [["Start", "start"]] },
    default: { face: [["Y", "y"], ["X", "x"], ["B", "b"], ["A", "a"]], shoulders: [["L", "l"], ["R", "r"]], meta: [["Select", "select"], ["Start", "start"]] }
};

const DIRS = ["up", "down", "left", "right"];

/**
 * @param {{ parent: HTMLElement, system: string, press: (button: string, down: boolean) => void }} options
 * @returns {{ element: HTMLElement, setVisible: (on: boolean) => void, releaseAll: () => void, destroy: () => void }}
 */
export function createTouchPad({ parent, system, press }) {
    const layout = LAYOUTS[system] || LAYOUTS.default;
    const pad = document.createElement("div");
    pad.className = "tp";
    pad.setAttribute("aria-hidden", "true");

    const make = (cls, label, button) => {
        const el = document.createElement("div");
        el.className = cls;
        if (label) el.textContent = label;
        if (button) el.dataset.button = button;
        return el;
    };
    const dpad = make("tp-dpad");
    for (const d of DIRS) dpad.appendChild(make("tp-arrow tp-d-" + d));
    const left = make("tp-left");
    left.appendChild(dpad);
    const right = make("tp-right");
    const face = make("tp-face tp-face-" + layout.face.length);
    for (const [label, button] of layout.face) face.appendChild(make("tp-btn tp-" + label.toLowerCase(), label, button));
    right.appendChild(face);
    const shoulders = make("tp-shoulders");
    for (const [label, button] of layout.shoulders || []) shoulders.appendChild(make("tp-btn tp-shoulder", label, button));
    const meta = make("tp-meta");
    for (const [label, button] of layout.meta || []) meta.appendChild(make("tp-btn tp-small", label, button));
    pad.append(shoulders, left, right, meta);
    parent.appendChild(pad);

    // ---------- state: which buttons each finger holds ----------
    const fingers = new Map(); // pointerId -> Set of buttons
    const held = new Map(); // button -> number of fingers holding it
    const buzz = () => {
        const active = !navigator.userActivation || navigator.userActivation.hasBeenActive;
        if (navigator.vibrate && active) try { navigator.vibrate(8); } catch (e) { /* not allowed */ }
    };
    const setHeld = (button, down) => {
        const count = (held.get(button) || 0) + (down ? 1 : -1);
        if (count > 0) {
            held.set(button, count);
            if (down && count === 1) {
                press(button, true);
                buzz();
            }
        } else {
            if (held.has(button)) press(button, false);
            held.delete(button);
        }
        for (const el of pad.querySelectorAll(`[data-button="${button}"]`)) el.classList.toggle("on", held.has(button));
        if (DIRS.includes(button)) dpad.querySelector(".tp-d-" + button).classList.toggle("on", held.has(button));
    };

    /** Buttons under a point: a face/shoulder/meta button, or d-pad directions from the angle to its centre. */
    const buttonsAt = (x, y) => {
        const rect = dpad.getBoundingClientRect();
        const slack = rect.width * 0.25;
        if (x >= rect.left - slack && x <= rect.right + slack && y >= rect.top - slack && y <= rect.bottom + slack) {
            const dx = x - (rect.left + rect.width / 2);
            const dy = y - (rect.top + rect.height / 2);
            const dead = rect.width * 0.12;
            const out = new Set();
            if (Math.hypot(dx, dy) < dead) return out;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI; // 0 = right, 90 = down
            // 8 sectors with diagonals 45° wide each side of the axes
            if (angle > -67.5 && angle < 67.5) out.add("right");
            if (angle > 112.5 || angle < -112.5) out.add("left");
            if (angle > 22.5 && angle < 157.5) out.add("down");
            if (angle < -22.5 && angle > -157.5) out.add("up");
            return out;
        }
        const el = document.elementFromPoint(x, y);
        const btn = el && el.closest && el.closest(".tp [data-button]");
        return new Set(btn ? [btn.dataset.button] : []);
    };
    const track = (event) => {
        const now = buttonsAt(event.clientX, event.clientY);
        const before = fingers.get(event.pointerId) || new Set();
        for (const b of before) if (!now.has(b)) setHeld(b, false);
        for (const b of now) if (!before.has(b)) setHeld(b, true);
        fingers.set(event.pointerId, now);
    };
    const release = (event) => {
        const before = fingers.get(event.pointerId);
        if (!before) return;
        for (const b of before) setHeld(b, false);
        fingers.delete(event.pointerId);
    };
    const onDown = (event) => {
        if (!event.target.closest(".tp-dpad, [data-button]") && !event.target.closest(".tp-left")) return;
        event.preventDefault();
        try { pad.setPointerCapture(event.pointerId); } catch (e) { /* pointer already gone */ }
        track(event);
    };
    const onMove = (event) => {
        if (fingers.has(event.pointerId)) {
            event.preventDefault();
            track(event);
        }
    };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("lostpointercapture", release);

    const releaseAll = () => {
        for (const id of [...fingers.keys()]) release({ pointerId: id });
        for (const button of [...held.keys()]) {
            held.delete(button);
            press(button, false);
        }
        for (const el of pad.querySelectorAll(".on")) el.classList.remove("on");
    };
    const onHide = () => { if (document.hidden) releaseAll(); };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", releaseAll);

    return {
        element: pad,
        setVisible(on) {
            if (!on) releaseAll();
            pad.hidden = !on;
            parent.classList.toggle("tp-visible", on);
        },
        releaseAll,
        destroy() {
            releaseAll();
            document.removeEventListener("visibilitychange", onHide);
            window.removeEventListener("blur", releaseAll);
            pad.remove();
        }
    };
}
