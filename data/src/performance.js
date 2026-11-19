/**
 * Performance features for EmulatorJSMod: measurement (stats overlay, startup timing, slow-game detection,
 * software-graphics detection), tuning (performance mode, render scale, auto frameskip, shader bypass,
 * low-latency canvas, run-ahead, refresh-rate adaptation, audio latency profiles), per-game profiles and a
 * low-battery power saver. Settings that RetroArch only reads at boot (run-ahead, swap interval, audio
 * latency, canvas mode) apply from the next start; the rest apply immediately.
 */
const STORE_KEY = "ejs-perf";
const DEFAULTS = {
    renderScale: 1,
    performanceMode: false,
    runAhead: false,
    lowLatency: true,
    audioLatency: 64,
    powerSaver: true,
    pictureBuffer: true,
    leanSurface: true,
    audioSuspend: true
};
// Cores that may draw 3D straight to the screen surface and need its depth and stencil buffers
const THREE_D_CORES = ["mupen64plus_next", "parallel_n64", "ppsspp", "azahar", "citra", "flycast", "beetle_psx_hw", "mednafen_psx_hw",
    "melonds", "desmume", "desmume2015", "dolphin", "yabasanshiro", "kronos", "dosbox_pure"];
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|basic render|software|mesa offscreen/i;
const WARMUP_MS = 8000;
const SLOW_SECONDS = 10;
const SLOW_SPEED = 0.9;

function readStore() {
    try {
        const data = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        return { last: data.last || {}, games: data.games || {} };
    } catch (e) {
        return { last: {}, games: {} };
    }
}

class EJS_Performance {
    constructor(ejs) {
        this.ejs = ejs;
        this.gameKey = (typeof ejs.config.gameName === "string" && ejs.config.gameName) || "default";
        const store = readStore();
        // Feature 13: per-game profile, falling back to the settings last used for any game
        this.profile = Object.assign({}, DEFAULTS, store.last, store.games[this.gameKey] || {});
        this.marks = { construct: performance.now() };
        this.timing = null;
        this.refreshHz = null;
        this.expectedFps = 60;
        this.speedHistory = [];
        this.frameTimes = [];
        this.slowSeconds = 0;
        this.slowOffered = false;
        this.saved = { shader: null, frameskip: {} };
        this.installLowLatencyCanvas();
        this.measureRefreshRate();
        ejs.on("start", () => this.onStart());
        ejs.on("pause", () => this.updateAudioPower());
        ejs.on("play", () => this.updateAudioPower());
        ejs.on("exit", () => this.stop());
    }

