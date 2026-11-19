# `ENHANCEMENTS.txt`

| | |
|---|---|
| **Path** | `ENHANCEMENTS.txt` |
| **Category** | Documentation |
| **Size** | 33.5 KB |
| **Lines** | 552 |

## What it is

A long plain-text change log (about 34 KB) that lists every difference between this edition and the original EmulatorJS 4.3.0-pre source.

## How it works

- Organised in numbered sections: overview, how to use, files added/removed/changed, then six rounds of work: (1) efficiency rewrite for local hosting, (2) 50 player enhancements, (3) 50 engine improvements, (4) game-library folders and game page, (5) two engines, and an addendum (6) with 15 performance features.
- The home page links to it ("What's changed from the original EmulatorJS") and the service worker pre-caches it so it opens offline.

## Why it exists

A modified GPL project should say what it changed. It also doubles as a design record: it explains why each change was made (lost saves on exit, cache evicting the newest items, stuck keys, startup hangs and so on).

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `README.md`
- `index.html`
- `sw.js`

## Notes

- Good first read if you want to understand why this copy behaves differently from upstream EmulatorJS.
