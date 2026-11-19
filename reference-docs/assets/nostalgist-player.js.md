# `nostalgist-player.js`

| | |
|---|---|
| **Path** | `assets/nostalgist-player.js` |
| **Category** | Engine adapter (player) |
| **Size** | 10.0 KB |
| **Lines** | 231 |

## What it is

The game-page player for the NostalgistMod engine.

## How it works

- Exports `info`, `supports(system)` (true only if a single-threaded core exists in the manifest) and `launch()`, matching the engine contract used by `play.js`.
- `launch()` builds a canvas, fetches ROM/patch/BIOS into `File`s, restores stored SRAM from the `NostalgistMod-saves` IndexedDB (via `EJS_STORAGE`), sets `window.NOSTALGIST_MOD` (cores path, 7z worker path, manifest) and calls `Nostalgist.launch()`.
- Adds what Nostalgist leaves to the page: toolbar (Pause, Reset, Save state, Load state, Screenshot, Fullscreen), F2/F4/F5/Shift+F5/F8/F11 hotkeys, SRAM autosave every 30 s and on tab hide, state persistence, resizing to the device pixel ratio and audio unlock on first interaction.

## Why it exists

Nostalgist.js is a library, not a finished player. This file turns it into a lightweight alternative engine with persistent saves so users can choose it instead of the full EmulatorJS UI.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `assets/common.js`
- `sw.js`