    // ---------- profile ----------
    saveProfile() {
        const store = readStore();
        const values = Object.assign({}, this.profile);
        store.games[this.gameKey] = values;
        store.last = values;
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage full */ }
    }
    set(name, value) {
        this.profile[name] = value;
        this.saveProfile();
        if (name === "renderScale" || name === "pictureBuffer") this.applyRenderScale();
        if (name === "performanceMode") this.applyPerformanceMode();
        if (name === "audioSuspend") this.updateAudioPower();
    }

    // ---------- Feature 2: startup timing ----------
    mark(name) {
        this.marks[name] = performance.now();
    }
    buildTiming() {
        const m = this.marks;
        const span = (a, b) => (m[a] !== undefined && m[b] !== undefined ? Math.max(0, Math.round(m[b] - m[a])) : null);
        this.timing = {
            core: span("construct", "coreReady"),
            game: span("coreReady", "gameReady"),
            boot: span("gameReady", "started"),
            total: span("construct", "started")
        };
        if (this.ejs.debug) console.log("[EJS Performance] Startup timing (ms):", this.timing);
    }

    // ---------- Feature 8: low-latency canvas ----------
    /**
     * Context options for the game canvas, applied when RetroArch creates its WebGL context:
     * - desynchronized (feature 8): frames go to the screen without waiting for the page compositor.
     * - round 8, lean opaque surface: alpha off, so the browser composites the game as an opaque layer (no blending
     *   with the page, eligible for hardware overlays), and for 2D cores no depth or stencil buffer on the screen
     *   surface, which those cores never use. 3D-capable cores keep both.
     */
    installLowLatencyCanvas() {
        HTMLCanvasElement.prototype.ejsPerformance = this;
        if (HTMLCanvasElement.prototype.ejsContextPatched) return;
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.ejsContextPatched = true;
        HTMLCanvasElement.prototype.getContext = function (type, attributes) {
            const perf = HTMLCanvasElement.prototype.ejsPerformance;
            const game = perf && perf.ejs.frontend && perf.ejs.frontend.canvas;
            if (game && this === game && /webgl/.test(String(type))) {
                attributes = perf.contextAttributes(attributes);
                perf.surface = attributes;
            }
            return original.call(this, type, attributes);
        };
    }
    usesDepth() {
        const core = String(this.ejs.getCore() || "");
        return THREE_D_CORES.includes(core) || /_hw$|gl$/.test(core) || this.ejs.config.keepDepthBuffer === true;
    }
    contextAttributes(requested) {
        const out = Object.assign({ powerPreference: "high-performance" }, requested || {});
        if (this.profile.lowLatency) out.desynchronized = true;
        // 2.5D reads every finished frame from this canvas, so the frame must still be there when it does
        if (this.ejs.wantsDepth25) out.preserveDrawingBuffer = true;
        if (this.profile.leanSurface !== false) {
            out.alpha = false;
            out.premultipliedAlpha = false;
            if (!this.usesDepth()) {
                out.depth = false;
                out.stencil = false;
            }
            out.antialias = false;
        }
        return out;
    }
    describeSurface() {
        const a = this.surface;
        if (!a) return "?";
        if (this.profile.leanSurface === false) return "standard (lean surface off)";
        return (a.alpha === false ? "opaque" : "transparent") + ", " + (a.depth === false ? "no depth/stencil (2D core)" : "depth/stencil kept (3D core)");
    }

    // ---------- Feature 10: refresh-rate adaptation ----------
    measureRefreshRate() {
        const times = [];
        const step = (t) => {
            times.push(t);
            if (times.length < 31) {
                requestAnimationFrame(step);
                return;
            }
            const deltas = times.slice(1).map((v, i) => v - times[i]).sort((a, b) => a - b);
            const median = deltas[Math.floor(deltas.length / 2)];
            this.refreshHz = median > 0 ? Math.round(1000 / median) : null;
        };
        requestAnimationFrame(step);
    }
    /** RetroArch swap interval: on 120/180/240 Hz screens present every 2nd/3rd/4th refresh so games keep 60 fps. */
    swapInterval() {
        const hz = this.refreshHz;
        if (!hz) return 1;
        for (const multiple of [4, 3, 2]) {
            if (Math.abs(hz - 60 * multiple) <= 4) return multiple;
        }
        return 1;
    }

    // ---------- Features 9, 10, 11: settings RetroArch reads at boot ----------
    retroarchCfg() {
        let cfg = "";
        cfg += "video_swap_interval = " + this.swapInterval() + "\n";
        if (this.profile.runAhead && !this.profile.performanceMode) {
            cfg += "run_ahead_enabled = true\nrun_ahead_frames = 1\nrun_ahead_secondary_instance = false\nrun_ahead_hide_warnings = true\n";
        } else {
            cfg += "run_ahead_enabled = false\n";
        }
        return cfg;
    }
    audioLatency() {
        const value = parseInt(this.profile.audioLatency, 10);
        return [32, 64, 96, 128].includes(value) ? value : 64;
    }

    // ---------- start ----------
    onStart() {
        this.mark("started");
        this.buildTiming();
        this.detectRenderer();
        this.applyRenderScale();
        this.watchLayout();
        if (this.profile.performanceMode) this.applyPerformanceMode();
        this.startMonitor();
        this.watchBattery();
        this.watchAudioPower();
    }
    stop() {
        this.stopped = true;
        cancelAnimationFrame(this.frame);
        clearInterval(this.speedTimer);
        clearInterval(this.layoutTimer);
        clearInterval(this.audioTimer);
        if (this.onAudioVisibility) document.removeEventListener("visibilitychange", this.onAudioVisibility);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.statsElem) this.statsElem.remove();
    }

    // ---------- Feature 12: software graphics detection ----------
    detectRenderer() {
        const canvas = this.ejs.frontend.canvas;
        let gl = null;
        try { gl = canvas.getContext("webgl2") || canvas.getContext("webgl"); } catch (e) { gl = null; }
        if (!gl) return;
        this.webglVersion = (typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext) ? 2 : 1;
        const info = gl.getExtension("WEBGL_debug_renderer_info");
        this.renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        this.softwareRendering = SOFTWARE_RENDERER.test(this.renderer);
        if (this.softwareRendering && !sessionStorage.getItem("ejs-sw-warned")) {
            sessionStorage.setItem("ejs-sw-warned", "1");
            this.notify("Graphics are running in software (" + this.renderer.split("(")[0].trim() + "). Turn on hardware acceleration in your browser settings for much better speed.", [
                ["Use performance mode", () => this.set("performanceMode", true)],
                ["OK", null, true]
            ], 15000);
        }
    }

    // ---------- Feature 5 and round 7: render buffer layout ----------
    applyRenderScale() {
        this.layoutKey = null;
        this.layoutCanvas();
    }
    /** The game's picture: aspect ratio and native line count, with video rotation applied. */
    picture() {
        const gm = this.ejs.gameManager;
        try {
            let aspect = gm.getVideoDimensions("aspect");
            let width = gm.getVideoDimensions("width");
            let height = gm.getVideoDimensions("height");
            const rotation = parseInt(this.ejs.getSettingValue("videoRotation") || this.ejs.videoRotation || 0, 10);
            if (rotation === 1 || rotation === 3) {
                aspect = 1 / aspect;
                [width, height] = [height, width];
            }
            if (aspect > 0.2 && aspect < 5 && height >= 64 && width >= 64) return { aspect, width, height };
        } catch (e) { /* core without video dimensions */ }
        return null;
    }
    /**
     * Picture-sized render buffer. RetroArch sizes its drawing buffer from the canvas box, and EmulatorJS makes that
     * box the whole player (letterbox bars included) at full device-pixel resolution. Here the canvas box becomes the
     * game's picture only, and on high-density screens the buffer is a whole multiple of the game's own lines (x3 or
     * more) that the browser scales the last step: fewer pixels drawn, evenly sized pixels on screen.
     */
    layoutCanvas() {
        const canvas = this.ejs.frontend && this.ejs.frontend.canvas;
        const parent = canvas && canvas.parentElement;
        if (!parent || this.stopped) return;
        const pw = parent.clientWidth;
        const ph = parent.clientHeight;
        if (!pw || !ph) return;
        const dpr = window.devicePixelRatio || 1;
        // Some browsers (seen on phones) give RetroArch a buffer of CSS pixels instead of device pixels; once that
        // has been measured, the box is sized in RetroArch's own unit so the picture stays sharp
        const ratio = this.bufferRatio || dpr;
        const scale = this.effectiveScale();
        const mouse = !!(this.ejs.defaultCoreOpts && this.ejs.defaultCoreOpts.supportsMouse);
        const pic = this.profile.pictureBuffer !== false && !mouse ? this.picture() : null;
        const shader = this.ejs.getSettingValue("shader");
        const shaderOn = !!shader && shader !== "disabled";
        let mode = "full";
        let dw = pw;
        let dh = ph;
        let bw = pw * dpr;
        let bh = ph * dpr;
        let prescale = 0;
        let offsetX = 0;
        let offsetY = 0;
        if (pic) {
            mode = "picture";
            if (pw / ph > pic.aspect) dw = ph * pic.aspect;
            else dh = pw / pic.aspect;
            // Touch gamepad at the sides (landscape): if the picture would run under the d-pad or the buttons, it is
            // made a little smaller so the whole game stays visible between them
            const sides = this.gamepadSides(pw, ph);
            if (sides && (pw - dw) / 2 < Math.max(sides.left, sides.right)) {
                const room = pw - sides.left - sides.right;
                if (room > pw * 0.4) {
                    dw = Math.min(room, ph * pic.aspect);
                    dh = dw / pic.aspect;
                    offsetX = sides.left + (room - dw) / 2 - (pw - dw) / 2;
                    offsetY = (ph - dh) / 2;
                }
            }
            bw = dw * dpr;
            bh = dh * dpr;
            // Shaders (CRT and the like) need every screen pixel, and below x3 the browser's last step would look soft
            const k = Math.floor(bh / pic.height + 1e-6);
            if (!shaderOn && k >= 3 && k * pic.height < bh - 0.5) {
                prescale = k;
                bh = k * pic.height;
                bw = bh * (dw / dh);
            }
        }
        bw *= scale;
        bh *= scale;
        const key = [pw, ph, dpr, Math.round(bw), Math.round(bh), Math.round(dw), Math.round(dh), Math.round(offsetX), Math.round(offsetY)].join(",");
        if (key === this.layoutKey) return;
        this.layoutKey = key;
        this.layout = { mode, prescale, picture: [Math.round(dw * dpr), Math.round(dh * dpr)], full: [Math.round(pw * dpr), Math.round(ph * dpr)] };
        const style = canvas.style;
        if (mode === "full" && scale >= 1 && Math.abs(ratio - dpr) < 0.05) {
            for (const name of ["width", "height", "max-width", "max-height", "transform", "transform-origin", "left", "top"]) style.removeProperty(name);
        } else {
            const cssW = bw / ratio;
            const cssH = bh / ratio;
            // The smaller box sets RetroArch's buffer size; the transform shows it at the picture's size
            // "important" so a page that embeds the player with its own canvas rules (ObsoleteMod) cannot undo
            // the box size while the scale still applies, which would shrink the picture
            const set = (name, value) => style.setProperty(name, value, "important");
            set("max-width", "none");
            set("max-height", "none");
            set("width", cssW + "px");
            set("height", cssH + "px");
            set("transform-origin", "0 0");
            set("transform", "scale(" + (dw / cssW) + "," + (dh / cssH) + ")");
            // Centred across, top-aligned like the original canvas (object-position: top)
            set("left", ((pw - dw) / 2 + offsetX) + "px");
            if (offsetY) set("top", offsetY + "px");
            else style.removeProperty("top");
        }
        window.dispatchEvent(new Event("resize"));
    }
    /** Buffer pixels per CSS pixel of the canvas box, as RetroArch actually sized it (normally devicePixelRatio). */
    measureBufferRatio() {
        const canvas = this.ejs.frontend.canvas;
        const box = canvas && canvas.clientWidth;
        if (!box || !canvas.width) return;
        const measured = canvas.width / box;
        const expected = this.bufferRatio || window.devicePixelRatio || 1;
        // Only trust a reading seen twice in a row (RetroArch resizes a moment after the box changes)
        if (Math.abs(measured - expected) / expected > 0.05) {
            if (this.pendingRatio && Math.abs(this.pendingRatio - measured) / measured < 0.02) {
                this.bufferRatio = measured;
                this.pendingRatio = null;
                this.layoutKey = null;
            } else {
                this.pendingRatio = measured;
            }
        } else {
            this.pendingRatio = null;
        }
    }
    /** Width taken by the on-screen d-pad and buttons on each side, when the touch gamepad is shown beside the picture. */
    gamepadSides(pw, ph) {
        if (pw <= ph) return null;
        const front = this.ejs.frontend;
        const pad = front && front.virtualGamepad;
        if (!pad || pad.style.display === "none" || !pad.offsetParent) return null;
        const host = this.ejs.frontend.canvas.parentElement.getBoundingClientRect();
        const left = pad.querySelector(".ejs_virtualGamepad_left");
        const right = pad.querySelector(".ejs_virtualGamepad_right");
        if (!left || !right) return null;
        const l = left.getBoundingClientRect();
        const r = right.getBoundingClientRect();
        if (!l.width || !r.width) return null;
        return { left: Math.max(0, l.right - host.left + 6), right: Math.max(0, host.right - r.left + 6) };
    }
    watchLayout() {
        const parent = this.ejs.frontend.canvas && this.ejs.frontend.canvas.parentElement;
        if (parent && typeof ResizeObserver === "function") {
            this.resizeObserver = new ResizeObserver(() => this.layoutCanvas());
            this.resizeObserver.observe(parent);
        }
        // Games change resolution (menus, hi-res modes, PAL/NTSC); shader and rotation settings change too
        this.layoutTimer = setInterval(() => {
            this.measureBufferRatio();
            this.layoutCanvas();
        }, 1000);
    }
    effectiveScale() {
        const chosen = Number(this.profile.renderScale) || 1;
        // Mouse and light-gun cores need the canvas at full size so pointer positions stay exact
        if (this.ejs.defaultCoreOpts && this.ejs.defaultCoreOpts.supportsMouse) return 1;
        // Performance mode renders at no more than 75 % of the display resolution
        return this.profile.performanceMode ? Math.min(chosen, 0.75) : chosen;
    }

    // ---------- Features 4, 6, 7: performance mode ----------
    applyPerformanceMode() {
        const on = !!this.profile.performanceMode;
        this.applyRenderScale();
        this.applyShaderBypass(on);
        this.applyFrameskip(on);
    }
    applyShaderBypass(on) {
        const front = this.ejs.frontend;
        if (!front || !front.changeSettingOption) return;
        const current = this.ejs.getSettingValue("shader");
        if (on) {
            if (current && current !== "disabled") {
                this.saved.shader = current;
                front.changeSettingOption("shader", "disabled");
            }
        } else if (this.saved.shader) {
            front.changeSettingOption("shader", this.saved.shader);
            this.saved.shader = null;
        }
    }
    /** Core options whose key ends in "frameskip" (e.g. fceumm/gambatte/mgba/genesis_plus_gx builds that offer one). */
    frameskipOptions() {
        if (this.frameskipList) return this.frameskipList;
        const list = [];
        const gm = this.ejs.gameManager;
        try {
            const json = gm.getCoreOptionsJSON && gm.getCoreOptionsJSON();
            if (json) {
                for (const option of json.options) {
                    if (/frameskip$/i.test(option.key)) list.push({ key: option.key, values: option.values.map((v) => v.value), defaultValue: option.default });
                }
            } else {
                // Older format, one option per line: "key|default; value1|value2|..."
                for (const line of String(gm.getCoreOptions() || "").split("\n")) {
                    const [head, rest] = line.split("; ");
                    if (!head || !rest) continue;
                    const [key, defaultValue] = head.split("|");
                    const values = rest.split("|").map((v) => v.replace("(Default) ", "").trim());
                    if (/frameskip$/i.test(key)) list.push({ key, values, defaultValue: defaultValue || values[0] });
                }
            }
        } catch (e) { /* core options unavailable */ }
        this.frameskipList = list;
        return list;
    }
    applyFrameskip(on) {
        const gm = this.ejs.gameManager;
        if (!gm) return;
        for (const option of this.frameskipOptions()) {
            const target = option.values.find((v) => /^auto$/i.test(v)) || option.values.find((v) => /auto/i.test(v)) || option.values.find((v) => v === "1");
            if (!target) continue;
            if (on) {
                if (!(option.key in this.saved.frameskip)) this.saved.frameskip[option.key] = this.ejs.getSettingValue(option.key) || option.defaultValue;
                gm.setVariable(option.key, target);
            } else if (option.key in this.saved.frameskip) {
                gm.setVariable(option.key, this.saved.frameskip[option.key]);
                delete this.saved.frameskip[option.key];
            }
        }
    }
    toggleMode() {
        this.set("performanceMode", !this.profile.performanceMode);
        this.message(this.profile.performanceMode ? "PERFORMANCE MODE ON" : "PERFORMANCE MODE OFF");
    }

    // ---------- Features 1, 3: monitor, stats, slow-game detection ----------
    startMonitor() {
        const gm = this.ejs.gameManager;
        let lastFrame = gm.getFrameNum();
        let lastTime = performance.now();
        let lastRaf = 0;
        const loop = (t) => {
            if (this.stopped) return;
            if (lastRaf && !this.ejs.paused && !document.hidden) {
                this.frameTimes.push(t - lastRaf);
                if (this.frameTimes.length > 120) this.frameTimes.shift();
            }
            lastRaf = t;
            this.frame = requestAnimationFrame(loop);
        };
        this.frame = requestAnimationFrame(loop);
        this.speedTimer = setInterval(() => {
            const now = performance.now();
            const frame = gm.getFrameNum();
            const fps = (frame - lastFrame) * 1000 / (now - lastTime);
            lastFrame = frame;
            lastTime = now;
            if (this.ejs.paused || document.hidden || this.ejs.isFastForward || this.ejs.isSlowMotion) {
                this.slowSeconds = 0;
                this.updateStats(null);
                return;
            }
            // PAL games run at 50 fps: lock the target once the rate settles near 50
            if (Math.abs(fps - 50) < 2 && this.speedHistory.length < 5) this.expectedFps = 50;
            const speed = fps / this.expectedFps;
            this.lastFps = fps;
            this.speedHistory.push(speed);
            if (this.speedHistory.length > 30) this.speedHistory.shift();
            this.updateStats(speed);
            if (now - this.marks.started < WARMUP_MS) return;
            this.slowSeconds = speed < SLOW_SPEED ? this.slowSeconds + 1 : 0;
            if (this.slowSeconds >= SLOW_SECONDS && !this.slowOffered && !this.profile.performanceMode) {
                this.slowOffered = true;
                this.notify("This game is running at " + Math.round(speed * 100) + "% speed on this device.", [
                    ["Turn on performance mode", () => this.set("performanceMode", true)],
                    ["Not now", null, true]
                ], 15000);
            }
        }, 1000);
    }
    toggleStats() {
        if (this.statsElem) {
            this.statsElem.remove();
            this.statsElem = null;
            return;
        }
        this.statsElem = document.createElement("div");
        this.statsElem.className = "ejs-perf-stats";
        this.ejs.frontend.elements.parent.appendChild(this.statsElem);
        this.updateStats(this.speedHistory[this.speedHistory.length - 1] || null);
    }
    stats() {
        const times = this.frameTimes.slice();
        const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        const worst = times.length ? Math.max(...times) : 0;
        const budget = 1000 / (this.refreshHz || 60);
        const dropped = times.filter((t) => t > budget * 1.5).length;
        const canvas = this.ejs.frontend.canvas;
        const memory = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + " MB" : "n/a";
        const variant = (this.ejs.usingThreads ? "threaded" : "single-thread") + ", " + (this.ejs.webgl2Enabled && this.ejs.supportsWebgl2 ? "WebGL2 build" : "legacy WebGL build");
        return { avg, worst, dropped, memory, variant, size: canvas ? canvas.width + "×" + canvas.height : "?", scale: this.effectiveScale() };
    }
    updateStats(speed) {
        if (!this.statsElem) return;
        const s = this.stats();
        const lines = [
            "Speed      " + (speed === null ? (this.ejs.paused ? "paused" : "—") : Math.round(speed * 100) + "% (" + (this.lastFps || 0).toFixed(1) + "/" + this.expectedFps + " fps)"),
            "Frame time " + s.avg.toFixed(1) + " ms avg, " + s.worst.toFixed(1) + " ms worst, " + s.dropped + " late of last 120",
            "Display    " + (this.refreshHz || "?") + " Hz, swap interval " + this.swapInterval(),
            "Render     " + s.size + " (" + Math.round(s.scale * 100) + "%)" + (this.profile.performanceMode ? ", performance mode" : ""),
            "Buffer     " + this.describeLayout(),
            "Surface    " + this.describeSurface(),
            "Audio      " + this.describeAudio(),
            "GPU        " + (this.renderer ? this.renderer.replace(/^ANGLE \((.*)\)$/, "$1").slice(0, 44) : "?") + (this.softwareRendering ? " [software]" : "") + (this.webglVersion ? ", WebGL " + this.webglVersion : ""),
            "Core       " + this.ejs.getCore() + ", " + s.variant,
            "Memory     " + s.memory + " JS heap",
            "Startup    " + (this.timing ? this.formatTiming() : "—")
        ];
        this.statsElem.textContent = lines.join("\n");
    }
    describeLayout() {
        const l = this.layout;
        if (!l || l.mode === "full") return "whole player area" + (this.profile.pictureBuffer === false ? " (picture-sized buffer off)" : "");
        const canvas = this.ejs.frontend.canvas;
        const drawn = canvas.width * canvas.height;
        const saved = Math.max(0, Math.round(100 - drawn * 100 / (l.full[0] * l.full[1])));
        return "picture only" + (l.prescale ? ", x" + l.prescale + " lines" : "") + ", " + saved + "% fewer pixels than " + l.full[0] + "×" + l.full[1];
    }
    formatTiming() {
        const t = this.timing;
        const sec = (ms) => (ms === null ? "?" : (ms / 1000).toFixed(1) + "s");
        return "core " + sec(t.core) + ", game " + sec(t.game) + ", boot " + sec(t.boot) + " (total " + sec(t.total) + ")";
    }

    // ---------- Round 12: idle audio suspension ----------
    /** The WebAudio context RetroArch's OpenAL output plays through. */
    audioContext() {
        const al = this.ejs.Module && this.ejs.Module.AL && this.ejs.Module.AL.currentCtx;
        return (al && al.audioCtx) || null;
    }
    /** Why no sound can be produced right now, or null while the game runs and can be heard. */
    audioIdleReason() {
        if (this.ejs.paused) return "paused";
        if (document.hidden) return "tab hidden";
        return null;
    }
    /**
     * A running AudioContext keeps the browser's audio thread and the device's audio output working at full rate
     * even when the emulator has stopped producing sound. While the game is paused (F5, the F1 panel, the phone
     * menu, auto-pause) or the tab is hidden, the context is suspended; it resumes when play continues. Buffers
     * already queued are kept, so sound picks up where it stopped instead of skipping or bursting.
     */
    updateAudioPower() {
        const ctx = this.audioContext();
        if (!ctx || this.stopped) return;
        const now = performance.now();
        const reason = this.profile.audioSuspend !== false ? this.audioIdleReason() : null;
        if (reason) {
            this.audioReason = reason;
            if (!this.audioSuspended && ctx.state === "running") {
                this.audioSuspended = true;
                this.audioIdleSince = now;
                ctx.suspend().catch(() => { this.audioSuspended = false; });
            }
            return;
        }
        this.audioReason = null;
        if (this.audioSuspended) {
            this.audioSuspended = false;
            this.audioIdleMs = (this.audioIdleMs || 0) + (now - this.audioIdleSince);
            this.resumeAudio(ctx);
        } else if (ctx.state === "interrupted") {
            // iOS stops audio for calls, Siri or another app; bring it back when the game is visible again
            this.resumeAudio(ctx);
        }
    }
    resumeAudio(ctx) {
        ctx.resume().catch(() => {}).then(() => {
            if (ctx.state === "running" || this.audioGestureWait) return;
            // Some browsers only allow it from a tap or key press after an interruption
            this.audioGestureWait = true;
            const events = ["pointerdown", "keydown", "touchend"];
            const retry = () => {
                ctx.resume().catch(() => {});
                if (ctx.state === "running" || this.stopped) {
                    for (const type of events) window.removeEventListener(type, retry, true);
                    this.audioGestureWait = false;
                }
            };
            for (const type of events) window.addEventListener(type, retry, true);
        });
    }
    watchAudioPower() {
        this.onAudioVisibility = () => this.updateAudioPower();
        document.addEventListener("visibilitychange", this.onAudioVisibility);
        // Safety net for pauses that do not go through togglePlaying (netplay, menus of other code)
        this.audioTimer = setInterval(() => this.updateAudioPower(), 1000);
        this.updateAudioPower();
    }
    describeAudio() {
        const ctx = this.audioContext();
        if (!ctx) return "?";
        const idle = (this.audioIdleMs || 0) + (this.audioSuspended ? performance.now() - this.audioIdleSince : 0);
        const saved = idle >= 1000 ? ", idle audio stopped for " + (idle >= 60000 ? (idle / 60000).toFixed(1) + " min" : Math.round(idle / 1000) + " s") : "";
        const state = this.audioSuspended ? "suspended (" + (this.audioReason || "idle") + ")" : ctx.state;
        return Math.round(ctx.sampleRate) + " Hz, " + state + (this.profile.audioSuspend === false ? " (idle suspension off)" : "") + saved;
    }

    // ---------- Feature 15: power saver ----------
    watchBattery() {
        if (!this.profile.powerSaver || !navigator.getBattery) return;
        navigator.getBattery().then((battery) => {
            const check = () => {
                if (this.powerSaved || this.profile.performanceMode) return;
                if (!battery.charging && battery.level <= 0.2) {
                    this.powerSaved = true;
                    this.profile.performanceMode = true;
                    this.applyPerformanceMode();
                    this.notify("Battery at " + Math.round(battery.level * 100) + "%: performance mode turned on to save power.", [
                        ["Turn off", () => this.set("performanceMode", false)],
                        ["OK", null, true]
                    ], 10000);
                }
            };
            battery.addEventListener("levelchange", check);
            battery.addEventListener("chargingchange", check);
            check();
        }).catch(() => {});
    }

    // ---------- F1 panel section ----------
    renderPanel(box) {
        const section = document.createElement("div");
        section.className = "ejs-perf-panel";
        const title = document.createElement("h3");
        title.textContent = "Performance";
        section.appendChild(title);
        const row = (labelText, control, note) => {
            const label = document.createElement("label");
            label.append(control, " " + labelText);
            if (note) {
                const small = document.createElement("span");
                small.className = "ejs-perf-note";
                small.textContent = " " + note;
                label.appendChild(small);
            }
            section.appendChild(label);
        };
        const check = (name, labelText, note) => {
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = !!this.profile[name];
            input.addEventListener("change", () => this.set(name, input.checked));
            row(labelText, input, note);
        };
        const select = (name, labelText, choices, note) => {
            const input = document.createElement("select");
            for (const [value, text] of choices) {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = text;
                input.appendChild(option);
            }
            input.value = String(this.profile[name]);
            input.addEventListener("change", () => this.set(name, isNaN(input.value) ? input.value : Number(input.value)));
            row(labelText, input, note);
        };
        check("performanceMode", "Performance mode (Shift+F9)", "lower render resolution, auto frameskip, shader off");
        select("renderScale", "Render resolution", [["1", "100%"], ["0.75", "75%"], ["0.5", "50%"]]);
        select("audioLatency", "Audio latency", [["32", "Low (32 ms)"], ["64", "Normal (64 ms)"], ["96", "Safe (96 ms)"], ["128", "Stable (128 ms)"]], "next start");
        check("runAhead", "Run-ahead (less input lag, more CPU)", "next start");
        check("lowLatency", "Low-latency canvas", "next start");
        check("leanSurface", "Lean opaque game surface", "next start");
        check("pictureBuffer", "Picture-sized render buffer", "draws only the game picture, whole-number scaled");
        check("powerSaver", "Power saver on low battery");
        check("audioSuspend", "Stop audio processing while paused or hidden");
        const info = document.createElement("div");
        info.className = "meta";
        const s = this.stats();
        info.textContent = "Startup: " + (this.timing ? this.formatTiming() : "—") + ". Display " + (this.refreshHz || "?") + " Hz. Render " + s.size + " (" + this.describeLayout() + "), surface " + this.describeSurface() + ". Shift+F10 shows live stats. Saved for this game.";
        section.appendChild(info);
        box.appendChild(section);
    }

    // ---------- UI helpers ----------
    message(text) {
        this.ejs.frontend.displayMessage(text);
    }
    notify(text, buttons, timeout) {
        if (this.ejs.enhancements && this.ejs.enhancements.toast) {
            this.ejs.enhancements.toast(text, buttons, timeout);
        } else {
            this.ejs.frontend.displayMessage(text, timeout);
        }
    }
}

export { EJS_Performance };
