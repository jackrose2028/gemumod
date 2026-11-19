// Game-page player for the NostalgistMod engine (engines/NostalgistMod.js).
// Adds what Nostalgist leaves to the page: a toolbar, persistent in-game saves and save states,
// F-key hotkeys, resizing, and audio unlock on the first interaction.
import { Nostalgist } from "../engines/NostalgistMod.js";
import { coresFor } from "./common.js";
import { extensionOf, labelFor } from "./detect.js";
import { EJS_STORAGE } from "../data/src/storage.js";
import { device, isPhoneView } from "./mobile.js";
import { createTouchPad } from "./touch-pad.js";

export const info = {
    id: "nostalgist",
    name: "NostalgistMod",
    summary: "Nostalgist.js running the same local cores in a minimal player."
};

const store = new EJS_STORAGE("NostalgistMod-saves", "saves");
const SRAM_INTERVAL_MS = 30000;
const PAD_KEY = "nm-touch-pad";
const CONTROLS = "Arrows move · X = A · Z = B · S = X · A = Y · Q/W = L/R · Enter = Start · Right Shift = Select";

/** The first core for this system with a single-threaded build in data/cores (Nostalgist has no pthreads). */
function pickCore(system, wanted) {
    const files = (window.EJS_coreManifest && window.EJS_coreManifest.files) || null;
    // The core chosen when the game was loaded, when it has a single-threaded build
    const order = wanted ? [wanted, ...coresFor(system).filter((c) => c !== wanted)] : coresFor(system);
    for (const core of order) {
        if (!files) return core;
        if ((core + "-wasm.7z") in files || (core + "-legacy-wasm.7z") in files) return core;
    }
    return null;
}

export function supports(system) {
    if (pickCore(system)) return { ok: true };
    return { ok: false, reason: `${labelFor(system)} only has multi-threaded cores here, which NostalgistMod cannot run. Switch the engine to EmulatorJSMod.` };
}

