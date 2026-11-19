# `libunrar.js`

| | |
|---|---|
| **Path** | `data/compression/libunrar.js` |
| **Category** | Web worker (vendored) |
| **Size** | 65.1 KB |
| **Lines** | 520 |

## What it is

Emscripten JavaScript glue (about 67 KB) for the UnRAR library.

## How it works

- Loads and instantiates `libunrar.wasm`. `compression.js` builds a custom worker script that embeds the fetched wasm binary so the worker can start without another request.

## Why it exists

Lets the player open `.rar` game or BIOS archives.

## Referenced by

Files in this project that mention this asset by name or path:

- `data/src/compression.js`
