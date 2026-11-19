# `play.js`

| | |
|---|---|
| **Path** | `assets/play.js` |
| **Category** | Launcher script (game page) |
| **Size** | 14.9 KB |
| **Lines** | 331 |

## What it is

The ES module for `play.html` (about 15 KB). It decides which game to run and starts the chosen engine.

## How it works

- Accepts four URL forms: `?folder=NES&file=Game.nes` (library game), `?id=…` (a file stored from the home page), `?url=roms/game.nes&core=nes` (any site URL; system guessed from extension or header if `core` is missing) and none (library view).
- Loads the manifest and service worker, lists folders, fills the Platform and Game dropdowns, and `fillEngines()` populates the Engine dropdown (changing it reloads with `?engine=`).
- **Library view:** lists every ROM per platform as buttons; hovering or focusing one prefetches that system's core; `?autoplay=1` jumps straight into the first game; engines that cannot run a platform (e.g. NostalgistMod on PSP/DOS) get disabled buttons with a reason.
- For a real game it loads the selected engine module, calls its `launch({container, game, options, onExit, toolbar})`, and shows the engine's hint text. Errors are shown in a friendly box with Back-to-home.

## Why it exists

One page, one script that works for every engine and every way of naming a game, so links are shareable and engines are interchangeable.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/common.js`
- `data/src/emulator.js`
- `play.html`
- `sw.js`
