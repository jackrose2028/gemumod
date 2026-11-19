# `README.txt`

| | |
|---|---|
| **Path** | `data/GB/README.txt` |
| **Category** | Documentation (game folder) |
| **Size** | 523 B |
| **Lines** | 13 |

## What it is

Placeholder instructions for the `data/GB/` game folder (Game Boy).

## How it works

- Tells you to put Game Boy ROM files (or zips containing them) in this folder, that they will appear on the home page and in the game page's Game dropdown, and how to refresh the list (`node tools/generate-rom-index.mjs`; automatic on GitHub; unnecessary when using `start-windows.bat` / `serve.py`).
- Reminds you to add only games you have the right to share, because the folder is public on GitHub Pages.

## Why it exists

A folder with no files disappears from Git, and a newcomer needs to know what belongs here. The readme keeps the folder in the repo and documents the workflow.

## Notes

- Mapped to EmulatorJS system id `gb` by `data/platforms.json`.
