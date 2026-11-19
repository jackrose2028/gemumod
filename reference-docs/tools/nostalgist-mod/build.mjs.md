# `build.mjs`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/build.mjs` |
| **Category** | Build script |
| **Size** | 1.1 KB |
| **Lines** | 23 |

## What it is

esbuild script that bundles the modified Nostalgist.js TypeScript source into `engines/NostalgistMod.js`.

## How it works

- Entry point `src/entries/esm.ts`, output ES2022 ESM, bundled in one file. Prepends a banner crediting Nostalgist.js (arianrhodsandlot) and embedding the MIT license text from `LICENSE.txt`.
- Needs `esbuild` and the `ini` package (`npm i -D esbuild ini`).

## Why it exists

The runtime site ships one prebuilt JS file. This script is how that file is regenerated after editing the TypeScript.

## Referenced by

Files in this project that mention this asset by name or path:

- `README.md`
- `package.json`
