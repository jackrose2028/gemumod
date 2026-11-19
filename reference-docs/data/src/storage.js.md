# `storage.js`

| | |
|---|---|
| **Path** | `data/src/storage.js` |
| **Category** | Engine core module |
| **Size** | 8.5 KB |
| **Lines** | 249 |

## What it is

`EJS_STORAGE` (IndexedDB key-value wrapper) and `EJS_DUMMYSTORAGE` (no-op).

## How it works

- Keeps one connection per database name, creates stores/indexes on upgrade, and offers `get`, `put`, `remove`, `forEach`, `getSizes`, `getAll`, `getKeys`, retrying once if the connection is closed.
- If IndexedDB is unavailable the dummy implementation returns empty results so the player still works.

## Why it exists

Save states, cache and NostalgistMod saves all need reliable local persistence with graceful degradation.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/nostalgist-player.js`
- `data/src/cache.js`
- `data/src/emulator.js`
- `sw.js`
