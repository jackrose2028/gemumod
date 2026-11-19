# `esm.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/entries/esm.ts` |
| **Category** | TypeScript source (entry) |
| **Size** | 54 B |
| **Lines** | 2 |

## What it is

The ES-module entry that `build.mjs` bundles into `engines/NostalgistMod.js`.

## How it works

- Re-exports `Nostalgist` from `classes/nostalgist.ts`.

## Why it exists

esbuild needs one entry file; this one defines what the final bundle exports.

## Referenced by

Files in this project that mention this asset by name or path:

- `tools/nostalgist-mod/build.mjs`
- `tools/nostalgist-mod/src/index.ts`
