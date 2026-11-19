# `index.html`

| | |
|---|---|
| **Path** | `index.html` |
| **Category** | Page (entry point) |
| **Size** | 10.2 KB |
| **Lines** | 116 |

## What it is

The home page of the site. It is the file a visitor lands on and it provides the drop zone, game library, recent games, engine chooser and options panel.

## How it works

- Pure markup plus one inline script: if the page is opened over `file://` it replaces the "Loading cores…" status with instructions to use a local web server.
- Defines the DOM that `assets/app.js` fills in: `#status`, `#engineInfo`, `#drop` (file input), `#picker` (system chooser), `#foldersSection`, `#recentSection`, an `<details id="advanced">` options panel (system, BIOS, patch, threads, cache, library, debug, browser mode, export/import backup, storage info) and an `<dialog id="engineDialog">`.
- Almost every control has a `data-tip` attribute; `assets/tooltips.js` turns these into hover/tap help. Loads `assets/app.css` and `assets/app.js` (as an ES module) and links the web manifest and icons.

## Why it exists

A static site needs one landing page. This one lets a player either click a library game or drop their own ROM (with optional BIOS and IPS/BPS/UPS patch), and keeps all configuration in one visible place.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/app.js`
- `assets/play.js`
- `play.html`
- `sw.js`
