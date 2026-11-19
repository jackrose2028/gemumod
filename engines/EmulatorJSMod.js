/*!
 * EmulatorJSMod: the EmulatorJS 4.3 engine in data/ (loader.js + data/src), modified for local hosting.
 * EmulatorJS is GPL-3.0 licensed, see LICENSE. This module is the entry point the site uses to start it.
 */
import { needsThreads, coreNeedsThreads, params } from "../assets/common.js";
import { extensionOf } from "../assets/detect.js";

export const info = {
    id: "emulatorjs",
    name: "EmulatorJSMod",
    summary: "Full EmulatorJS player: on-screen menu, touch gamepad, cheats, shaders, netplay, F1 hotkeys, all installed systems."
};

/** Every system with an installed core runs on EmulatorJSMod, threaded ones included. */
export function supports() {
    return { ok: true };
}

/**
 * Starts EmulatorJS in `container` (a CSS selector).
 * @param {{ container: string, game: {rom: File|string, name: string, system: string, bios?: File, patch?: File}, options: object, onExit: Function }} run
 */
export function launch({ container, game, options, onExit }) {
    const { rom, name, system, core, bios, patch } = game;
    // A chosen core decides on its own whether threads are needed; otherwise the system's cores do
    const threads = (options.threads || (core ? coreNeedsThreads(core) : needsThreads(system))) && !!window.SharedArrayBuffer;
    const gameName = name.replace(/\.[^.]*$/, "");
    // RetroArch applies a patch automatically when it sits next to the ROM with the same base name
    const patchFile = patch ? new File([patch], gameName + "." + extensionOf(patch.name)) : "";

    window.EJS_player = container;
    window.EJS_gameName = gameName;
    window.EJS_gameUrl = rom;
    window.EJS_biosUrl = bios || "";
    window.EJS_gamePatchUrl = patchFile;
    // The core picked when the game was loaded (or the preferred core for the system), else the system default
    window.EJS_core = core || system;
    window.EJS_pathtodata = "data/";
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = options.debug;
    window.EJS_threads = threads;
    // 2.5D mode is drawn by data/src/depth25.js for NES and SNES
    window.EJS_depth25 = !!options.depth25 && (system === "nes" || system === "snes");
    window.EJS_cacheConfig = { enabled: options.cache, cacheMaxSizeMB: 4096, cacheMaxAgeMins: 7200 };
    window.EJS_askBeforeExit = false;
    if (options.mode) window.EJS_browserMode = options.mode;
    if (params.get("lang")) window.EJS_language = params.get("lang");
    window.EJS_onExit = onExit;
    window.EJS_onBackToMenu = onExit;

    const script = document.createElement("script");
    script.src = "data/loader.js";
    document.body.appendChild(script);
    return { hints: "F1 hotkeys" };
}
