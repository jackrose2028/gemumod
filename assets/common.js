// Shared by the home page (app.js) and the game page (play.js).
import { cores as CORE_TABLE, requiresThreads } from "../data/src/consts.js";

export const $ = (id) => document.getElementById(id);
export const params = new URLSearchParams(location.search);
export const flag = (name) => params.get(name) === "1" || params.get(name) === "true";
export const OPTIONS_KEY = "ejs-launcher-options";

let manifest = null;

export const coresFor = (system) => CORE_TABLE[system] || [system];
export const needsThreads = (system) => coresFor(system).some((c) => requiresThreads.includes(c));

function hasLocalCore(core) {
    if (!manifest) return true;
    const prefix = core + "-";
    return Object.keys(manifest.files).some((name) => name.startsWith(prefix) && /^(thread-)?(legacy-)?wasm\.7z$/.test(name.slice(prefix.length)));
}
export const isAvailable = (system) => coresFor(system).some(hasLocalCore);
export const coreInstalled = (core) => hasLocalCore(core);
export const coreNeedsThreads = (core) => requiresThreads.includes(core);
/** Whether a core has a single-threaded build installed (what NostalgistMod can run). */
export function coreSingleThread(core) {
    if (!manifest) return !requiresThreads.includes(core);
    return (core + "-wasm.7z") in manifest.files || (core + "-legacy-wasm.7z") in manifest.files;
}
/** The installed cores for a system, the default (first) one first. */
export const installedCores = (system) => coresFor(system).filter(hasLocalCore);
/** The core chosen for a system with "Use this core for every ... game" (or null). */
export function preferredCore(system) {
    try {
        const core = localStorage.getItem("ejs-core-" + system);
        return core && coresFor(system).includes(core) && hasLocalCore(core) ? core : null;
    } catch (e) {
        return null;
    }
}
export function setPreferredCore(system, core) {
    try {
        if (core) localStorage.setItem("ejs-core-" + system, core);
        else localStorage.removeItem("ejs-core-" + system);
    } catch (e) { /* storage blocked */ }
}

export async function loadManifest() {
    try {
        const response = await fetch("data/cores/manifest.json", { cache: "no-cache" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        manifest = await response.json();
        window.EJS_coreManifest = manifest;
    } catch (e) {
        manifest = null;
    }
    return manifest;
}

export function banner(text, kind, actions) {
    let host = $("banners");
    if (!host) {
        host = document.createElement("div");
        host.id = "banners";
        document.body.appendChild(host);
    }
    const box = document.createElement("div");
    box.className = "banner" + (kind ? " " + kind : "");
    const span = document.createElement("span");
    span.textContent = text;
    box.appendChild(span);
    const close = () => box.remove();
    for (const [label, fn] of actions || [["Dismiss", null]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => {
            close();
            if (fn) fn();
        });
        box.appendChild(button);
    }
    host.appendChild(box);
    return close;
}

/** Saved launcher options (threads, cache, library, debug, mode), with URL parameters applied on top. */
export const DEPTH25_KEY = "ejs-depth25-on";
export function setDepth25(on) {
    try { localStorage.setItem(DEPTH25_KEY, on ? "1" : "0"); } catch (e) { /* storage blocked */ }
}
export function readOptions() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}"); } catch (e) { /* ignore */ }
    const options = {
        threads: saved.threads === true,
        cache: saved.cache !== false,
        library: saved.library !== false,
        debug: saved.debug === true,
        mode: saved.mode || ""
    };
    if (params.has("debug")) options.debug = flag("debug");
    if (params.has("threads")) options.threads = flag("threads");
    if (params.get("cache") === "0" || params.get("cache") === "false") options.cache = false;
    // 2.5D mode (home page 2.5D button, or ?depth25=1 / 0)
    try { options.depth25 = localStorage.getItem(DEPTH25_KEY) === "1"; } catch (e) { options.depth25 = false; }
    if (params.has("depth25")) options.depth25 = flag("depth25");
    const mode = params.get("browserMode");
    if (mode) options.mode = mode === "1" ? "mobile" : mode === "2" ? "desktop" : mode;
    return options;
}

/**
 * Registers sw.js (offline cache + the isolation headers GitHub Pages cannot send).
 * On the first visit it reloads once so threads become available, unless shouldReload() says no.
 * Resolves with "isolated", "reloading", "unsupported" or "unavailable".
 */
