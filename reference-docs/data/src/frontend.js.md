# `frontend.js`

| | |
|---|---|
| **Path** | `data/src/frontend.js` |
| **Category** | Engine UI module |
| **Size** | 211.0 KB |
| **Lines** | 4,308 |

## What it is

`EJS_Frontend`: all user-interface code of the player (the biggest file, about 216 KB).

## How it works

- Creates the canvas, start button, loading text, error display and ads area; the bottom menu bar (play/pause, restart, save/load state, screenshot, mute and volume, settings, fullscreen, cheats, netplay, cache manager, disk switcher), context menu and popups.
- Builds the Settings menu (video, audio, shaders, speed, rewind, core options, control mapping per player for keyboard and gamepad), the Cheats menu, the Cache menu and the touch virtual gamepad (using nipplejs for sticks).
- Handles localization text lookup and the resume prompt.

## Why it exists

Separates presentation from emulation logic (`emulator.js`) so the UI can be changed or localised independently.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `data/src/emulator.js`
- `sw.js`
