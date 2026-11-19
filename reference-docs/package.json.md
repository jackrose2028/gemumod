# `package.json`

| | |
|---|---|
| **Path** | `package.json` |
| **Category** | Build configuration |
| **Size** | 755 B |
| **Lines** | 24 |

## What it is

The npm manifest for the project (name `emulatorjs-local`, version `4.3.0-local`, `type: module`, private, GPL-3.0).

## How it works

- Defines five scripts: `start` (python3 serve.py 8000), `manifest` (generate-core-manifest.mjs), `minify` (minify/minify.js), `build:nostalgist` (tools/nostalgist-mod/build.mjs) and `index` (generate-rom-index.mjs).
- Lists dev-only dependencies: rollup and @rollup/plugin-terser plus @node-minify/core and clean-css (for the minify script), esbuild and ini (for the NostalgistMod build). Nothing is needed at runtime.

## Why it exists

Gives every maintenance task a short, memorable command and records which tools those tasks need. `type: module` lets the `.mjs`/ES-module scripts run without extra flags.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`

## Notes

- Runtime needs no npm install at all; the site is static files.
- Three different version strings exist: `4.3.0-local` here, `4.3.0-pre` in `data/src/consts.js`, and `4.2.3` in `data/version.json`. They are independent labels.
