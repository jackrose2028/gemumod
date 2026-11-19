# `compression.js`

| | |
|---|---|
| **Path** | `data/src/compression.js` |
| **Category** | Engine core module |
| **Size** | 10.9 KB |
| **Lines** | 256 |

## What it is

`EJS_COMPRESSION`: archive detection and extraction.

## How it works

- `isCompressed()` checks magic bytes for ZIP (`PK`), 7z (`37 7A BC AF 27 1C`) and RAR (`Rar!`).
- `decompress()` picks `extract7z.js`, `extractzip.js` or `libunrar.js`, builds a Blob worker (cached in module maps), feeds it the bytes and gathers extracted files with progress callbacks; uncompressed data passes through as `!!notCompressedData`.

## Why it exists

Single place to handle all archive formats the emulator may meet, off the main thread.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `data/src/cache.js`
- `data/src/emulator.js`
- `sw.js`
