# `libunrar.wasm`

| | |
|---|---|
| **Path** | `data/compression/libunrar.wasm` |
| **Category** | Binary (WebAssembly) |
| **Size** | 169.7 KB |

## What it is

The compiled UnRAR decompressor (about 174 KB).

## How it works

- Binary WebAssembly module, not human-readable. Loaded by `libunrar.js`. Marked `binary` in `.gitattributes`.

## Why it exists

RAR is a proprietary format that needs a dedicated decoder; compiling UnRAR to WASM is the only way to read it in a browser.

## Referenced by

Files in this project that mention this asset by name or path:

- `data/src/compression.js`
