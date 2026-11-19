# `app.css`

| | |
|---|---|
| **Path** | `assets/app.css` |
| **Category** | Stylesheet |
| **Size** | 9.0 KB |
| **Lines** | 100 |

## What it is

The dark-theme stylesheet shared by `index.html` and `play.html` (about 9 KB).

## How it works

- CSS variables (`--bg #111418`, `--card`, `--line`, `--text`, `--muted`, `--accent #1aafff`, `--warn`, `--bad`). Styles for cards, buttons, rows, banners, tooltip and `?` badge, platform lists and game grids, error box, engine chooser cards, the game-page header, library view and the NostalgistMod canvas, toast and toolbar (`.nm-*`).

## Why it exists

One small stylesheet keeps both launcher pages consistent and avoids any CSS framework or external font.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `index.html`
- `play.html`
- `sw.js`
