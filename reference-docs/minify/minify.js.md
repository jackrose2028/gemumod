# `minify.js`

| | |
|---|---|
| **Path** | `minify/minify.js` |
| **Category** | Build script |
| **Size** | 1.2 KB |
| **Lines** | 47 |

## What it is

Node script that produces `data/emulator.min.js` and `data/emulator.min.css`.

## How it works

- Uses **rollup** with the **terser** plugin to bundle `data/src/emulator.js` and everything it imports into one ES module (with source map, dynamic imports inlined), and **@node-minify/clean-css** to compress `data/emulator.css`.
- Errors are caught and printed.

## Why it exists

One minified file replaces about a dozen module requests. `data/loader.js` uses it when `window.EJS_useMinified = true` and falls back to the unminified files if the minified ones fail to load.

## Referenced by

Files in this project that mention this asset by name or path:

- `package.json`

## Notes

- Output files are git-ignored (see `.gitignore`).
