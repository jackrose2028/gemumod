# `app.js`

| | |
|---|---|
| **Path** | `assets/app.js` |
| **Category** | Launcher script (home page) |
| **Size** | 19.4 KB |
| **Lines** | 472 |

## What it is

The ES module that powers `index.html` (about 20 KB).

## How it works

- **Startup:** loads the core manifest, builds the list of available systems (`SYSTEMS` filtered by which cores exist), registers the service worker, restores saved options, loads the platform folders and renders them, renders recent games, shows storage usage, and asks which engine to use if none is chosen (a `<dialog>`; Escape picks EmulatorJSMod).
- **Opening a ROM:** dropped or picked files go through `classifyFiles` (ROM vs BIOS vs patch) and `detectSystem`. If detection fails it shows a picker, optionally remembering the choice per extension (`localStorage ejs-system-<ext>`). It checks that threaded systems have `SharedArrayBuffer`, stores the files via `library.remember()`, then navigates to `play.html?id=…`.
- **Options** (threads, cache, library, debug, browser mode) are saved to `localStorage` under `ejs-launcher-options`. **Clear download cache** removes `ejs-local-*` caches and the `EmulatorJS-Cache` IndexedDB. **Export/Import backup** delegates to `backup.js`.
- Prefetches a system's core when you point at a game.

## Why it exists

Keeps the entry experience simple: pick or drop a game and get to the player, while hiding the complexity of system detection, BIOS/patch handling, engine choice and storage.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/common.js`
- `index.html`
- `sw.js`
