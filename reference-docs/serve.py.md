# `serve.py`

| | |
|---|---|
| **Path** | `serve.py` |
| **Category** | Local server script |
| **Size** | 853 B |
| **Lines** | 21 |

## What it is

A tiny Python 3 development web server built on `http.server`.

## How it works

- Subclasses `SimpleHTTPRequestHandler` and adds three response headers: COOP `same-origin`, COEP `require-corp` (so threads work locally) and `Cache-Control: max-age=0, must-revalidate` (so rebuilt cores are not served stale from EmulatorJS's cache).
- Usage: `python3 serve.py 8000` (port optional). Because it is Python's standard server it also generates directory listings, which `assets/folders.js` reads so new ROMs appear without regenerating `index.json`.

## Why it exists

Browsers refuse ES modules over `file://`, and threaded cores need isolation headers. This gives a zero-install local server that satisfies both.

## Referenced by

Files in this project that mention this asset by name or path:

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
- `index.html`
- `package.json`
- `start-windows.bat`
