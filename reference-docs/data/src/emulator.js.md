# `emulator.js`

| | |
|---|---|
| **Path** | `data/src/emulator.js` |
| **Category** | Engine core module |
| **Size** | 119.6 KB |
| **Lines** | 2,506 |

## What it is

The main `EmulatorJS` class (about 122 KB). It is the brain of the EmulatorJSMod engine.

## How it works

- Builds the player: owns the config, `EJS_Frontend` (UI), `EJS_Download`/`EJS_Cache` (downloads), `EJS_COMPRESSION`, `EJS_Enhancements`, `EJS_Performance`, `GamepadHandler` and `EJS_GameManager`.
- **Core selection:** `getCores()` copies the table in `consts.js`; `getCoreCandidates()` orders archive names (requested variant, legacy fallback, non-thread fallback); `fetchGameCore()` consults the manifest and downloads the first present candidate with a `?v=size` cache-buster, then decompresses and runs `initGameCore()`.
- Validates threads (needs `SharedArrayBuffer`) and WebGL2 (PPSSPP, Azahar), downloads ROM, BIOS, patch and parent files, writes them into the Emscripten file system and starts RetroArch.
- Manages input (keyboard maps, gamepad, autofire, virtual gamepad), settings (`ejs-settings` in localStorage with per-game keys), save states and save files (IndexedDB), screenshots, shaders, fullscreen, pause, and an event system (`on`/`callEvent`: start, exit, saveState, loadState, saveUpdate…).
- Lazily creates `Netplay` via `ensureNetplay()`.

## Why it exists

This is the heart of upstream EmulatorJS adapted for local cores: it lets a static web page run libretro cores compiled to WebAssembly with a full console-style feature set.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `data/loader.js`
- `minify/minify.js`
- `sw.js`