async function asFile(input, name) {
    if (!input) return null;
    if (input instanceof File) return input;
    if (input instanceof Blob) return new File([input], name);
    // Fetch URLs ourselves so the file keeps its real (decoded) name inside the emulator
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Could not load ${name} (HTTP ${response.status})`);
    return new File([await response.blob()], name);
}

function message(host, text, kind) {
    const box = document.createElement("div");
    box.className = "nm-toast" + (kind ? " " + kind : "");
    box.textContent = text;
    host.appendChild(box);
    setTimeout(() => box.remove(), 2200);
}

export async function launch({ container, game, options, onExit, toolbar }) {
    const host = document.querySelector(container);
    const core = pickCore(game.system, game.core);
    if (!core) throw new Error(supports(game.system).reason);
    const baseName = game.name.replace(/\.[^.]*$/, "");
    const saveKey = (kind) => `${core}:${baseName}:${kind}`;

    host.textContent = "";
    host.classList.add("nm-host");
    const status = document.createElement("div");
    status.className = "nm-status";
    status.textContent = "Loading " + labelFor(game.system) + " core…";
    const canvas = document.createElement("canvas");
    canvas.className = "nm-canvas";
    canvas.tabIndex = 0;
    // The picture sits in its own box so the phone layout can put the on-screen pad below it (portrait) or beside it
    const screenBox = document.createElement("div");
    screenBox.className = "nm-screen";
    screenBox.appendChild(canvas);
    host.append(screenBox, status);

    // ROM (+ patch renamed to sit next to it, which RetroArch applies automatically), BIOS and the stored SRAM
    const romFile = await asFile(game.rom, game.name);
    const rom = [{ fileName: game.name, fileContent: romFile }];
    if (game.patch) rom.push({ fileName: baseName + "." + extensionOf(game.patch.name), fileContent: game.patch });
    const savedSram = await store.get(saveKey("sram"));

    window.NOSTALGIST_MOD = { coresPath: "data/cores/", workerPath: "data/compression/extract7z.js", manifest: window.EJS_coreManifest };
    const nostalgist = await Nostalgist.launch({
        element: canvas,
        core,
        rom,
        bios: game.bios ? [{ fileName: game.bios.name, fileContent: game.bios }] : [],
        sram: savedSram && savedSram.data ? new Blob([savedSram.data]) : undefined,
        respondToGlobalEvents: true,
        style: { width: "100%", height: "100%", backgroundColor: "black", imageRendering: "pixelated" },
        retroarchConfig: { video_smooth: false, savestate_auto_load: false, savestate_thumbnail_enable: false, notification_show_when_menu_is_alive: false },
        onLog: options.debug ? (e) => console[e.level](`[NostalgistMod] ${e.message}`) : () => {}
    });
    status.remove();
    canvas.focus();
    window.NostalgistMod_instance = nostalgist;

    // ---------- sizing ----------
    // RetroArch sizes its own drawing buffer from the canvas box when the window reports a resize, and draws its
    // picture to match. Sizing the buffer from here (Nostalgist's resize) breaks on browsers where RetroArch does not
    // count devicePixelRatio the same way (the picture ended up in one corner on phones), so it is left to RetroArch.
    let fitting = false;
    // Landscape with the on-screen pad: keep the picture between the d-pad and the buttons when it would run under them
    const placeScreen = () => {
        let left = 0;
        let right = 0;
        const pad = host.querySelector(".tp");
        const W = host.clientWidth;
        const H = host.clientHeight;
        if (pad && !pad.hidden && W > H) {
            const box = host.getBoundingClientRect();
            const l = pad.querySelector(".tp-left").getBoundingClientRect();
            const r = pad.querySelector(".tp-right").getBoundingClientRect();
            const insetL = l.right - box.left + 6;
            const insetR = box.right - r.left + 6;
            if ((W - H * 4 / 3) / 2 < Math.max(insetL, insetR) && W - insetL - insetR > W * 0.4) {
                left = insetL;
                right = insetR;
            }
        }
        screenBox.style.left = left ? left + "px" : "";
        screenBox.style.right = right ? right + "px" : "";
    };
    const fit = () => {
        placeScreen();
        if (fitting || !screenBox.clientWidth || !screenBox.clientHeight) return;
        fitting = true;
        try { window.dispatchEvent(new Event("resize")); } finally { fitting = false; }
    };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(() => requestAnimationFrame(fit)) : null;
    if (observer) observer.observe(screenBox);
    else window.addEventListener("resize", fit);
    fit();

    // ---------- on-screen pad (touch screens and the phone view) ----------
    let touchPad = null;
    if (device.touch || isPhoneView()) {
        touchPad = createTouchPad({
            parent: host,
            system: game.system,
            press: (button, down) => {
                try {
                    if (down) nostalgist.pressDown(button);
                    else nostalgist.pressUp(button);
                } catch (e) { /* game not running */ }
            }
        });
        host.classList.add("nm-touch");
        // Shown unless turned off in the game menu, and hidden while a physical controller is connected
        const wanted = () => localStorage.getItem(PAD_KEY) !== "off";
        const refreshPad = () => {
            const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
            touchPad.setVisible(wanted() && pads.length === 0);
            requestAnimationFrame(fit);
        };
        touchPad.refresh = refreshPad;
        touchPad.setWanted = (on) => {
            try { localStorage.setItem(PAD_KEY, on ? "on" : "off"); } catch (e) { /* storage blocked */ }
            refreshPad();
        };
        touchPad.wanted = wanted;
        window.addEventListener("gamepadconnected", refreshPad);
        window.addEventListener("gamepaddisconnected", refreshPad);
        refreshPad();
    }

    // ---------- audio: browsers start it suspended until the page is used ----------
    const al = nostalgist.getEmscriptenAL && nostalgist.getEmscriptenAL();
    const audio = al && al.currentCtx && al.currentCtx.audioCtx;
    if (audio && audio.state === "suspended") {
        const resume = () => audio.resume().catch(() => {});
        for (const type of ["pointerdown", "keydown", "touchend"]) window.addEventListener(type, resume, { capture: true, once: true });
        message(host, "Click or press a key to turn on sound");
    }

    // ---------- saves ----------
    const saveSram = async () => {
        try {
            const blob = await nostalgist.saveSRAM();
            if (blob && blob.size) await store.put(saveKey("sram"), { data: new Uint8Array(await blob.arrayBuffer()), time: Date.now() });
        } catch (e) { /* this core has no in-game save */ }
    };
    const sramTimer = setInterval(() => {
        if (nostalgist.getStatus() === "running") saveSram();
    }, SRAM_INTERVAL_MS);
    const onHide = () => {
        if (document.hidden) saveSram();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", saveSram);

    const actions = {
        async save() {
            const { state } = await nostalgist.saveState();
            await store.put(saveKey("state"), { data: new Uint8Array(await state.arrayBuffer()), time: Date.now() });
            message(host, "State saved", "ok");
        },
        async load() {
            const record = await store.get(saveKey("state"));
            if (!record || !record.data) return message(host, "No saved state yet", "bad");
            await nostalgist.loadState(new Blob([record.data]));
            message(host, "State loaded", "ok");
        },
        pause() {
            if (nostalgist.getStatus() === "paused") {
                nostalgist.resume();
                message(host, "Resumed");
            } else {
                nostalgist.pause();
                message(host, "Paused");
            }
            updateButtons();
        },
        reset() {
            nostalgist.restart();
            message(host, "Game reset");
            updateButtons();
        },
        async screenshot() {
            const blob = await nostalgist.screenshot();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = baseName + "-" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + ".png";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            message(host, "Screenshot saved", "ok");
        },
        fullscreen() {
            if (document.fullscreenElement) document.exitFullscreen();
            else host.requestFullscreen && host.requestFullscreen().catch(() => {});
        },
        async exit() {
            await saveSram();
            cleanup();
            onExit();
        }
    };
    const run = (name) => Promise.resolve().then(() => actions[name]()).catch((e) => message(host, "Failed: " + e.message, "bad"));

    // ---------- toolbar ----------
    const buttons = {};
    const defs = [
        ["pause", "Pause", "Pause or resume (F5)"],
        ["reset", "Reset", "Restart the game (Shift+F5)"],
        ["save", "Save state", "Save a state in this browser (F2)"],
        ["load", "Load state", "Load the saved state (F4)"],
        ["screenshot", "Screenshot", "Download a PNG (F8)"],
        ["fullscreen", "Fullscreen", "Fullscreen (F11)"],
        ["exit", "Exit", "Save and return to the home page"]
    ];
    if (toolbar) {
        toolbar.textContent = "";
        for (const [name, label, title] of defs) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.title = title;
            button.dataset.action = name;
            button.addEventListener("click", () => {
                run(name);
                canvas.focus();
            });
            toolbar.appendChild(button);
            buttons[name] = button;
        }
    }
    function updateButtons() {
        if (buttons.pause) buttons.pause.textContent = nostalgist.getStatus() === "paused" ? "Resume" : "Pause";
    }

    // ---------- hotkeys (same keys as EmulatorJSMod) ----------
    const onKey = (event) => {
        const target = event.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
        const map = { F2: "save", F4: "load", F5: event.shiftKey ? "reset" : "pause", F8: "screenshot", F11: "fullscreen" };
        const action = map[event.key];
        if (!action) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) run(action);
    };
    window.addEventListener("keydown", onKey, true);

    function cleanup() {
        clearInterval(sramTimer);
        window.removeEventListener("keydown", onKey, true);
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("pagehide", saveSram);
        if (observer) observer.disconnect();
        if (touchPad) touchPad.destroy();
        try { nostalgist.exit({ removeCanvas: false }); } catch (e) { /* already stopped */ }
    }

    document.title = baseName + " - NostalgistMod";
    return {
        hints: touchPad ? "Touch controls on screen · menu for saves" : "Keys: arrows, Z X A S, Q W, Enter, R-Shift · F2 save · F4 load",
        hintsTitle: CONTROLS,
        nostalgist,
        touchPad,
        pause: () => { if (nostalgist.getStatus() === "running") { nostalgist.pause(); updateButtons(); return true; } return false; },
        resume: () => { if (nostalgist.getStatus() === "paused") { nostalgist.resume(); updateButtons(); } },
        relayout: () => requestAnimationFrame(fit)
    };
}
