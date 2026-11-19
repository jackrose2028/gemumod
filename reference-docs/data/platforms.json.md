# `platforms.json`

| | |
|---|---|
| **Path** | `data/platforms.json` |
| **Category** | Data (configuration) |
| **Size** | 1.1 KB |
| **Lines** | 47 |

## What it is

The list of game-library platforms: A2600, GB, GBC, GG, NES, SNES, N64.

## How it works

- Each entry has `folder` (directory in `data/`), `label` (full name), `system` (EmulatorJS system id such as `nes`, `gb`, `segaGG`, `atari2600`) and `short` (name for dropdowns). Note GBC maps to system `gb`.

## Why it exists

Adding a platform means adding an entry here and a folder; no code changes. Used by `assets/folders.js` and `tools/generate-rom-index.mjs`.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/folders.js`
- `sw.js`
- `tools/generate-rom-index.mjs`
