# `extractzip.js`

| | |
|---|---|
| **Path** | `data/compression/extractzip.js` |
| **Category** | Web worker (vendored) |
| **Size** | 191.6 KB |
| **Lines** | 2 |

## What it is

A zip extractor (about 196 KB) run as a web worker.

## How it works

- Same message protocol as the 7z worker. Handles ROMs and BIOS shipped as `.zip` and any zip-compressed content.

## Why it exists

Users commonly provide games as zip files; the emulator extracts them in the browser.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `data/src/compression.js`
- `sw.js`
