# `emulator.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/classes/emulator.ts` |
| **Category** | TypeScript source (core) |
| **Size** | 28.8 KB |
| **Lines** | 917 |

## What it is

The `Emulator` class (about 30 KB) that actually boots and controls RetroArch in the browser.

## How it works

- `launch()` sets up Emscripten (loads the core JS and wasm, canvas, audio), the virtual file system, RetroArch config/shader files, then calls RetroArch's `main`.
- Implements pause/resume, restart, state and SRAM save, screenshots, simulated key presses, cheats, disc switching and a small event system. Records and later removes global DOM event listeners on exit so the page is left clean.
- In this modified version it detects EmulatorJS core builds and routes input through `EjsInputBridge` instead of RetroArch's keyboard driver.

## Why it exists

The low-level engine room of NostalgistMod; separating it from `Nostalgist` keeps the public API small.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/nostalgist.ts`
