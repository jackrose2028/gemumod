# `extract7z.js`

| | |
|---|---|
| **Path** | `data/compression/extract7z.js` |
| **Category** | Web worker (vendored) |
| **Size** | 273.6 KB |
| **Lines** | 2 |

## What it is

A 7-Zip extractor (about 280 KB) that runs as a web worker.

## How it works

- Receives a `Uint8Array` via `onmessage`, extracts it with an Emscripten-compiled 7z decoder and posts progress (`t` message codes) and each file (`{t:2, file, data}`) back, with a final `t:1` when done.
- Used by `data/src/compression.js` (loaded as a Blob worker), by NostalgistMod for core archives, and by `tools/generate-core-manifest.mjs` inside a Node `vm` sandbox.

## Why it exists

Cores are shipped as `.7z` because it compresses WebAssembly far better than zip; decompression in a worker keeps the page responsive.

## Referenced by

Files in this project that mention this asset by name or path:

- `assets/nostalgist-player.js`
- `data/src/compression.js`
- `engines/NostalgistMod.js`
- `sw.js`
- `tools/generate-core-manifest.mjs`
- `tools/nostalgist-mod/src/libs/options.ts`
