# `input.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/types/retroarch-config/input.ts` |
| **Category** | TypeScript source (types) |
| **Size** | 5.2 KB |
| **Lines** | 110 |

## What it is

Config keys for global input hotkeys (e.g. `input_fps_toggle`, `input_close_content`) with axis, button and mouse-button variants.

## How it works

- Interface declarations only; compiled away by esbuild.

## Why it exists

Gives autocomplete and checking for RetroArch config objects passed to Nostalgist `retroarchConfig`.
