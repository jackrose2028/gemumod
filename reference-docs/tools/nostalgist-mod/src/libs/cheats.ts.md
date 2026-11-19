# `cheats.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/libs/cheats.ts` |
| **Category** | TypeScript source (library) |
| **Size** | 2.8 KB |
| **Lines** | 70 |

## What it is

Cheat parsing and normalisation.

## How it works

- `normalizeCheat`, `parseCheatFile` (RetroArch `.cht` INI format via `ini`) and `resolveCheatTargets` (by index, description or code).

## Why it exists

Lets games load cheat files and toggle individual cheats.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator-options.ts`
- `tools/nostalgist-mod/src/classes/emulator.ts`
- `tools/nostalgist-mod/src/classes/nostalgist.ts`
