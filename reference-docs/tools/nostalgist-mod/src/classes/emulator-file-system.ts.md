# `emulator-file-system.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/classes/emulator-file-system.ts` |
| **Category** | TypeScript source (core) |
| **Size** | 4.7 KB |
| **Lines** | 155 |

## What it is

`EmulatorFileSystem`: a typed wrapper around the Emscripten in-memory file system.

## How it works

- Defines RetroArch's directories under `/home/web_user/retroarch/userdata` (content, system, config, screenshots, saves, states, shaders) and offers `mkdirTree`, `readFile`, `writeFile`, `writeIni`, `readdir`, `stat`, `unlink`, `waitForFile`.

## Why it exists

RetroArch expects a Unix-like file tree; this keeps path handling in one place.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator.ts`
