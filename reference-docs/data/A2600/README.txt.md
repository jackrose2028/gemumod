# `README.txt`

| | |
|---|---|
| **Path** | `data/A2600/README.txt` |
| **Category** | Documentation (game folder) |
| **Size** | 529 B |
| **Lines** | 13 |

## What it is

Placeholder instructions for the `data/A2600/` game folder (Atari 2600).

## How it works

- Tells you to put Atari 2600 ROM files (or zips containing them) in this folder, that they will appear on the home page and in the game page's Game dropdown, and how to refresh the list (`node tools/generate-rom-index.mjs`; automatic on GitHub; unnecessary when using `start-windows.bat` / `serve.py`).
- Reminds you to add only games you have the right to share, because the folder is public on GitHub Pages.

## Why it exists

A folder with no files disappears from Git, and a newcomer needs to know what belongs here. The readme keeps the folder in the repo and documents the workflow.

## Notes

- Mapped to EmulatorJS system id `atari2600` by `data/platforms.json`.
