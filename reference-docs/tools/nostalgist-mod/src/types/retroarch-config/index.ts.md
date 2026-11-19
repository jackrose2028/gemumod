# `index.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/types/retroarch-config/index.ts` |
| **Category** | TypeScript source (types) |
| **Size** | 1.4 KB |
| **Lines** | 40 |

## What it is

Combines all RetroArch config interfaces into one `RetroArchConfig` type.

## How it works

- Interface declarations only; compiled away by esbuild.

## Why it exists

Gives autocomplete and checking for RetroArch config objects passed to Nostalgist `retroarchConfig`.
