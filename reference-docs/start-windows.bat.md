# `start-windows.bat`

| | |
|---|---|
| **Path** | `start-windows.bat` |
| **Category** | Local server script |
| **Size** | 579 B |
| **Lines** | 20 |

## What it is

A Windows double-click launcher for `serve.py`.

## How it works

- Changes to its own folder, looks for `python` then `py`, prints a friendly install message if neither exists, opens `http://localhost:8000/` in the default browser, then runs `serve.py 8000`. Closing the window stops the server.

## Why it exists

Makes the project usable by non-technical Windows users without a terminal.

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

## Notes

- `.gitattributes` forces CRLF line endings on `.bat` files so Windows cmd parses them correctly.
