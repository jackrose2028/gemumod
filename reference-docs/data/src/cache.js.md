# `cache.js`

| | |
|---|---|
| **Path** | `data/src/cache.js` |
| **Category** | Engine core module |
| **Size** | 39.1 KB |
| **Lines** | 916 |

## What it is

Download manager and persistent cache (about 40 KB). Classes: `EJS_Download`, `EJS_Cache`, `EJS_CacheItem`, `EJS_FileItem`.

## How it works

- `EJS_Download.downloadFile()` fetches with progress, stall timeout and automatic decompression. For http(s) URLs it checks the cache first: unexpired `cacheExpiry` is used directly; otherwise a HEAD request compares `Last-Modified` with when the item was cached; otherwise it downloads. `blob:`/`data:` URLs are handled directly.
- `EJS_Cache` stores metadata and file blobs in IndexedDB (`EmulatorJS-Cache`), chunking large blobs into 50 MB pieces, with LRU eviction, a max size (default 4096 MB) and max age (default 7200 min), plus `cleanup()`.
- Used for cores, ROMs, BIOS and patches; powers the in-game Cache Manager menu.

## Why it exists

Cores are multi-megabyte; caching them (and decompressed contents) makes second launches fast and supports offline play. See `docs/CACHING.md` for the full design.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `data/src/emulator.js`
- `sw.js`
