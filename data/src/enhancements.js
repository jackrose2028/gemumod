/**
 * Play-session enhancements layered on top of the core emulator:
 * hotkeys, gamepad combos, persistent quick-save slots, autosave/resume,
 * auto-pause, wake lock, media session, overlays and recovery helpers.
 * Every feature is optional and degrades silently when an API is missing.
 */
const PREFS_KEY = "ejs-enhancements";
const PLAYTIME_KEY = "ejs-playtime";
const DEFAULT_PREFS = {
    autoPause: true,
    autoSave: true,
    resumePrompt: true,
    padCombos: true,
    rumble: true,
    wakeLock: true,
    cursorHide: true,
    scanlines: false,
    fps: false
};
const PREF_LABELS = {
    autoPause: "Pause when the tab is hidden or a controller disconnects",
    autoSave: "Save a resume point when leaving the game",
    resumePrompt: "Offer to resume where you left off",
    padCombos: "Controller hotkeys (hold Select)",
    rumble: "Controller rumble on save / load",
    wakeLock: "Keep the screen awake while playing",
    cursorHide: "Hide the mouse cursor while idle",
    scanlines: "CRT scanline overlay",
    fps: "Show FPS counter"
};
const HOTKEYS = [
    ["F1", "This panel"],
    ["F2", "Quick save"],
    ["F3 / Shift+F3", "Next / previous save slot"],
    ["Shift+F2", "Save slots with pictures (save, load, delete)"],
    ["F4", "Quick load"],
    ["Shift+F4", "Undo last load"],
    ["F5", "Pause / resume"],
    ["Shift+F5", "Reset game"],
    ["F6", "Fast forward on / off"],
    ["F7", "Slow motion on / off"],
    ["F8", "Screenshot"],
    ["Shift+F8", "2.5D mode on / off (NES and SNES, when started in 2.5D)"],
    ["F9", "Mute / unmute"],
    ["Shift+F9", "Performance mode on / off"],
    ["F10", "FPS counter"],
    ["Shift+F10", "Performance stats"],
    ["F11", "Fullscreen"],
    ["Select + R1 / L1", "Quick save / load (controller)"],
    ["Select + R2 / L2", "Fast forward / next slot (controller)"],
    ["Select + Start", "Pause / resume (controller)"],
    ["Select + Up", "Save slots (controller)"]
];
const STYLE = `
.ejs-enh-cursor-hidden, .ejs-enh-cursor-hidden * { cursor: none !important; }
.ejs-enh-scanlines { position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: repeating-linear-gradient(to bottom, rgba(0,0,0,.28) 0, rgba(0,0,0,.28) 1px, transparent 1px, transparent 3px); }
.ejs-enh-fps { position: absolute; top: 6px; left: 8px; z-index: 7; pointer-events: none; font: 600 13px/1 ui-monospace, monospace;
  color: #7CFC7C; background: rgba(0,0,0,.55); padding: 4px 6px; border-radius: 4px; }
.ejs-enh-toast { position: absolute; left: 50%; bottom: 64px; transform: translateX(-50%); z-index: 9; display: flex; gap: 8px; align-items: center;
  background: rgba(20,24,30,.94); color: #eee; border: 1px solid #3a4350; border-radius: 10px; padding: 10px 12px; font: 14px system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.5); }
.ejs-enh-toast button, .ejs-enh-panel button { font: inherit; color: #fff; background: #1a7fd0; border: 0; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.ejs-enh-toast button.secondary, .ejs-enh-panel button.secondary { background: #3a4350; }
.ejs-enh-panel { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.6); font: 14px system-ui, sans-serif; color: #e6e9ed; }
.ejs-enh-panel > div { background: #171b21; border: 1px solid #333c47; border-radius: 12px; padding: 16px 18px; max-width: min(640px, 94%); max-height: 90%; overflow: auto; }
.ejs-enh-panel h3 { margin: 0 0 10px; font-size: 16px; }
.ejs-enh-panel table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
.ejs-enh-panel td { padding: 3px 8px 3px 0; vertical-align: top; }
.ejs-enh-panel td:first-child { white-space: nowrap; color: #8fd0ff; font-family: ui-monospace, monospace; }
.ejs-enh-panel label { display: block; margin: 6px 0; }
.ejs-slots > div { max-width: min(860px, 96%); width: 100%; box-sizing: border-box; }
.ejs-slots-grid { display: grid; grid-template-columns: repeat(var(--slot-cols, 3), minmax(0, 1fr)); gap: 10px; margin: 6px 0 12px; }
.ejs-slot { box-sizing: border-box; cursor: pointer; outline: none; -webkit-tap-highlight-color: transparent; display: flex; flex-direction: column; gap: 5px; padding: 6px; border-radius: 10px; background: #1f252d; border: 2px solid transparent; }
.ejs-slot:focus-visible, .ejs-slot.selected { border-color: #1aafff; background: #22303d; }
.ejs-slot-pic { width: 100%; aspect-ratio: 4 / 3; max-height: var(--slot-pic-h, 140px); border-radius: 6px; background: #0d1014 center / cover no-repeat; image-rendering: pixelated; display: flex; align-items: center; justify-content: center; color: #6b7682; font-size: 12px; }
.ejs-slot:not(.used) .ejs-slot-pic { border: 1px dashed #3a4350; }
.ejs-slot-label { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; color: #8b95a1; white-space: nowrap; overflow: hidden; }
.ejs-slot-label strong { color: #e6e9ed; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.ejs-slot.current .ejs-slot-label strong { color: #8fd0ff; }
.ejs-slots-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.ejs-slots-actions button:disabled { opacity: .4; cursor: default; }
.ejs-slots-open .ejs_virtualGamepad_parent, .ejs-slots-open .ejs_menu_bar { visibility: hidden; }
@media (pointer: coarse) { .ejs-slots-help { display: none; } .ejs-slots-actions button { min-height: 44px; flex: 1 1 auto; } }
@media (max-width: 520px) { .ejs-slots-grid { gap: 6px; } .ejs-slot-label span { display: none; } }
.ejs-depth25-on > canvas.ejs_canvas { opacity: 0 !important; }
.ejs-depth25-row { display: flex !important; align-items: center; gap: 8px; }
.ejs-depth25-row input[type=range] { flex: 1; max-width: 220px; }
.ejs-perf-stats { position: absolute; top: 6px; right: 8px; z-index: 7; pointer-events: none; white-space: pre; font: 12px/1.45 ui-monospace, monospace;
  color: #cfe8ff; background: rgba(0,0,0,.7); padding: 6px 8px; border-radius: 6px; max-width: 70%; overflow: hidden; }
.ejs-perf-panel { border-top: 1px solid #333c47; margin-top: 10px; padding-top: 8px; }
.ejs-perf-panel select { font: inherit; background: #222831; color: #e6e9ed; border: 1px solid #3a4350; border-radius: 5px; padding: 2px 4px; }
.ejs-perf-note { color: #8b95a1; font-size: 12px; }
.ejs-enh-panel .meta { color: #8b95a1; margin: 8px 0 12px; }
.ejs-enh-back { position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 11; }
`;

