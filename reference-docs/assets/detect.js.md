# `detect.js`

| | |
|---|---|
| **Path** | `assets/detect.js` |
| **Category** | Launcher shared module |
| **Size** | 8.8 KB |
| **Lines** | 189 |

## What it is

Figures out which console a dropped file belongs to.

## How it works

- `SYSTEMS` is a table of [EmulatorJS system id, label, extensions] for about 40 systems (NES, SNES, GB, GBA, N64, NDS, Sega family, PlayStation, PSP, Atari, Amiga, Commodore, arcade, DOS…).
- `detectSystem(file, available)`: a unique extension wins; otherwise `sniffHeader()` reads the first 64 KB for magic bytes (iNES header, N64 byte orders, Game Boy logo, GBA/NDS logos, Sega 'SEGA'/'TMR SEGA' markers, ISO9660 'CD001' with PLAYSTATION/PSP identifiers, 3DO, Lynx, Atari 7800); otherwise `sniffZip()` reads the zip central directory (no decompression) to see inner file extensions.
- `classifyFiles()` splits a multi-file drop into ROM, BIOS (names like `bios`, `scph1001`, `syscard`) and patch (`.ips/.bps/.ups`); the largest remaining file is the ROM.

## Why it exists

Many extensions are shared by several consoles (`.bin`, `.iso`, `.cue`, `.zip`). Good detection avoids asking the player and avoids launching the wrong core.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/app.js`
- `assets/folders.js`
- `assets/nostalgist-player.js`
- `assets/play.js`
- `engines/EmulatorJSMod.js`
- `sw.js`
