# `sw.js`

| | |
|---|---|
| **Path** | `sw.js` |
| **Category** | Service worker |
| **Size** | 5.2 KB |
| **Lines** | 146 |

## What it is

The site's service worker (cache version `ejs-local-6`). It does two jobs: adds cross-origin isolation headers and caches the app and cores.

## How it works

- **Isolation headers:** every same-origin response is re-wrapped with `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Resource-Policy: same-origin`. That makes `SharedArrayBuffer` available, which threaded cores need. GitHub Pages cannot send these headers itself.
- **Install:** pre-caches a `SHELL_FILES` list (pages, scripts, CSS, workers, engines, manifest, logos). Failed adds are ignored so one missing file does not break install.
- **Routing in `handle()`:** navigations, folder URLs and `manifest/index/platforms.json` use network-first (so new games show up); `data/cores/*.7z` use cache-first with a cap of 12 cores (oldest evicted); other site files with known extensions use stale-while-revalidate; ROMs and anything else go straight to the network (EmulatorJS keeps its own copy).
- Skips non-GET, cross-origin and Range requests. On activation it deletes old `ejs-local-*` caches.

## Why it exists

Gives threaded cores (PSP, DOS) a way to work on hosts that cannot set headers, and gives repeat visits and offline play fast loads.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/common.js`

## Notes

- The README says to bump `VERSION` whenever you change files in `data/` or `assets/` so visitors pick up changes immediately.
- Needs https or localhost. On the first visit the page reloads once so the worker takes control (handled in `assets/common.js`).
