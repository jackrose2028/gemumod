# `keyboard-code-map.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/constants/keyboard-code-map.ts` |
| **Category** | TypeScript source (data) |
| **Size** | 1.2 KB |
| **Lines** | 50 |

## What it is

Map from friendly key names (`enter`, `ctrl`, `up`, `numpad…`) to `KeyboardEvent.code` values.

## How it works

- Used to translate RetroArch keyboard bindings into simulated browser key events.

## Why it exists

RetroArch config names keys differently from the DOM.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator.ts`
