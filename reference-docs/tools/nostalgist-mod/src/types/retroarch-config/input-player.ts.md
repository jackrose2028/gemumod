# `input-player.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/types/retroarch-config/input-player.ts` |
| **Category** | TypeScript source (types) |
| **Size** | 26.2 KB |
| **Lines** | 544 |

## What it is

Config keys for each player's controls (`input_player1_a_axis`, `…_mbtn`, gun and analog options…), about 27 KB.

## How it works

- Interface declarations only; compiled away by esbuild.

## Why it exists

Gives autocomplete and checking for RetroArch config objects passed to Nostalgist `retroarchConfig`.
