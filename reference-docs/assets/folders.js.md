# `folders.js`

| | |
|---|---|
| **Path** | `assets/folders.js` |
| **Category** | Launcher shared module |
| **Size** | 4.4 KB |
| **Lines** | 95 |

## What it is

Finds the games stored in the site's `data/<FOLDER>/` directories.

## How it works

- `loadPlatforms()` reads `data/platforms.json`. `listFolder()` tries a live directory listing first, but only on local hosts (localhost, private IPs, `.local`) so GitHub Pages does not log 404s; it falls back to `index.json`.
- `isGameFile()` keeps ROM extensions for that system plus zip/7z and drops readmes, images, saves and patches. `loadFolders()` returns only platforms whose cores are installed, fetching folders in parallel.
- `romUrl`, `gameTitle` (strips extension, underscores → spaces) and `playUrl` (builds `play.html?…` while preserving `debug`, `lang`, `threads`, `engine`).

## Why it exists

Implements the 'put a ROM in a folder and it shows up' experience on both a plain static host and a local server.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/app.js`
- `assets/play.js`
- `sw.js`
