# `retroarch-command.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/types/retroarch-command.ts` |
| **Category** | TypeScript source (types) |
| **Size** | 700 B |
| **Lines** | 33 |

## What it is

Union type of RetroArch network-control commands (`SAVE_STATE`, `LOAD_STATE`, `FAST_FORWARD`, `FULLSCREEN_TOGGLE`, `RESET`, …).

## How it works

- Used by `sendCommand()`.

## Why it exists

Prevents typos in command names.

## Referenced by

Files in this project that mention this asset by name or path:

- `tools/nostalgist-mod/src/classes/emulator.ts`