export function setupServiceWorker({ shouldReload = () => true, onUpdate } = {}) {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return Promise.resolve("unavailable");
    const wasControlled = !!navigator.serviceWorker.controller;
    return new Promise((resolve) => {
        navigator.serviceWorker.register("sw.js").then((registration) => {
            registration.addEventListener("updatefound", () => {
                const worker = registration.installing;
                if (!wasControlled || !worker) return;
                worker.addEventListener("statechange", () => {
                    if (worker.state === "activated" && onUpdate) onUpdate();
                });
            });
            return navigator.serviceWorker.ready;
        }).then(() => {
            if (window.crossOriginIsolated) return resolve("isolated");
            if (navigator.serviceWorker.controller) return resolve("unsupported");
            if (sessionStorage.getItem("ejs-coi-reload")) return resolve("unsupported");
            sessionStorage.setItem("ejs-coi-reload", "1");
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (shouldReload()) {
                    resolve("reloading");
                    location.reload();
                }
            });
            setTimeout(() => resolve("unsupported"), 3000);
        }).catch(() => resolve("unavailable"));
    });
}

// ---------- engines ----------
export const ENGINES = {
    emulatorjs: {
        id: "emulatorjs",
        name: "EmulatorJSMod",
        tagline: "Full-featured EmulatorJS player",
        details: "On-screen menu, touch gamepad, cheats, shaders, netplay, F1 hotkeys and every installed system, including threaded ones (PSP, DOS).",
        load: () => import("../engines/EmulatorJSMod.js")
    },
    nostalgist: {
        id: "nostalgist",
        name: "NostalgistMod",
        tagline: "Lightweight RetroArch player",
        details: "A minimal canvas and toolbar built on Nostalgist.js, using the same local cores, with its own on-screen controls on phones. Single-threaded systems only (PSP and DOS need EmulatorJSMod).",
        load: () => import("./nostalgist-player.js")
    }
};
const ENGINE_SESSION_KEY = "ejs-engine";
const ENGINE_REMEMBER_KEY = "ejs-engine-remembered";

/** The engine chosen for this visit: ?engine=, then this session's choice, then a remembered one. */
export function getEngine() {
    const fromUrl = params.get("engine");
    if (fromUrl && ENGINES[fromUrl]) return fromUrl;
    let id = null;
    try {
        id = sessionStorage.getItem(ENGINE_SESSION_KEY) || localStorage.getItem(ENGINE_REMEMBER_KEY);
    } catch (e) { /* storage blocked */ }
    return id && ENGINES[id] ? id : null;
}
export function isEngineRemembered() {
    try { return !!localStorage.getItem(ENGINE_REMEMBER_KEY); } catch (e) { return false; }
}
export function setEngine(id, remember) {
    try {
        sessionStorage.setItem(ENGINE_SESSION_KEY, id);
        if (remember === true) localStorage.setItem(ENGINE_REMEMBER_KEY, id);
        else if (remember === false) localStorage.removeItem(ENGINE_REMEMBER_KEY);
        else if (localStorage.getItem(ENGINE_REMEMBER_KEY)) localStorage.setItem(ENGINE_REMEMBER_KEY, id);
    } catch (e) { /* storage blocked */ }
}
/** Whether this visit still needs the engine question (asked once per browser session unless remembered). */
export function needsEngineChoice() {
    try {
        return !params.get("engine") && !sessionStorage.getItem(ENGINE_SESSION_KEY) && !localStorage.getItem(ENGINE_REMEMBER_KEY);
    } catch (e) {
        return false;
    }
}

// ---------- core prefetch ----------
const prefetched = new Set();
let webgl2 = null;
function hasWebgl2() {
    if (webgl2 === null) {
        try { webgl2 = !!document.createElement("canvas").getContext("webgl2"); } catch (e) { webgl2 = false; }
    }
    return webgl2;
}

/** The core archive an engine will download for a system, as the exact URL it requests (so caches match). */
export function coreFileFor(system, engineId, options = {}) {
    if (!manifest || !manifest.files) return null;
    const files = manifest.files;
    for (const core of coresFor(system)) {
        const info = (manifest.cores && manifest.cores[core]) || {};
        const legacyFirst = engineId === "nostalgist" ? !hasWebgl2() : !(hasWebgl2() && info.defaultWebGL2);
        const threads = engineId !== "nostalgist" && (requiresThreads.includes(core) || (options.threads && window.crossOriginIsolated));
        const name = (l) => core + (threads ? "-thread" : "") + (l ? "-legacy" : "") + "-wasm.7z";
        for (const candidate of [name(legacyFirst), name(!legacyFirst)]) {
            if (files[candidate] !== undefined) return "data/cores/" + candidate + "?v=" + encodeURIComponent(files[candidate]);
        }
    }
    return null;
}

/**
 * Downloads a system's core in the background (pointer over a game, game list shown), so it is already in
 * the browser and service-worker caches when the game starts. Skipped on data-saver and slow connections.
 */
export function prefetchCore(system, engineId) {
    const connection = navigator.connection;
    if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""))) return;
    const url = coreFileFor(system, engineId || getEngine() || "emulatorjs", readOptions());
    if (!url || prefetched.has(url)) return;
    prefetched.add(url);
    fetch(url, { priority: "low" }).then((r) => r.arrayBuffer()).catch(() => prefetched.delete(url));
}
