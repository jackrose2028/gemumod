# `README.md`

| | |
|---|---|
| **Path** | `data/cores/README.md` |
| **Category** | Documentation |
| **Size** | 397 B |
| **Lines** | 12 |

## What it is

Instructions for the (here empty) `data/cores/` folder.

## How it works

- Tells you to drop core archives named like `snes9x-wasm.7z`, `snes9x-legacy-wasm.7z`, `snes9x-thread-wasm.7z`, `snes9x-thread-legacy-wasm.7z`, then run `node tools/generate-core-manifest.mjs`.

## Why it exists

Explains the naming convention the loader relies on: base core name, optional `-thread`, optional `-legacy` (WebGL1), then `-wasm.7z`.
