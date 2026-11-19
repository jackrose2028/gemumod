# `tooltips.js`

| | |
|---|---|
| **Path** | `assets/tooltips.js` |
| **Category** | Launcher shared module |
| **Size** | 2.9 KB |
| **Lines** | 76 |

## What it is

Tiny tooltip system for any element with a `data-tip` attribute.

## How it works

- Creates a single `#tooltip` element, shows it on mouseover and keyboard focus, positions it under (or above) the target within the viewport, and sets `aria-describedby`.
- For touch devices it adds a small `?` badge you can tap to show the same text.

## Why it exists

The home page explains every option in plain language. A shared helper keeps the markup clean and makes the help accessible by keyboard and touch.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/app.js`
- `sw.js`
