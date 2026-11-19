# `retroarch-emscripten.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/types/retroarch-emscripten.ts` |
| **Category** | TypeScript source (types) |
| **Size** | 1.4 KB |
| **Lines** | 37 |

## What it is

Type of the RetroArch Emscripten module (`callMain`, `canvas`, cheat exports available in RetroArch ≥1.21).

## How it works

- Extends Emscripten's own `EmscriptenModule` type.

## Why it exists

Typed access to the module's raw exports.

## Referenced by

Files in this project that mention this asset by name or path:

- `tools/nostalgist-mod/src/classes/emulator-options.ts`
- `tools/nostalgist-mod/src/libs/emscripten.ts`
