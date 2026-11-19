/**
 * 2.5D mode for NES and SNES games in EmulatorJSMod.
 *
 * Each frame RetroArch draws is redrawn on a second WebGL canvas laid exactly over the game, as a scene with depth:
 * - the game's backdrop colours (worked out continuously from the picture) become the far layer, dimmed and pushed back;
 * - everything else (level tiles, platforms, characters, items) becomes raised blocks, one per game pixel,
 *   with a lit top face above each object, bevelled edges and a darker underside;
 * - raised blocks cast soft shadows down and to the right onto the far layer, and the far layer gets ambient
 *   occlusion around them.
 * The picture still comes from the real emulator, so gameplay, timing and input are untouched; 2.5D only changes
 * how the frame is shown. Depth, shadow strength and how far back the background sits are adjustable and saved per game.
 */
const STORE_KEY = "ejs-depth25";
const DEFAULTS = { depth: 3, shadow: 0.55, backdrop: 0.62, light: 1 };
const MAX_BG = 8;
const SCALE_KEY = "ejs-depth25-scale"; // screen pixels per game pixel this device keeps up with (2 to 4)

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// GLSL ES 1.00 so it runs on every WebGL device, iPhone included. Coordinates are in game pixels, y down.
// Pass 1 runs once per game pixel: it copies the frame at the game's own resolution and marks which pixels are
// backdrop (alpha 0) and which are raised (alpha 1). Pass 2 builds the 2.5D picture from that small texture only.
const MASK_FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec4 uRect;
uniform vec3 uBg[${MAX_BG}];
uniform float uBgCount;
void main() {
    vec2 uv = uRect.xy + vec2(vUv.x, 1.0 - vUv.y) * uRect.zw;
    vec3 c = texture2D(uSrc, uv).rgb;
    float r = 1.0;
    for (int i = 0; i < ${MAX_BG}; i++) {
        if (float(i) < uBgCount && distance(c, uBg[i]) < 0.075) r = 0.0;
    }
    gl_FragColor = vec4(c, r);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMask;     // game-resolution colours, alpha = raised
uniform vec2 uNative;
uniform float uDepth;
uniform float uShadow;
uniform float uBackdrop;
uniform float uLight;

vec4 cellAt(vec2 p) {
    if (p.x < 0.0 || p.y < 0.0 || p.x >= uNative.x || p.y >= uNative.y) return vec4(0.0);
    return texture2D(uMask, vec2((floor(p.x) + 0.5) / uNative.x, 1.0 - (floor(p.y) + 0.5) / uNative.y));
}
float raised(vec2 p) { return cellAt(p).a; }

void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uNative;
    vec2 cell = floor(p);
    vec2 f = p - cell;
    vec4 here = cellAt(p);
    vec3 c = here.rgb;
    vec3 outc;
    if (here.a > 0.5) {
        // Front face of a raised block, bevelled: light top edge, darker right and bottom edges
        outc = c * (0.92 + 0.08 * uLight);
        if (f.y < 0.22 && raised(cell + vec2(0.5, -0.5)) < 0.5) outc = mix(outc, vec3(1.0), 0.18 * uLight) * 1.08;
        if (f.x > 0.80 && raised(cell + vec2(1.5, 0.5)) < 0.5) outc *= 0.78;
        if (f.y > 0.80 && raised(cell + vec2(0.5, 1.5)) < 0.5) outc *= 0.62;
        if (f.x < 0.14 && raised(cell + vec2(-0.5, 0.5)) < 0.5) outc = mix(outc, vec3(1.0), 0.08 * uLight);
    } else {
        // Far layer, pushed back
        outc = c * uBackdrop;
        // Top faces: a raised block just below this point shows its lit top here
        float found = 0.0;
        for (int i = 1; i <= 12; i++) {
            float d = float(i) * 0.5;
            if (d > uDepth) break;
            vec4 q = cellAt(vec2(p.x, p.y + d));
            if (q.a > 0.5) {
                float far = d / max(uDepth, 0.5);
                outc = mix(q.rgb, vec3(1.0), 0.14 * uLight) * (1.08 - 0.3 * far);
                found = 1.0;
                break;
            }
        }
        if (found < 0.5) {
            // Soft drop shadow (light from the upper left) and ambient occlusion around blocks
            vec2 o = vec2(1.0, 1.0) * (1.0 + uDepth * 0.5);
            float s = raised(p - o) * 0.4 + raised(p - o + vec2(0.5, 0.0)) * 0.2 + raised(p - o + vec2(0.0, 0.5)) * 0.2 + raised(p - o - vec2(0.5, 0.0)) * 0.2;
            float ao = raised(p + vec2(1.0, 0.0)) + raised(p - vec2(1.0, 0.0)) + raised(p + vec2(0.0, 1.0)) + raised(p - vec2(0.0, 1.0));
            outc *= (1.0 - uShadow * s) * (1.0 - 0.05 * ao);
        }
    }
    vec2 v = vUv - 0.5;
    outc *= 1.0 - 0.18 * dot(v, v);
    gl_FragColor = vec4(outc, 1.0);
}`;

function readStore() {
    try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (e) {
        return {};
    }
}

class EJS_Depth25 {
    constructor(ejs) {
        this.ejs = ejs;
        this.gameKey = (typeof ejs.config.gameName === "string" && ejs.config.gameName) || "default";
        const store = readStore();
        this.settings = Object.assign({}, DEFAULTS, store.last || {}, (store.games || {})[this.gameKey] || {});
        this.enabled = true;
        this.bg = [];
        this.frameCount = 0;
        this.scale = 4;
        try { this.scale = Math.min(4, Math.max(2, Number(localStorage.getItem(SCALE_KEY)) || 4)); } catch (e) { /* default */ }
        this.deltas = [];
        ejs.on("start", () => this.start());
        ejs.on("exit", () => this.destroy());
    }

    static supports(core) {
        return ["nes", "snes"].includes(core);
    }

    save() {
        const store = readStore();
        store.games = store.games || {};
        store.games[this.gameKey] = Object.assign({}, this.settings);
        store.last = Object.assign({}, this.settings);
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage full */ }
    }
    set(name, value) {
        this.settings[name] = value;
        this.save();
    }

    start() {
        const parent = this.ejs.frontend.canvas.parentElement;
        const canvas = document.createElement("canvas");
        canvas.className = "ejs-depth25";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = "position:absolute;pointer-events:none;z-index:1;image-rendering:auto;";
        parent.insertBefore(canvas, this.ejs.frontend.canvas.nextSibling);
        this.canvas = canvas;
        const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: "high-performance" });
        if (!gl) {
            canvas.remove();
            this.failed = true;
            return;
        }
        this.gl = gl;
        const compile = (type, text) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, text);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
            return shader;
        };
        const link = (fragment) => {
            const program = gl.createProgram();
            gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
            gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
            gl.bindAttribLocation(program, 0, "aPos");
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
            return program;
        };
        try {
            this.maskProgram = link(MASK_FRAGMENT);
            this.program = link(FRAGMENT);
        } catch (e) {
            console.warn("[2.5D] shader failed", e);
            canvas.remove();
            this.failed = true;
            return;
        }
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const makeTexture = () => {
            const t = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, t);
            for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
            return t;
        };
        this.texture = makeTexture();
        this.maskTexture = makeTexture();
        this.maskSize = [0, 0];
        this.fbo = gl.createFramebuffer();
        this.u = {};
        for (const name of ["uMask", "uNative", "uDepth", "uShadow", "uBackdrop", "uLight"]) this.u[name] = gl.getUniformLocation(this.program, name);
        this.m = {};
        for (const name of ["uSrc", "uRect", "uBg", "uBgCount"]) this.m[name] = gl.getUniformLocation(this.maskProgram, name);
        this.sampler = document.createElement("canvas");
        this.sampleCtx = this.sampler.getContext("2d", { willReadFrequently: true });
        this.ejs.frontend.canvas.parentElement.classList.add("ejs-depth25-on");
        this.loop = (time) => {
            if (this.stopped) return;
            this.frame = requestAnimationFrame(this.loop);
            this.render();
            this.adapt(time);
        };
        this.frame = requestAnimationFrame(this.loop);
    }

    /** Where the picture sits inside the emulator canvas, and the game's own resolution. */
    geometry() {
        const E = this.ejs;
        const source = E.frontend.canvas;
        let width = 256;
        let height = 224;
        let aspect = 4 / 3;
        try {
            width = E.gameManager.getVideoDimensions("width") || width;
            height = E.gameManager.getVideoDimensions("height") || height;
            aspect = E.gameManager.getVideoDimensions("aspect") || aspect;
        } catch (e) { /* defaults */ }
        // With the picture-sized buffer the canvas is exactly the picture; otherwise RetroArch centres it
        let rect = [0, 0, 1, 1];
        const layout = E.performance && E.performance.layout;
        if (!layout || layout.mode !== "picture") {
            const ca = source.width / Math.max(1, source.height);
            if (ca > aspect) rect = [(1 - aspect / ca) / 2, 0, aspect / ca, 1];
            else rect = [0, (1 - ca / aspect) / 2, 1, ca / aspect];
        }
        return { width, height, rect };
    }

    place(geo) {
        const source = this.ejs.frontend.canvas;
        const host = source.parentElement.getBoundingClientRect();
        const box = source.getBoundingClientRect();
        const left = box.left - host.left + geo.rect[0] * box.width;
        const top = box.top - host.top + geo.rect[1] * box.height;
        const width = geo.rect[2] * box.width;
        const height = geo.rect[3] * box.height;
        const dpr = window.devicePixelRatio || 1;
        // Enough pixels for crisp block edges (4 per game pixel); the browser scales the rest smoothly
        const bw = Math.max(1, Math.round(Math.min(width * dpr, geo.width * this.scale)));
        const bh = Math.max(1, Math.round(Math.min(height * dpr, geo.height * this.scale)));
        const key = [left, top, width, height, bw, bh].map(Math.round).join(",");
        if (key !== this.placeKey) {
            this.placeKey = key;
            const s = this.canvas.style;
            s.left = left + "px";
            s.top = top + "px";
            s.width = width + "px";
            s.height = height + "px";
            this.canvas.width = bw;
            this.canvas.height = bh;
        }
    }

    /** The backdrop: the colours that cover most of the picture, refreshed a few times a second. */
    sampleBackdrop(source, geo) {
        const w = geo.width;
        const h = geo.height;
        if (this.sampler.width !== w || this.sampler.height !== h) {
            this.sampler.width = w;
            this.sampler.height = h;
        }
        const ctx = this.sampleCtx;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(source, geo.rect[0] * source.width, geo.rect[1] * source.height, geo.rect[2] * source.width, geo.rect[3] * source.height, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const counts = new Map();
        for (let i = 0; i < data.length; i += 8) { // every other pixel is plenty
            const key = ((data[i] >> 3) << 10) | ((data[i + 1] >> 3) << 5) | (data[i + 2] >> 3);
            counts.set(key, (counts.get(key) || 0) + 1);
        }
        const total = data.length / 8;
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        const bg = [];
        let covered = 0;
        for (const [key, n] of top) {
            // A colour counts as backdrop when it covers a large part of the screen; the first always does
            // (several shades are allowed, so a sky gradient or a two-tone backdrop stays behind)
            if (bg.length >= MAX_BG || (bg.length > 0 && (n / total < 0.025 || covered > 0.6))) break;
            bg.push([((key >> 10) & 31) / 31, ((key >> 5) & 31) / 31, (key & 31) / 31]);
            covered += n / total;
        }
        this.bg = bg;
    }

    render() {
        const E = this.ejs;
        const gl = this.gl;
        const source = E.frontend.canvas;
        if (!this.enabled || !gl || !source.width || document.hidden) return;
        if (E.paused && this.drawnWhilePaused) return;
        const geo = this.geometry();
        this.place(geo);
        if (this.frameCount++ % 10 === 0) {
            try { this.sampleBackdrop(source, geo); } catch (e) { /* source not readable yet */ }
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
        } catch (e) {
            return;
        }
        // Pass 1: the frame at the game's own resolution, with backdrop / raised marked in alpha
        const w = Math.round(geo.width);
        const h = Math.round(geo.height);
        gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        if (this.maskSize[0] !== w || this.maskSize[1] !== h) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.maskSize = [w, h];
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.maskTexture, 0);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.viewport(0, 0, w, h);
        gl.useProgram(this.maskProgram);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.m.uSrc, 0);
        // Each fragment of this pass is one game pixel, so it samples that pixel's centre in the emulator canvas
        gl.uniform4f(this.m.uRect, geo.rect[0], geo.rect[1], geo.rect[2], geo.rect[3]);
        const flat = new Float32Array(MAX_BG * 3);
        this.bg.forEach((c, i) => flat.set(c, i * 3));
        gl.uniform3fv(this.m.uBg, flat);
        gl.uniform1f(this.m.uBgCount, this.bg.length);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // Pass 2: the 2.5D scene on screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program);
        gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
        const st = this.settings;
        gl.uniform1i(this.u.uMask, 0);
        gl.uniform2f(this.u.uNative, w, h);
        gl.uniform1f(this.u.uDepth, Number(st.depth));
        gl.uniform1f(this.u.uShadow, Number(st.shadow));
        gl.uniform1f(this.u.uBackdrop, Number(st.backdrop));
        gl.uniform1f(this.u.uLight, Number(st.light));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        this.drawnWhilePaused = E.paused;
    }

    /**
     * Keeps the game at full speed: if frames take clearly longer than the display's refresh while 2.5D is drawn,
     * the 2.5D picture is drawn with fewer pixels (4, then 3, then 2 per game pixel; the browser scales it up).
     * The level reached is remembered for this device.
     */
    adapt(time) {
        const E = this.ejs;
        if (this.lastTime && this.enabled && !E.paused && !document.hidden && !E.isFastForward) {
            this.deltas.push(time - this.lastTime);
        }
        this.lastTime = time;
        if (this.deltas.length < 90) return;
        const sorted = this.deltas.slice().sort((a, b) => a - b);
        const median = sorted[sorted.length >> 1];
        this.deltas = [];
        const hz = (E.performance && E.performance.refreshHz) || 60;
        const budget = 1000 / Math.min(hz, 60);
        if (median > budget * 1.2 && this.scale > 2) {
            this.scale -= 1;
            this.placeKey = null;
            try { localStorage.setItem(SCALE_KEY, String(this.scale)); } catch (e) { /* storage blocked */ }
        }
    }

    setEnabled(on) {
        this.enabled = on;
        if (this.canvas) this.canvas.hidden = !on;
        const parent = this.ejs.frontend.canvas.parentElement;
        if (parent) parent.classList.toggle("ejs-depth25-on", on && !!this.canvas);
        this.drawnWhilePaused = false;
    }
    toggle() {
        if (this.failed) {
            this.ejs.frontend.displayMessage("2.5D IS NOT AVAILABLE ON THIS DEVICE");
            return;
        }
        this.setEnabled(!this.enabled);
        this.ejs.frontend.displayMessage(this.enabled ? "2.5D MODE ON" : "2.5D MODE OFF");
    }

    renderPanel(box) {
        const section = document.createElement("div");
        section.className = "ejs-perf-panel";
        const title = document.createElement("h3");
        title.textContent = "2.5D mode";
        section.appendChild(title);
        const on = document.createElement("label");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = this.enabled;
        check.addEventListener("change", () => this.setEnabled(check.checked));
        on.append(check, " 2.5D on (Shift+F8)");
        section.appendChild(on);
        const slider = (name, label, min, max, step) => {
            const row = document.createElement("label");
            row.className = "ejs-depth25-row";
            const input = document.createElement("input");
            input.type = "range";
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = this.settings[name];
            input.addEventListener("input", () => {
                this.set(name, Number(input.value));
                this.drawnWhilePaused = false;
            });
            row.append(label + " ", input);
            section.appendChild(row);
        };
        slider("depth", "Block height", 0, 6, 0.5);
        slider("shadow", "Shadows", 0, 1, 0.05);
        slider("backdrop", "Background brightness", 0.25, 1, 0.05);
        slider("light", "Highlights", 0, 1.5, 0.1);
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = "Saved for this game. Background colours detected now: " + (this.bg.length || "none") + ". Drawn at " + this.scale + " screen pixels per game pixel (lowered automatically if the game slows down).";
        section.appendChild(meta);
        box.appendChild(section);
    }

    destroy() {
        this.stopped = true;
        cancelAnimationFrame(this.frame);
        if (this.canvas) this.canvas.remove();
        const parent = this.ejs.frontend && this.ejs.frontend.canvas && this.ejs.frontend.canvas.parentElement;
        if (parent) parent.classList.remove("ejs-depth25-on");
    }
}

export { EJS_Depth25 };
