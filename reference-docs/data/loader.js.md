# `loader.js`

| | |
|---|---|
| **Path** | `data/loader.js` |
| **Category** | Engine bootstrap |
| **Size** | 8.6 KB |
| **Lines** | 242 |

## What it is

The script that boots EmulatorJS. It is what `EmulatorJSMod.js` injects into the page.

## How it works

- Works out its own folder (`EJS_pathtodata` or the script URL) and builds a `config` object from the `window.EJS_*` variables (about 60 options: game URL, BIOS, patch, core, threads, cache, cheats, shaders, netplay, controls, language, browser mode, etc.).
- In parallel it imports `src/emulator.js` (or `emulator.min.js`), loads `emulator.css`, loads the language JSON (system locale or `EJS_language`, with a fallback from `pt-BR` to `pt`) and fetches `cores/manifest.json`.
- Then creates `window.EJS_emulator = new EmulatorJS(EJS_player, config)` and wires the callbacks `EJS_ready`, `EJS_onGameStart`, `EJS_onLoadState`, `EJS_onSaveState`, `EJS_onLoadSave`, `EJS_onSaveSave`, `EJS_onExit`, `EJS_onSaveUpdate`.
- If the main script fails it prints a visible error in the player area; if the minified build fails it falls back to the unminified one.

## Why it exists

Keeps EmulatorJS embeddable with only global variables and one script tag, and is the single place where configuration is mapped to the engine.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `engines/EmulatorJSMod.js`
- `sw.js`
