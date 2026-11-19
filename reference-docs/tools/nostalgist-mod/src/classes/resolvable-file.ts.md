# `resolvable-file.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/classes/resolvable-file.ts` |
| **Category** | TypeScript source (core) |
| **Size** | 8.8 KB |
| **Lines** | 294 |

## What it is

`ResolvableFile`: turns almost anything into a file with a name and bytes.

## How it works

- Accepts URLs, `Request`/`Response`, `Blob`/`File`, `ArrayBuffer`, plain text, `FileSystemFileHandle`, or promises/functions returning those. Guesses file names from URLs or `Content-Disposition`, and offers `getArrayBuffer`, `getBlob`, `getObjectUrl`, `getText`, `dispose`. Detects zip content.

## Why it exists

Lets callers pass ROMs, BIOS and cores in whichever form they happen to have.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator-file-system.ts`
- `tools/nostalgist-mod/src/classes/emulator-options.ts`
- `tools/nostalgist-mod/src/classes/emulator.ts`
- `tools/nostalgist-mod/src/classes/nostalgist.ts`
- `tools/nostalgist-mod/src/libs/emulator-utils.ts`
