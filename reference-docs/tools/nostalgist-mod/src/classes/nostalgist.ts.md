# `nostalgist.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/classes/nostalgist.ts` |
| **Category** | TypeScript source (core) |
| **Size** | 21.2 KB |
| **Lines** | 745 |

## What it is

The public `Nostalgist` class (about 22 KB), the API that `assets/nostalgist-player.js` uses.

## How it works

- Static helpers: `launch`, `prepare`, `configure`, `resetToDefault`, `clearCache` and shortcuts per system (`nes`, `snes`, `gb`, `gbc`, `gba`, `megadrive`) that choose a default core from `constants/system.ts`.
- Instance methods: `start`, `exit`, `pause`, `resume`, `restart`, `saveState`, `loadState`, `saveSRAM`, `screenshot`, `press/pressDown/pressUp`, `resize`, `sendCommand`, `switchDisc`, cheat management (`addCheat`, `enableCheat`, `loadCheats`…), and getters for the canvas, status, options and the underlying Emscripten objects.
- Delegates the heavy lifting to `Emulator` built from `EmulatorOptions`.

## Why it exists

A clean, promise-based facade over RetroArch so a web page can run a game with one call.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/entries/esm.ts`
- `tools/nostalgist-mod/src/entries/umd.ts`
