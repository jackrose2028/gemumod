# `emulator.css`

| | |
|---|---|
| **Path** | `data/emulator.css` |
| **Category** | Stylesheet |
| **Size** | 37.4 KB |
| **Lines** | 1,858 |

## What it is

The EmulatorJS player's stylesheet (about 38 KB). All class names start with `ejs_`.

## How it works

- Styles the player container `.ejs_parent`, the start button, loading text, canvas, bottom menu bar (auto-hides after about 3 s), popups, settings and cheat menus, context menu, touch virtual gamepad, control-mapping UI, cache manager, netplay panel, ads container and mobile layout.

## Why it exists

The in-browser emulator UI needs to look consistent on any host page; namespacing everything under `ejs_` prevents clashes with the site's own CSS.

## Referenced by

Files in this project that mention this asset by name or path:

- `data/loader.js`
- `minify/minify.js`
- `sw.js`

## Notes

- `minify/minify.js` can produce `emulator.min.css` from it.
