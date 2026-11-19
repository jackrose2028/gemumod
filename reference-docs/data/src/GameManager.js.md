# `GameManager.js`

| | |
|---|---|
| **Path** | `data/src/GameManager.js` |
| **Category** | Engine core module |
| **Size** | 22.6 KB |
| **Lines** | 565 |

## What it is

`EJS_GameManager`: the bridge between JavaScript and the compiled RetroArch core.

## How it works

- Wraps exported C functions using Emscripten `cwrap` (restart, load_state, screenshot, simulate_input, set cheats, shader enable, disk control, fast-forward, rewind, slow-motion, video rotation, controller port devices, core options…).
- Mounts IDBFS file systems for saves (`/data/saves`), writes `retroarch.cfg`, loads external files, creates `.cue` files for multi-bin discs, loads PPSSPP assets, handles `getState`/`loadState`/`quickSave`/`quickLoad` and `simulateInput`.

## Why it exists

Isolates every call that touches the WebAssembly module, so the rest of the code works with a clear JS API.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `data/src/emulator.js`
- `sw.js`
