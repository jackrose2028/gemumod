# `gamepad.js`

| | |
|---|---|
| **Path** | `data/src/gamepad.js` |
| **Category** | Engine core module |
| **Size** | 5.9 KB |
| **Lines** | 162 |

## What it is

`GamepadHandler`: event layer over the browser Gamepad API.

## How it works

- Polls `navigator.getGamepads()`, with display-frame polling while pads are connected and a slow 500 ms scan while none are (250 ms when the tab is hidden). Applies a small dead zone and emits `connected`, `disconnected`, `buttondown`, `buttonup`, `axischanged` events, with readable labels like `LEFT_TOP_SHOULDER` and `DPAD_UP`.

## Why it exists

The raw Gamepad API has no events for button changes; this gives the control-mapping UI and input code a clean event stream while minimising CPU use.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `data/src/emulator.js`
- `sw.js`
