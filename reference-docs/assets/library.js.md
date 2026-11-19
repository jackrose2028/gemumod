# `library.js`

| | |
|---|---|
| **Path** | `assets/library.js` |
| **Category** | Launcher shared module |
| **Size** | 5.6 KB |
| **Lines** | 151 |

## What it is

The 'Recent games' store.

## How it works

- Metadata (id, name, system, size, last played, BIOS/patch names) lives in `localStorage` (`ejs-recent`, max 12). The actual bytes of the ROM, BIOS and patch live in the IndexedDB `EJS-library` (store `roms`), up to 512 MB per ROM.
- `remember()` stores a game and trims old ones; `open()` rebuilds `File` objects; `forget()` deletes everything; `setPending/takePending` hold a BIOS or patch chosen on the home page for the next game opened from a link; also play-time and time-ago formatting.

## Why it exists

A file picked on the home page cannot be passed across a page navigation. Storing it in the browser lets `play.html` open it by id and lets the player re-launch it later with one click, entirely offline and without uploading anything.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/app.js`
- `assets/play.js`
- `sw.js`
