# `options.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/libs/options.ts` |
| **Category** | TypeScript source (library) |
| **Size** | 7.7 KB |
| **Lines** | 212 |

## What it is

Default and global options for Nostalgist (about 8 KB).

## How it works

- Builds the default RetroArch config (e.g. rgui menu, notifications off, auto-load state) and default URLs. This edition changes `coreArchiveCandidates(core)` so cores are fetched from `data/cores/*.7z` and honors `globalThis.NOSTALGIST_MOD = { coresPath, workerPath, manifest }`, which `nostalgist-player.js` sets before launching.

## Why it exists

This is where the 'no CDN, use local cores' behaviour is wired in.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
