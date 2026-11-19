# `emulator-utils.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/libs/emulator-utils.ts` |
| **Category** | TypeScript source (library) |
| **Size** | 3.2 KB |
| **Lines** | 100 |

## What it is

Prepares core JavaScript for use as an ES module.

## How it works

- `importCoreJsAsESM()` rewrites core `.js` text depending on its style (global `var Module` script, ESM, or EmulatorJS's `EJS_Runtime` factory) so Nostalgist can import it and obtain `Module`, `FS`, `AL`, `JSEvents` and an exit function.

## Why it exists

EmulatorJS-built cores differ from stock RetroArch web builds; this adapter makes them loadable.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator.ts`
