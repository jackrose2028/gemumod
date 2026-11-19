# `common.js`

| | |
|---|---|
| **Path** | `assets/common.js` |
| **Category** | Launcher shared module |
| **Size** | 8.6 KB |
| **Lines** | 201 |

## What it is

Helpers shared by the home page and the game page.

## How it works

- `$`, `params`, `flag` helpers; `readOptions()` merges saved options with URL overrides (`?debug`, `?threads`, `?cache=0`, `?browserMode`).
- `loadManifest()` fetches `data/cores/manifest.json` and exposes it as `window.EJS_coreManifest`; `isAvailable(system)` checks whether any variant of a system's cores is installed; `needsThreads(system)` consults `data/src/consts.js`.
- `setupServiceWorker()` registers `sw.js` and, on the first visit, reloads once so isolation takes effect (returns `isolated`, `reloading`, `unsupported` or `unavailable`).
- `ENGINES` registry (emulatorjs → `engines/EmulatorJSMod.js`, nostalgist → `assets/nostalgist-player.js`) with `getEngine/setEngine/needsEngineChoice` using `?engine=`, `sessionStorage` and an optional remembered `localStorage` value.
- `coreFileFor()` and `prefetchCore()` compute the exact core archive URL an engine will request and download it in the background (skipped on data-saver or 2G), so the caches are warm.
- `banner()` shows dismissible notices.

## Why it exists

Both pages need the same manifest, engine and service-worker logic; centralising it avoids duplication and keeps behavior consistent.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/app.js`
- `assets/nostalgist-player.js`
- `assets/play.js`
- `engines/EmulatorJSMod.js`
- `sw.js`
