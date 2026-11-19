# `setup.js`

| | |
|---|---|
| **Path** | `data/src/setup.js` |
| **Category** | Engine core module |
| **Size** | 3.2 KB |
| **Lines** | 84 |

## What it is

`EJS_SETUP`: small configuration normaliser run at startup.

## How it works

- Warns about deprecated `EJS_cacheLimit`; fills cache defaults (enabled, 4096 MB, 7200 min) and fixes invalid values; converts `browserMode` (`mobile`/`desktop`/1/2) to numeric; merges the built-in shaders with `EJS_shaders` extras.

## Why it exists

Keeps messy user config out of the main class.

## Referenced by

Files in this project that mention this asset by name or path:

- `data/src/emulator.js`
- `sw.js`
