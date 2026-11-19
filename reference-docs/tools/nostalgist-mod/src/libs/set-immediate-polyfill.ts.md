# `set-immediate-polyfill.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/libs/set-immediate-polyfill.ts` |
| **Category** | TypeScript source (library) |
| **Size** | 1.2 KB |
| **Lines** | 43 |

## What it is

Polyfill for `setImmediate` using `MessageChannel` (fallback `setTimeout`).

## How it works

- Installed while the emulator runs and removed after.

## Why it exists

Emscripten's main loop uses `setImmediate`, which browsers lack.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/libs/utils.ts`
