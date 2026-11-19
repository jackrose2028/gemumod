# `path-shim.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/libs/path-shim.ts` |
| **Category** | TypeScript source (library) |
| **Size** | 1.5 KB |
| **Lines** | 44 |

## What it is

A minimal POSIX `path` implementation (join, dirname, basename, extname, parse, normalize).

## How it works

- Replaces the `path-browserify` package, which Nostalgist used only for these functions.

## Why it exists

Removes a dependency and shrinks the bundle.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/libs/vendors.ts`
