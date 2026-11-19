# `core-info.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/constants/core-info.ts` |
| **Category** | TypeScript source (data) |
| **Size** | 14.7 KB |
| **Lines** | 264 |

## What it is

A table of about 260 lines describing libretro cores (display name, whether save states, cheats or no-game launch are supported).

## How it works

- Looked up by core name to decide whether to enable state saving or to start without content.

## Why it exists

Not every core can do everything; capability flags avoid errors.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator.ts`
