# `emulator-options.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/classes/emulator-options.ts` |
| **Category** | TypeScript source (core) |
| **Size** | 11.1 KB |
| **Lines** | 374 |

## What it is

`EmulatorOptions`: resolves everything the emulator needs before launch.

## How it works

- Merges global options with per-launch options (retroarch config, core config, core, rom list, bios, shaders, sram, state, size, style, signal, multi-disc settings), computes the canvas style (black background, pixelated rendering) and resolves each file via `ResolvableFile`.

## Why it exists

Gives one object with all inputs resolved so `Emulator` does not deal with option merging.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/nostalgist.ts`
