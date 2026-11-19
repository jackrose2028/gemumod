# `enhancements.js`

| | |
|---|---|
| **Path** | `data/src/enhancements.js` |
| **Category** | Engine feature module (added by this edition) |
| **Size** | 26.5 KB |
| **Lines** | 638 |

## What it is

`EJS_Enhancements`: play-session features layered on the core player (about 27 KB).

## How it works

- Hotkeys: F1 panel, F2 quick save, F3/Shift+F3 slot, F4 quick load, Shift+F4 undo load, F5 pause, Shift+F5 reset, F6 fast-forward, F7 slow motion, F8 screenshot, F9 mute, F10 FPS, F11 fullscreen.
- Persistent save slots, resume point autosave and a 'resume where you left off' prompt; auto-pause when the tab is hidden or a pad disconnects; controller combos (hold Select + shoulder buttons); rumble feedback; screen wake lock; Media Session integration; idle cursor hide; CRT scanline overlay; FPS counter; play-time tracking; low-battery watch; WebGL context-loss recovery.
- Preferences are stored in `localStorage` (`ejs-enhancements`); every feature degrades silently when its browser API is missing.

## Why it exists

Makes the emulator feel like a console-grade player (save slots, resume, shortcuts) without changing how games are emulated.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `data/src/emulator.js`
- `sw.js`
