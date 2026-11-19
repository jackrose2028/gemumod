# `retroarch.json`

| | |
|---|---|
| **Path** | `data/localization/retroarch.json` |
| **Category** | Localization (reference data) |
| **Size** | 29.4 KB |
| **Lines** | 618 |

## What it is

A list of about 615 RetroArch core-option identifiers (keys like `fceumm region`) with matching display text.

## How it works

- Same flat key→string shape as the language files. No script in this copy loads it by name; it is shipped as reference data for naming and translating core options, which the player reads from the core at runtime.

## Why it exists

Core options come from libretro cores as terse identifiers; this table is the upstream project's pool of friendlier labels.

## Notes

- Treat as optional data. Removing it does not affect the loader.
