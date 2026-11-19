# `README.md`

| | |
|---|---|
| **Path** | `README.md` |
| **Category** | Documentation |
| **Size** | 5.5 KB |
| **Lines** | 103 |

## What it is

The project's main readme. It introduces this build as a self-contained, local-files-only copy of EmulatorJS (no CDN, no outside requests) that is ready to publish on GitHub Pages.

## How it works

- Walks through quick start (copy core archives into `data/cores/`, run `node tools/generate-core-manifest.mjs`, serve with `start-windows.bat` or `python3 serve.py 8000`).
- Explains GitHub Pages publishing, the two engines (EmulatorJSMod and NostalgistMod) in a comparison table, the per-platform ROM folders, hotkeys (F1 to F11), backup, URL parameters for `play.html`, threads via the service worker, the core naming scheme, the optional minified build and licensing.

## Why it exists

It is the single entry point for anyone who receives the project: it says how to run it, how to deploy it, where to put games and cores, and what legal obligations apply (GPL-3.0, ROM rights).

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`

## Notes

- It states 187 core archives are supplied with the project. They are NOT inside the zip you uploaded; only `data/cores/manifest.json` (the list of them) is present. You must copy the `.7z` cores in yourself.
- `file://` does not work. A web server is mandatory because browsers block ES modules there.
