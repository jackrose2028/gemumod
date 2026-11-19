# `performance.js`

| | |
|---|---|
| **Path** | `data/src/performance.js` |
| **Category** | Engine feature module (added by this edition) |
| **Size** | 20.3 KB |
| **Lines** | 445 |

## What it is

`EJS_Performance`: measurement and tuning features (about 21 KB).

## How it works

- Stats overlay (Shift+F10): speed %, frame times, late frames, refresh rate, resolution, GPU and WebGL version, memory, startup timing. Detects software rendering (SwiftShader, llvmpipe…).
- Tuning: performance mode (Shift+F9), render scale 100/75/50%, auto frameskip, shader bypass, low-latency desynchronized canvas, run-ahead, refresh-rate adaptation (swap interval on 120/180/240 Hz displays), audio latency profiles (32/64/96/128 ms), slow-game detector, per-game profiles saved in `localStorage` (`ejs-perf`), and low-battery power saver (≤20%).
- Some settings only apply at next start because RetroArch reads them at boot.

## Why it exists

Weak or high-resolution devices struggle with emulation; these tools measure and fix the common causes.

## Referenced by

Files in this project that mention this asset by name or path:

- `CHANGES.md`
- `ENHANCEMENTS.txt`
- `data/src/emulator.js`
- `sw.js`
