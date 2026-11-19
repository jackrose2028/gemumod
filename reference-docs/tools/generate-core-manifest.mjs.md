# `generate-core-manifest.mjs`

| | |
|---|---|
| **Path** | `tools/generate-core-manifest.mjs` |
| **Category** | Maintenance script |
| **Size** | 3.2 KB |
| **Lines** | 81 |

## What it is

Node script that builds `data/cores/manifest.json` from the `.7z` core archives.

## How it works

- Scans `data/cores` (or a directory passed as argv[2]) for names matching `<core>[-thread][-legacy]-wasm.7z`, records each archive's byte size, and groups them by core name.
- For each core it extracts `core.json` from the smallest variant by running the project's own `data/compression/extract7z.js` worker inside Node's `vm` sandbox (no dependencies), then stores the core's display name, extensions, `defaultWebGL2` and `supportsMouse` flags.
- Writes `{files: {archive: size}, cores: {core: {...}}}` with no timestamp so automated commits stay quiet.

## Why it exists

The browser needs to know, without downloading anything, which cores and variants exist, what file types each handles and which WebGL level it prefers. File sizes double as cache-busting version numbers (`?v=size`).

## Referenced by

Files in this project that mention this asset by name or path:

- `.github/workflows/update-indexes.yml`
- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/app.js`
- `data/cores/README.md`
- `package.json`
