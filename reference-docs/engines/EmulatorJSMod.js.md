# `EmulatorJSMod.js`

| | |
|---|---|
| **Path** | `engines/EmulatorJSMod.js` |
| **Category** | Engine adapter |
| **Size** | 2.2 KB |
| **Lines** | 52 |

## What it is

The entry point that lets the site start the full EmulatorJS player (the 'EmulatorJSMod' engine).

## How it works

- Exports `info`, `supports()` (always ok, every installed core runs, threaded ones included) and `launch({container, game, options, onExit})`.
- `launch()` translates the site's choices into EmulatorJS's global config variables: `EJS_player`, `EJS_gameName`, `EJS_gameUrl`, `EJS_biosUrl`, `EJS_gamePatchUrl` (the patch is renamed to sit next to the ROM so RetroArch applies it automatically), `EJS_core`, `EJS_pathtodata='data/'`, `EJS_startOnLoaded`, `EJS_threads` (only if requested/required AND `SharedArrayBuffer` exists), `EJS_cacheConfig`, `EJS_browserMode`, `EJS_language`, and exit callbacks.
- It then appends a `<script src="data/loader.js">` which does the actual startup. Returns the hint text 'F1 hotkeys'.

## Why it exists

Defines a common engine interface (`info/supports/launch`) so `play.js` can swap engines without knowing their internals. The upstream EmulatorJS is configured through globals; this wrapper is the translation layer.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `README.md`
- `assets/common.js`
- `sw.js`
