# `generate-rom-index.mjs`

| | |
|---|---|
| **Path** | `tools/generate-rom-index.mjs` |
| **Category** | Maintenance script |
| **Size** | 1.6 KB |
| **Lines** | 34 |

## What it is

Node script that writes `data/<FOLDER>/index.json` for every platform in `data/platforms.json`.

## How it works

- Reads `platforms.json`, ensures each folder exists, lists files (ignoring dotfiles, `index.json`, readmes, `.DS_Store`, `Thumbs.db`), records `{name, size}` sorted with natural numeric ordering, and rewrites the JSON only if it changed.
- Prints `FOLDER  N file(s)` for each platform and a summary.

## Why it exists

Static hosts such as GitHub Pages cannot return folder listings, so the site learns what games exist by reading these generated indexes.

## Referenced by

Files in this project that mention this asset by name or path:

- `.github/workflows/update-indexes.yml`
- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/folders.js`
- `data/A2600/README.txt`
- `data/GB/README.txt`
- `data/GBC/README.txt`
- `data/GG/README.txt`
- `data/N64/README.txt`
- `data/NES/README.txt`
- `data/SNES/README.txt`
- `package.json`

## Notes

- Run it with `node tools/generate-rom-index.mjs` or `npm run index`. The GitHub workflow runs it automatically.
