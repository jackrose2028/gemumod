# `consts.js`

| | |
|---|---|
| **Path** | `data/src/consts.js` |
| **Category** | Engine core module |
| **Size** | 1.6 KB |
| **Lines** | 47 |

## What it is

Constant tables.

## How it works

- `version` (`4.3.0-pre`). `cores`: map from system id to ordered list of candidate cores (e.g. `nes: [fceumm, nestopia]`, `snes: [snes9x, bsnes]`, `n64: [mupen64plus_next, parallel_n64]`, `psx: [pcsx_rearmed, mednafen_psx_hw]`, `dos: [dosbox_pure]`, `3ds: [azahar]`…).
- `requiresThreads` = ppsspp, dosbox_pure, azahar. `requiresWebGL2` = ppsspp, azahar.

## Why it exists

Single source of truth for which core plays which system. Shared by the engine and the launcher (`assets/common.js` imports it).

## Referenced by

Files in this project that mention this asset by name or path:

- `assets/common.js`
- `data/src/emulator.js`
- `sw.js`
