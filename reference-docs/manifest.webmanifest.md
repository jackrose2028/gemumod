# `manifest.webmanifest`

| | |
|---|---|
| **Path** | `manifest.webmanifest` |
| **Category** | Web app configuration |
| **Size** | 375 B |
| **Lines** | 14 |

## What it is

A Progressive Web App manifest named "EmulatorJS" (standalone display, dark `#111418` theme, `docs/Logo.png` as the icon).

## How it works

- Linked from `index.html` and `play.html` with `<link rel="manifest">`. Browsers read it to offer "Install app" / "Add to home screen". `start_url` and `scope` are `./`, so it works in a GitHub Pages sub-folder.

## Why it exists

Lets the emulator be installed like an app and launched full-screen, which suits touch-device play together with the service worker's offline cache.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `index.html`
- `play.html`
- `sw.js`
