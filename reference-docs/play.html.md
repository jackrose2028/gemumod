# `play.html`

| | |
|---|---|
| **Path** | `play.html` |
| **Category** | Page (game player) |
| **Size** | 1.5 KB |
| **Lines** | 34 |

## What it is

The game page. Every game, from any source, opens here.

## How it works

- Header bar with a **Home** link, the title, **Platform** and **Game** dropdowns, an **Engine** dropdown, a hint area and a slot (`#engineTools`) for the engine's own toolbar.
- `<main id="display"><div id="game"></div></main>` is where the emulator is mounted. `#banners` shows notices. `assets/play.js` does all the work.
- With no game selected it becomes the game library view (see `assets/play.js`).

## Why it exists

Separating the player from the home page means every game has a shareable URL (`play.html?folder=NES&file=Game.nes`) and the engine can be swapped by reloading the page with `?engine=`.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/app.css`
- `assets/app.js`
- `assets/folders.js`
- `assets/play.js`
- `sw.js`
