# `emscripten.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/libs/emscripten.ts` |
| **Category** | TypeScript source (library) |
| **Size** | 2.9 KB |
| **Lines** | 85 |

## What it is

Helpers for the Emscripten module's logging and overrides.

## How it works

- `parseLogLine()` classifies RetroArch's stdout/stderr lines into level (DEBUG/INFO/WARN/ERROR) and source (core vs frontend). `getEmscriptenModuleOverrides()` builds the overrides object passed when creating the Emscripten module.

## Why it exists

Gives callers structured logs and control over the Emscripten module.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator-options.ts`
- `tools/nostalgist-mod/src/classes/emulator.ts`
