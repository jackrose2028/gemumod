# `utils.js`

| | |
|---|---|
| **Path** | `data/src/utils.js` |
| **Category** | Engine core module |
| **Size** | 2.7 KB |
| **Lines** | 73 |

## What it is

Utility functions.

## How it works

- `simpleHash()`: fast 32-bit hash that reads 32-bit words and finishes with an avalanche step (used for cache keys). `cyrb53()`: 53-bit hash returning 14 hex chars. `guid()`: random GUID string.

## Why it exists

Hashing is needed to identify files in caches and saves without hashing byte-by-byte slowly.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `data/src/cache.js`
- `data/src/emulator.js`
- `data/src/netplay.js`
- `sw.js`