function loadPrefs() {
    try {
        return Object.assign({}, DEFAULT_PREFS, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
    } catch (e) {
        return Object.assign({}, DEFAULT_PREFS);
    }
}

function timeAgo(time) {
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + " min ago";
    if (minutes < 1440) return Math.round(minutes / 60) + " h ago";
    const days = Math.round(minutes / 1440);
    return days < 14 ? days + (days === 1 ? " day ago" : " days ago") : new Date(time).toLocaleDateString();
}
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
}

class EJS_Enhancements {
    constructor(ejs) {
        this.ejs = ejs;
        this.prefs = loadPrefs();
        this.undoState = null;
        this.autoPaused = false;
        this.lastAutoSave = 0;
        this.timers = [];
        this.injectStyle();
        this.wrapStartError();
        ejs.on("start", () => this.onStart());
        ejs.on("exit", () => this.onExit());
    }

    // ---------- helpers ----------
    get gm() {
        return this.ejs.gameManager;
    }
    injectStyle() {
        if (document.getElementById("ejs-enh-style")) return;
        const style = document.createElement("style");
        style.id = "ejs-enh-style";
        style.textContent = STYLE;
        document.head.appendChild(style);
    }
    savePrefs() {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs)); } catch (e) { /* storage unavailable */ }
    }
    key(name) {
        return "enh:" + this.base + ":" + name;
    }
    message(text, severity, time) {
        this.ejs.frontend.displayMessage(text, time, undefined, severity);
    }
    slot() {
        return parseInt(this.ejs.getSettingValue("save-state-slot") || "1", 10) || 1;
    }
    rumble() {
        if (!this.prefs.rumble || !navigator.getGamepads) return;
        for (const pad of navigator.getGamepads()) {
            if (pad && pad.vibrationActuator && pad.vibrationActuator.playEffect) {
                pad.vibrationActuator.playEffect("dual-rumble", { duration: 90, strongMagnitude: 0.6, weakMagnitude: 0.4 }).catch(() => {});
            }
        }
    }
    every(ms, fn) {
        const id = setInterval(fn, ms);
        this.timers.push(id);
        return id;
    }
    canControl() {
        return this.ejs.started && !this.ejs.isNetplay;
    }

    // ---------- lifecycle ----------
    onStart() {
        const E = this.ejs;
        this.base = E.getBaseFileName() || "game";
        this.playKey = (typeof E.config.gameName === "string" && E.config.gameName) || this.base;
        this.originalTitle = document.title;
        document.title = this.base + " - EmulatorJS";

        this.wrapQuickSave();
        this.restoreSlots();
        this.bindHotkeys();
        this.bindGamepad();
        this.bindVisibility();
        this.setupSramFlush();
        this.setupMediaSession();
        this.requestWakeLock();
        this.setupCursorHide();
        this.applyScanlines();
        this.applyFps();
        this.trackPlaytime();
        this.watchBattery();
        this.rotateHint();
        this.watchContextLoss();
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
        this.offerResume();
    }
    onExit() {
        this.autoSave(true);
        for (const id of this.timers) clearInterval(id);
        this.timers = [];
        if (this.wakeLock) this.wakeLock.release().catch(() => {});
        if (this.originalTitle !== undefined) document.title = this.originalTitle;
        window.removeEventListener("keydown", this.onKey, true);
        window.removeEventListener("keyup", this.onKey, true);
    }

    // ---------- start failure ----------
    wrapStartError() {
        const original = this.ejs.startGameError.bind(this.ejs);
        this.ejs.startGameError = (message, suffix) => {
            original(message, suffix);
            this.showBackButton();
        };
    }
    showBackButton() {
        const parent = this.ejs.frontend.elements.parent;
        if (!parent || parent.querySelector(".ejs-enh-back")) return;
        const button = document.createElement("button");
        button.className = "ejs-enh-back";
        button.textContent = "Back to menu";
        Object.assign(button.style, { font: "15px system-ui, sans-serif", padding: "8px 14px", borderRadius: "8px", border: "0", background: "#1a7fd0", color: "#fff", cursor: "pointer" });
        button.addEventListener("click", () => {
            if (typeof window.EJS_onBackToMenu === "function") window.EJS_onBackToMenu();
            else location.reload();
        });
        parent.appendChild(button);
    }

    // ---------- save slots ----------
    wrapQuickSave() {
        const gm = this.gm;
        if (gm.enhancedQuickSave) return;
        gm.enhancedQuickSave = true;
        const original = gm.quickSave.bind(gm);
        gm.quickSave = (slot) => {
            const ok = original(slot);
            if (ok) {
                this.persistSlot(slot || 1);
                this.captureThumb(slot || 1);
            }
            return ok;
        };
    }
    persistSlot(slot) {
        try {
            const data = this.gm.FS.readFile("/" + slot + "-quick.state");
            this.ejs.storage.states.put(this.key("slot" + slot), { data: data, time: Date.now() });
        } catch (e) { /* nothing to persist */ }
    }
    async restoreSlots() {
        for (let slot = 1; slot <= 9; slot++) {
            const record = await this.ejs.storage.states.get(this.key("slot" + slot));
            if (record && record.data) {
                try { this.gm.FS.writeFile("/" + slot + "-quick.state", new Uint8Array(record.data)); } catch (e) { /* ignore */ }
            }
        }
    }
    // ---------- save slot picker (round 13) ----------
    /** A small picture of the game at the moment a slot is saved, stored next to the slot. */
    captureThumb(slot) {
        const E = this.ejs;
        // RetroArch takes screenshots on its next frame, so a paused game uses the picture taken when the slot
        // picker opened (the game had not moved since)
        if (E.paused && this.pendingThumb) return this.storeThumb(slot, this.pendingThumb);
        try {
            E.screenshot((blob) => {
                if (blob) this.storeThumb(slot, blob);
            }, "retroarch", "png", 1);
        } catch (e) { /* screenshots unavailable on this core */ }
    }
    grabFrame() {
        return new Promise((resolve) => {
            const timer = setTimeout(() => resolve(null), 600);
            try {
                this.ejs.screenshot((blob) => {
                    clearTimeout(timer);
                    resolve(blob || null);
                }, "retroarch", "png", 1);
            } catch (e) {
                clearTimeout(timer);
                resolve(null);
            }
        });
    }
    storeThumb(slot, blob) {
        const E = this.ejs;
        {
            {
                createImageBitmap(blob).then((bitmap) => {
                    const width = 240;
                    const height = Math.max(1, Math.round(width * bitmap.height / bitmap.width));
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.imageSmoothingEnabled = bitmap.width > width * 1.5;
                    ctx.drawImage(bitmap, 0, 0, width, height);
                    canvas.toBlob((jpeg) => {
                        if (!jpeg) return;
                        jpeg.arrayBuffer().then((buffer) => {
                            E.storage.states.put(this.key("thumb" + slot), { data: new Uint8Array(buffer), type: jpeg.type, time: Date.now() });
                            if (this.slotsPanel) this.renderSlots();
                        });
                    }, "image/jpeg", 0.82);
                }).catch(() => {});
            }
        }
    }
    async slotInfo(slot) {
        const states = this.ejs.storage.states;
        const [record, thumb] = await Promise.all([states.get(this.key("slot" + slot)), states.get(this.key("thumb" + slot))]);
        return { slot, used: this.slotExists(slot), time: record && record.time, thumb: thumb && thumb.data ? new Blob([thumb.data], { type: thumb.type || "image/jpeg" }) : null };
    }
    deleteSlot(slot) {
        try { this.gm.FS.unlink("/" + slot + "-quick.state"); } catch (e) { /* already gone */ }
        this.ejs.storage.states.remove(this.key("slot" + slot));
        this.ejs.storage.states.remove(this.key("thumb" + slot));
        this.message("SLOT " + slot + " DELETED");
    }
    async toggleSlots() {
        if (this.slotsPanel) return this.closeSlots();
        if (!this.canControl() || this.slotsOpening) return;
        if (this.panel) this.togglePanel();
        this.slotsOpening = true;
        this.slotsPausedGame = !this.ejs.paused;
        this.pendingThumb = this.slotsPausedGame ? await this.grabFrame() : null;
        this.slotsOpening = false;
        if (this.slotsPausedGame) this.ejs.pause();
        const panel = document.createElement("div");
        panel.className = "ejs-enh-panel ejs-slots";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Save slots");
        panel.innerHTML = "<div><h3>Save slots</h3><div class=\"ejs-slots-grid\" role=\"listbox\"></div>" +
            "<div class=\"ejs-slots-actions\"><button type=\"button\" data-act=\"save\">Save here</button><button type=\"button\" data-act=\"load\">Load</button>" +
            "<button type=\"button\" class=\"secondary\" data-act=\"delete\">Delete</button><button type=\"button\" class=\"secondary\" data-act=\"close\">Close</button></div>" +
            "<p class=\"meta ejs-slots-help\"></p></div>";
        panel.querySelector(".ejs-slots-help").textContent = "Arrows or d-pad choose a slot · Enter or A loads · S or X saves · Del or Y deletes · Esc or B closes";
        panel.addEventListener("click", (e) => {
            if (e.target === panel) return this.closeSlots();
            const card = e.target.closest("[data-slot]");
            if (card) {
                const slot = Number(card.dataset.slot);
                // A second tap on the selected slot loads it (or saves into an empty one)
                if (slot === this.slotsSelected) this.slotsAct(this.slotsUsed.has(slot) ? "load" : "save");
                else this.selectSlot(slot);
                return;
            }
            const button = e.target.closest("[data-act]");
            if (button) this.slotsAct(button.dataset.act);
        });
        this.slotsKey = (e) => {
            const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
            let handled = true;
            if (moves[e.key]) this.moveSlot(moves[e.key]);
            else if (e.key === "Enter" || e.key === " ") this.slotsAct(this.slotsUsed.has(this.slotsSelected) ? "load" : "save");
            else if (e.key === "s" || e.key === "S") this.slotsAct("save");
            else if (e.key === "l" || e.key === "L") this.slotsAct("load");
            else if (e.key === "Delete" || e.key === "Backspace") this.slotsAct("delete");
            else if (e.key === "Escape" || (e.key === "F2" && e.shiftKey)) this.closeSlots();
            else if (/^[1-9]$/.test(e.key)) this.selectSlot(Number(e.key));
            else handled = false;
            if (handled) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        };
        window.addEventListener("keydown", this.slotsKey, true);
        // Rotating the phone or resizing the window re-fits the grid
        this.slotsResize = () => {
            clearTimeout(this.slotsResizeTimer);
            this.slotsResizeTimer = setTimeout(() => this.renderSlots(), 200);
        };
        window.addEventListener("resize", this.slotsResize);
        this.slotsPanel = panel;
        this.slotsSelected = this.slot();
        this.slotsUsed = new Set();
        this.ejs.frontend.elements.parent.appendChild(panel);
        this.ejs.frontend.elements.parent.classList.add("ejs-slots-open");
        this.renderSlots();
    }
    closeSlots() {
        if (!this.slotsPanel) return;
        window.removeEventListener("keydown", this.slotsKey, true);
        window.removeEventListener("resize", this.slotsResize);
        for (const url of this.slotsUrls || []) URL.revokeObjectURL(url);
        this.slotsUrls = [];
        this.slotsPanel.remove();
        this.slotsPanel = null;
        this.ejs.frontend.elements.parent.classList.remove("ejs-slots-open");
        this.pendingThumb = null;
        if (this.slotsPausedGame && this.ejs.started) this.ejs.play();
        this.slotsPausedGame = false;
    }
    async renderSlots() {
        const panel = this.slotsPanel;
        if (!panel) return;
        const infos = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) => this.slotInfo(slot)));
        if (panel !== this.slotsPanel) return;
        for (const url of this.slotsUrls || []) URL.revokeObjectURL(url);
        this.slotsUrls = [];
        this.slotsUsed = new Set(infos.filter((i) => i.used).map((i) => i.slot));
        const grid = panel.querySelector(".ejs-slots-grid");
        grid.textContent = "";
        // Fit all nine slots without scrolling: five across on wide, short players (landscape), three otherwise
        const host = this.ejs.frontend.elements.parent;
        const wide = host.clientWidth / Math.max(1, host.clientHeight) > 1.45 && host.clientWidth > 560;
        const cols = wide ? 5 : 3;
        const rows = Math.ceil(9 / cols);
        const room = host.clientHeight * 0.9 - (matchMedia("(pointer: coarse)").matches ? 170 : 200);
        panel.style.setProperty("--slot-cols", cols);
        panel.style.setProperty("--slot-pic-h", Math.max(44, Math.floor(room / rows - 34)) + "px");
        const current = this.slot();
        for (const info of infos) {
            const card = document.createElement("div");
            card.tabIndex = 0;
            card.className = "ejs-slot" + (info.used ? " used" : "") + (info.slot === current ? " current" : "");
            card.dataset.slot = info.slot;
            card.setAttribute("role", "option");
            const pic = document.createElement("div");
            pic.className = "ejs-slot-pic";
            if (info.thumb) {
                const url = URL.createObjectURL(info.thumb);
                this.slotsUrls.push(url);
                pic.style.backgroundImage = "url(\"" + url + "\")";
            } else {
                pic.textContent = info.used ? "No picture" : "Empty";
            }
            const label = document.createElement("div");
            label.className = "ejs-slot-label";
            const when = info.used && info.time ? timeAgo(info.time) : info.used ? "saved" : "empty";
            label.innerHTML = "<strong></strong><span></span>";
            label.firstChild.textContent = "Slot " + info.slot + (info.slot === current ? " \u2605" : "");
            if (info.slot === current) card.title = "Active slot: F2 saves here and F4 loads from here";
            label.lastChild.textContent = when;
            card.append(pic, label);
            grid.appendChild(card);
        }
        this.selectSlot(this.slotsSelected, true);
    }
    selectSlot(slot, keepFocus) {
        if (!this.slotsPanel) return;
        this.slotsSelected = slot;
        for (const card of this.slotsPanel.querySelectorAll("[data-slot]")) {
            const on = Number(card.dataset.slot) === slot;
            card.classList.toggle("selected", on);
            card.setAttribute("aria-selected", String(on));
            if (on && !keepFocus) card.focus({ preventScroll: true });
        }
        const used = this.slotsUsed.has(slot);
        this.slotsPanel.querySelector("[data-act=load]").disabled = !used;
        this.slotsPanel.querySelector("[data-act=delete]").disabled = !used;
        this.slotsPanel.querySelector("[data-act=save]").textContent = used ? "Save over slot " + slot : "Save in slot " + slot;
    }
    moveSlot(delta) {
        let slot = this.slotsSelected + delta;
        if (slot < 1) slot += 9;
        if (slot > 9) slot -= 9;
        this.selectSlot(slot);
    }
    slotsAct(action) {
        const slot = this.slotsSelected;
        if (action === "close") return this.closeSlots();
        if (action === "delete") {
            if (!this.slotsUsed.has(slot)) return;
            this.deleteSlot(slot);
            this.renderSlots();
            return;
        }
        // The chosen slot also becomes the F2 / F4 slot
        this.ejs.frontend.changeSettingOption("save-state-slot", String(slot));
        if (action === "save") {
            this.quickSave();
            this.renderSlots();
        } else if (action === "load" && this.slotsUsed.has(slot)) {
            this.closeSlots();
            this.quickLoad();
        }
    }
    /** Controller in the slot picker: d-pad moves, A loads, X saves, Y deletes, B / Select+Up closes. */
    slotsPad(index) {
        const moves = { 12: -3, 13: 3, 14: -1, 15: 1 };
        if (moves[index]) this.moveSlot(moves[index]);
        else if (index === 0) this.slotsAct(this.slotsUsed.has(this.slotsSelected) ? "load" : "save");
        else if (index === 2) this.slotsAct("save");
        else if (index === 3) this.slotsAct("delete");
        else if (index === 1 || index === 9) this.closeSlots();
    }

    slotExists(slot) {
        try { return this.gm.FS.analyzePath("/" + slot + "-quick.state").exists; } catch (e) { return false; }
    }
    quickSave() {
        if (!this.canControl()) return;
        const slot = this.slot();
        if (this.gm.quickSave(slot)) {
            this.message("SAVED STATE TO SLOT " + slot, "success");
            this.rumble();
        } else {
            this.message("FAILED TO SAVE STATE", "error");
        }
    }
    quickLoad() {
        if (!this.canControl()) return;
        const slot = this.slot();
        if (!this.slotExists(slot)) {
            this.message("SLOT " + slot + " IS EMPTY", "error");
            return;
        }
        try { this.undoState = this.gm.getState(); } catch (e) { this.undoState = null; }
        this.gm.quickLoad(slot);
        this.message("LOADED STATE FROM SLOT " + slot, "success");
        this.rumble();
    }
    undoLoad() {
        if (!this.canControl()) return;
        if (!this.undoState) {
            this.message("NOTHING TO UNDO", "error");
            return;
        }
        const state = this.undoState;
        this.undoState = null;
        this.gm.loadState(state);
        this.message("UNDID LAST LOAD", "success");
    }
    changeSlot(delta) {
        let slot = this.slot() + delta;
        if (slot > 9) slot = 1;
        if (slot < 1) slot = 9;
        this.ejs.frontend.changeSettingOption("save-state-slot", String(slot));
        this.message("SAVE SLOT " + slot + (this.slotExists(slot) ? " (USED)" : " (EMPTY)"));
    }

    // ---------- autosave / resume ----------
    autoSave(force) {
        const E = this.ejs;
        if (!this.prefs.autoSave || !E.started || E.failedToStart || !this.gm) return;
        const now = Date.now();
        if (!force && now - this.lastAutoSave < 5000) return;
        try {
            if (!this.gm.supportsStates()) return;
            const data = this.gm.getState();
            this.lastAutoSave = now;
            E.storage.states.put(this.key("autosave"), { data: data, time: now });
        } catch (e) { /* core cannot save right now */ }
    }
    async offerResume() {
        if (!this.prefs.resumePrompt || this.ejs.config.loadState) return;
        const record = await this.ejs.storage.states.get(this.key("autosave"));
        if (!record || !record.data) return;
        const minutes = Math.max(1, Math.round((Date.now() - record.time) / 60000));
        const ago = minutes < 60 ? minutes + " min ago" : minutes < 1440 ? Math.round(minutes / 60) + " h ago" : Math.round(minutes / 1440) + " days ago";
        this.toast("Resume where you left off (" + ago + ")?", [
            ["Resume", () => {
                try { this.undoState = this.gm.getState(); } catch (e) { /* ignore */ }
                this.gm.loadState(new Uint8Array(record.data));
                this.message("RESUMED", "success");
            }],
            ["Start fresh", null, true]
        ], 12000);
    }
    toast(text, buttons, timeout) {
        const parent = this.ejs.frontend.elements.parent;
        const box = document.createElement("div");
        box.className = "ejs-enh-toast";
        const label = document.createElement("span");
        label.textContent = text;
        box.appendChild(label);
        const close = () => {
            clearTimeout(timer);
            box.remove();
        };
        for (const [title, action, secondary] of buttons) {
            const button = document.createElement("button");
            button.textContent = title;
            if (secondary) button.className = "secondary";
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                close();
                if (action) action();
            });
            box.appendChild(button);
        }
        parent.appendChild(box);
        const timer = setTimeout(close, timeout || 8000);
        return close;
    }

    // ---------- hotkeys ----------
    bindHotkeys() {
        const actions = {
            F1: () => this.togglePanel(),
            F2: (e) => (e.shiftKey ? this.toggleSlots() : this.quickSave()),
            F3: (e) => this.changeSlot(e.shiftKey ? -1 : 1),
            F4: (e) => (e.shiftKey ? this.undoLoad() : this.quickLoad()),
            F5: (e) => (e.shiftKey ? this.reset() : this.togglePause()),
            F6: () => this.toggleSetting("fastForward", "isFastForward", "FAST FORWARD"),
            F7: () => this.toggleSetting("slowMotion", "isSlowMotion", "SLOW MOTION"),
            F8: (e) => (e.shiftKey && this.ejs.depth25 ? this.ejs.depth25.toggle() : this.screenshot()),
            F9: (e) => (e.shiftKey && this.ejs.performance ? this.ejs.performance.toggleMode() : this.toggleMute()),
            F10: (e) => (e.shiftKey && this.ejs.performance ? this.ejs.performance.toggleStats() : this.setPref("fps", !this.prefs.fps)),
            F11: () => this.ejs.toggleFullscreen(!(document.fullscreenElement || document.webkitFullscreenElement))
        };
        this.onKey = (e) => {
            const action = actions[e.key];
            if (!action || !this.ejs.started) return;
            const target = e.target;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
            const front = this.ejs.frontend;
            if (front.isRemapping()) return;
            if (this.slotsPanel && e.key !== "F1") return; // the slot picker handles its own keys
            if (e.key !== "F1" && (this.panel || front.isPopupOpen() || front.isSettingsMenuOpen())) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.type === "keydown" && !e.repeat) action(e);
        };
        window.addEventListener("keydown", this.onKey, true);
        window.addEventListener("keyup", this.onKey, true);
    }
    togglePause() {
        if (!this.canControl()) return;
        this.autoPaused = false;
        this.ejs.togglePlaying();
        this.message(this.ejs.paused ? "PAUSED" : "RESUMED");
    }
    reset() {
        if (!this.canControl()) return;
        try { this.undoState = this.gm.getState(); } catch (e) { /* ignore */ }
        this.gm.restart();
        this.message("GAME RESET (SHIFT+F4 TO UNDO)");
    }
    toggleSetting(setting, flag, label) {
        if (!this.canControl()) return;
        const on = !this.ejs[flag];
        this.ejs.frontend.changeSettingOption(setting, on ? "enabled" : "disabled");
        this.message(label + (on ? " ON" : " OFF"));
    }
    toggleMute() {
        const E = this.ejs;
        if (E.muted) {
            if (!E.volume) E.volume = 0.5;
            E.muted = false;
            E.setVolume(E.volume);
            this.message("SOUND ON");
        } else {
            E.muted = true;
            E.setVolume(0);
            this.message("MUTED");
        }
    }
    screenshot() {
        const E = this.ejs;
        const name = E.getBaseFileName() + "-" + E.getFileNameTimestamp(new Date());
        E.screenshot((blob, format) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name + "." + format;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            this.message("SCREENSHOT SAVED", "success");
        });
    }
    setPref(name, value) {
        this.prefs[name] = value;
        this.savePrefs();
        if (name === "fps") this.applyFps();
        if (name === "scanlines") this.applyScanlines();
        if (name === "wakeLock") value ? this.requestWakeLock() : this.wakeLock && this.wakeLock.release().catch(() => {});
    }

    // ---------- panel ----------
    togglePanel() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
            if (this.pausedByPanel) this.ejs.play();
            this.pausedByPanel = false;
            return;
        }
        this.pausedByPanel = !this.ejs.paused && this.canControl();
        if (this.pausedByPanel) this.ejs.pause();
        const panel = document.createElement("div");
        panel.className = "ejs-enh-panel";
        const box = document.createElement("div");
        panel.appendChild(box);
        const title = document.createElement("h3");
        title.textContent = "Hotkeys and options";
        box.appendChild(title);

        const played = (JSON.parse(localStorage.getItem(PLAYTIME_KEY) || "{}")[this.playKey]) || 0;
        const used = [];
        for (let s = 1; s <= 9; s++) if (this.slotExists(s)) used.push(s);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${this.base}: played ${formatDuration(played)}. Save slot ${this.slot()} selected; slots in use: ${used.length ? used.join(", ") : "none"}.`;
        box.appendChild(meta);

        const table = document.createElement("table");
        for (const [keys, text] of HOTKEYS) {
            const row = table.insertRow();
            row.insertCell().textContent = keys;
            row.insertCell().textContent = text;
        }
        box.appendChild(table);
        for (const name of Object.keys(PREF_LABELS)) {
            const label = document.createElement("label");
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = !!this.prefs[name];
            input.addEventListener("change", () => this.setPref(name, input.checked));
            label.appendChild(input);
            label.append(" " + PREF_LABELS[name]);
            box.appendChild(label);
        }
        const slotsButton = document.createElement("button");
        slotsButton.type = "button";
        slotsButton.textContent = "Save slots… (Shift+F2)";
        slotsButton.style.marginRight = "8px";
        slotsButton.addEventListener("click", () => this.toggleSlots());
        box.appendChild(slotsButton);
        if (this.ejs.depth25) this.ejs.depth25.renderPanel(box);
        if (this.ejs.performance) this.ejs.performance.renderPanel(box);
        const close = document.createElement("button");
        close.textContent = "Close (F1)";
        close.style.marginTop = "10px";
        close.addEventListener("click", () => this.togglePanel());
        box.appendChild(close);
        panel.addEventListener("click", (e) => {
            if (e.target === panel) this.togglePanel();
        });
        this.ejs.frontend.elements.parent.appendChild(panel);
        this.panel = panel;
    }

    // ---------- gamepad ----------
    bindGamepad() {
        const pad = this.ejs.gamepad;
        if (!pad || pad.enhanced) return;
        pad.enhanced = true;
        const prevDown = pad.listeners.buttondown;
        const prevUp = pad.listeners.buttonup;
        const prevDisconnect = pad.listeners.disconnected;
        const swallowed = new Set();
        const combos = {
            5: () => this.quickSave(),
            4: () => this.quickLoad(),
            7: () => this.toggleSetting("fastForward", "isFastForward", "FAST FORWARD"),
            6: () => this.changeSlot(1),
            9: () => this.togglePause(),
            12: () => this.toggleSlots()
        };
        const selectHeld = (index) => {
            const record = pad.gamepads.find((p) => p.index === index);
            return !!(record && record.buttons[8] && record.buttons[8].pressed);
        };
        pad.listeners.buttondown = (e) => {
            // While the slot picker is open the controller drives it instead of the game
            if (this.slotsPanel) {
                swallowed.add(e.gamepadIndex + ":" + e.index);
                this.slotsPad(e.index);
                return;
            }
            if (this.prefs.padCombos && this.ejs.started && combos[e.index] && selectHeld(e.gamepadIndex)) {
                swallowed.add(e.gamepadIndex + ":" + e.index);
                combos[e.index]();
                return;
            }
            if (prevDown) prevDown(e);
        };
        pad.listeners.buttonup = (e) => {
            if (swallowed.delete(e.gamepadIndex + ":" + e.index)) return;
            if (prevUp) prevUp(e);
        };
        pad.listeners.disconnected = (e) => {
            if (prevDisconnect) prevDisconnect(e);
            if (this.prefs.autoPause && this.canControl() && !this.ejs.paused) {
                this.ejs.pause();
                this.message("CONTROLLER DISCONNECTED - PAUSED", "error", 5000);
            }
        };
    }

    // ---------- page lifecycle ----------
    bindVisibility() {
        const onHide = () => {
            this.autoSave();
            if (this.prefs.autoPause && this.canControl() && !this.ejs.paused) {
                this.ejs.pause();
                this.autoPaused = true;
            }
        };
        const onShow = () => {
            if (this.autoPaused && this.ejs.started) this.ejs.play();
            this.autoPaused = false;
            this.requestWakeLock();
        };
        document.addEventListener("visibilitychange", () => (document.hidden ? onHide() : onShow()));
        window.addEventListener("pagehide", () => this.autoSave(true));
    }
    setupSramFlush() {
        const E = this.ejs;
        if (E.config.fixedSaveInterval || E.getSettingValue("save-save-interval") || E.saveFileExt === false) return;
        E.startSaveInterval(30000);
    }
    async requestWakeLock() {
        if (!this.prefs.wakeLock || !("wakeLock" in navigator) || document.hidden || !this.ejs.started) return;
        if (this.wakeLock && !this.wakeLock.released) return;
        try { this.wakeLock = await navigator.wakeLock.request("screen"); } catch (e) { /* not allowed */ }
    }
    setupMediaSession() {
        if (!("mediaSession" in navigator) || typeof MediaMetadata !== "function") return;
        try {
            navigator.mediaSession.metadata = new MediaMetadata({ title: this.base, artist: "EmulatorJS", album: this.ejs.getCore(true) });
            navigator.mediaSession.setActionHandler("play", () => this.canControl() && this.ejs.play());
            navigator.mediaSession.setActionHandler("pause", () => this.canControl() && this.ejs.pause());
        } catch (e) { /* unsupported action */ }
    }
    setupCursorHide() {
        const parent = this.ejs.frontend.elements.parent;
        let timer = null;
        const wake = () => {
            parent.classList.remove("ejs-enh-cursor-hidden");
            clearTimeout(timer);
            if (!this.prefs.cursorHide) return;
            timer = setTimeout(() => {
                if (!this.ejs.paused && !this.panel) parent.classList.add("ejs-enh-cursor-hidden");
            }, 2500);
        };
        parent.addEventListener("mousemove", wake);
        parent.addEventListener("mousedown", wake);
        wake();
    }
    applyScanlines() {
        const host = this.ejs.frontend.canvas && this.ejs.frontend.canvas.parentElement;
        if (!host) return;
        let overlay = host.querySelector(".ejs-enh-scanlines");
        if (this.prefs.scanlines && !overlay) {
            overlay = document.createElement("div");
            overlay.className = "ejs-enh-scanlines";
            host.appendChild(overlay);
        } else if (!this.prefs.scanlines && overlay) {
            overlay.remove();
        }
    }
    applyFps() {
        if (!this.prefs.fps) {
            if (this.fpsElem) this.fpsElem.remove();
            clearInterval(this.fpsTimer);
            this.fpsElem = null;
            return;
        }
        if (this.fpsElem) return;
        this.fpsElem = document.createElement("div");
        this.fpsElem.className = "ejs-enh-fps";
        this.fpsElem.textContent = "-- fps";
        this.ejs.frontend.elements.parent.appendChild(this.fpsElem);
        let last = this.gm.getFrameNum();
        let lastTime = performance.now();
        this.fpsTimer = this.every(1000, () => {
            const frame = this.gm.getFrameNum();
            const time = performance.now();
            const fps = Math.round((frame - last) * 1000 / (time - lastTime));
            last = frame;
            lastTime = time;
            if (this.fpsElem) this.fpsElem.textContent = (this.ejs.paused ? "paused" : fps + " fps");
        });
    }
    trackPlaytime() {
        this.every(10000, () => {
            if (!this.ejs.started || this.ejs.paused || document.hidden) return;
            try {
                const all = JSON.parse(localStorage.getItem(PLAYTIME_KEY) || "{}");
                all[this.playKey] = (all[this.playKey] || 0) + 10;
                localStorage.setItem(PLAYTIME_KEY, JSON.stringify(all));
            } catch (e) { /* storage unavailable */ }
        });
    }
    watchBattery() {
        if (!navigator.getBattery) return;
        navigator.getBattery().then((battery) => {
            const check = () => {
                if (!battery.charging && battery.level <= 0.15 && !this.batteryWarned) {
                    this.batteryWarned = true;
                    this.autoSave(true);
                    this.message("BATTERY LOW - RESUME POINT SAVED", "error", 6000);
                }
            };
            battery.addEventListener("levelchange", check);
            battery.addEventListener("chargingchange", check);
            check();
        }).catch(() => {});
    }
    rotateHint() {
        const E = this.ejs;
        if (!(E.isMobile || E.hasTouchScreen) || E.getCore(true) === "nds") return;
        // The site's phone view has its own portrait layout (game on top, controls below), so no hint is needed there
        if (document.documentElement.classList.contains("m-phone")) return;
        if (window.innerHeight > window.innerWidth && !sessionStorage.getItem("ejs-rotate-hint")) {
            sessionStorage.setItem("ejs-rotate-hint", "1");
            this.message("ROTATE YOUR DEVICE FOR A BIGGER PICTURE", undefined, 5000);
        }
    }
    watchContextLoss() {
        const canvas = this.ejs.frontend.canvas;
        canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            this.toast("The browser reset the graphics. Reload to continue (your resume point is kept).", [
                ["Reload", () => location.reload()]
            ], 600000);
        });
    }
}

export { EJS_Enhancements };
