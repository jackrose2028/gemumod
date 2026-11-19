# EmulatorJS (local edition): project overview

This folder holds one reference document for every file in `EmulatorJS-main-TestNewVersion`. Start here for the big picture, then open `01-INDEX.md` to jump to any asset.

## What the project is

A static website (no server code, no build step needed to run it) that plays retro console games in the browser. It is a modified copy of **EmulatorJS 4.3.0-pre**. The emulation itself is done by *libretro cores* compiled to WebAssembly and packed as `.7z` archives. This edition removes every outside dependency (no CDN, no update checks), so it can be hosted on GitHub Pages or any static host and works offline after the first visit.

**Not in the zip:** the core archives themselves (`data/cores/*.7z`, about 284 MB) and any ROMs. Only the list of cores (`data/cores/manifest.json`) is present. Copy the archives in before use.

## How the pieces fit

```
index.html ── assets/app.js ──► choose a ROM / library game / recent game
                                   │ (system detection: assets/detect.js, folders.js, library.js)
                                   ▼
play.html ─── assets/play.js ──► picks an engine (assets/common.js ENGINES)
                                   │
              ┌────────────────────┴───────────────────────┐
              ▼                                            ▼
   engines/EmulatorJSMod.js                     assets/nostalgist-player.js
   sets window.EJS_* globals                    + engines/NostalgistMod.js
   injects data/loader.js                       (built from tools/nostalgist-mod/src)
              ▼                                            ▼
   data/src/emulator.js (+ frontend, GameManager,   Nostalgist → RetroArch (WASM)
   cache, compression, enhancements, performance)
              ▼
   data/cores/<core>[-thread][-legacy]-wasm.7z  ← picked via data/cores/manifest.json
   (extracted by data/compression/extract7z.js in a web worker)

sw.js (service worker): adds COOP/COEP headers so threads work on GitHub Pages, and caches the app and cores.
```

## The two engines

| | EmulatorJSMod | NostalgistMod |
|---|---|---|
| Entry | `engines/EmulatorJSMod.js` → `data/loader.js` | `assets/nostalgist-player.js` → `engines/NostalgistMod.js` |
| UI | Full EmulatorJS menu bar, settings, cheats, shaders, touch gamepad, netplay (optional), F1 hotkey panel | Minimal canvas and toolbar |
| Threaded cores (PSP, DOS) | Yes | No |
| Saves | IndexedDB (`/data/saves`, `EmulatorJS-states`) | IndexedDB (`NostalgistMod-saves`) |

Both engines expose the same contract (`info`, `supports(system)`, `launch(...)`), which is why `play.js` can swap them.

## Where data lives in the browser

| Store | Key / name | Written by |
|---|---|---|
| localStorage | `ejs-launcher-options` | `assets/app.js` |
| localStorage | `ejs-recent`, `ejs-playtime` | `assets/library.js`, `enhancements.js` |
| localStorage | `ejs-settings`, `ejs-enhancements`, `ejs-perf` | `emulator.js`, `enhancements.js`, `performance.js` |
| localStorage / sessionStorage | `ejs-engine`, `ejs-engine-remembered`, `ejs-system-<ext>` | `assets/common.js`, `app.js` |
| IndexedDB | `EJS-library` (recent ROM/BIOS/patch bytes) | `assets/library.js` |
| IndexedDB | `EmulatorJS-Cache` (downloaded cores/games) | `data/src/cache.js` |
| IndexedDB | `/data/saves`, `EmulatorJS-states`, `NostalgistMod-saves` | engines |
| Cache Storage | `ejs-local-6-shell/runtime/cores` | `sw.js` |

## Useful URLs

- `play.html?folder=NES&file=Game.nes`: a library game
- `play.html?id=<id>`: a game stored from the home page
- `play.html?url=roms/game.nes&core=nes`: any URL on the site
- `play.html` or `play.html?folder=NES`: library view; add `&autoplay=1` to start the first game
- Add `&engine=emulatorjs|nostalgist`, `&threads=1`, `&debug=1`, `&lang=xx`, `&cache=0` as needed

## Maintenance commands

| Task | Command |
|---|---|
| Run locally | `python3 serve.py 8000` or `start-windows.bat` |
| Refresh the list of cores | `node tools/generate-core-manifest.mjs` |
| Refresh the game lists | `node tools/generate-rom-index.mjs` |
| Minified build | `npm install && npm run minify`, then set `window.EJS_useMinified = true` |
| Rebuild NostalgistMod | `npm i -D esbuild ini && node tools/nostalgist-mod/build.mjs` |

## Things worth knowing

- Opening `index.html` from disk (`file://`) does not work: browsers block ES modules.
- After changing files in `data/` or `assets/`, bump `VERSION` in `sw.js`.
- Version labels differ by file (`4.3.0-local`, `4.3.0-pre`, `4.2.3`); they are not kept in sync.
- `minify/README.md` says `node run minify`; the working command is `npm run minify`.
- Netplay needs an external signalling server and is off unless one is configured.
- The code is GPL-3.0. Keep `LICENSE`. Host only ROMs and BIOS files you have the right to share.

## How each reference document is laid out

Every document has: a small facts table (path, category, size, lines), **What it is**, **How it works**, **Why it exists**, **Referenced by** (files in the project that mention it by name or path, found by search) and, where useful, **Notes**. Binary files (images, wasm) and very large generated or vendored files are described from their role and surrounding code rather than line by line.
