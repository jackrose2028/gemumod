# `version.json`

| | |
|---|---|
| **Path** | `data/version.json` |
| **Category** | Data (configuration) |
| **Size** | 126 B |
| **Lines** | 6 |

## What it is

Version marker: `version: "4.2.3"` and a legacy `current_version: 999999`.

## How it works

- Upstream EmulatorJS used it for update checks. This local edition removed network update checks, so the file is informational only; its read_me says `current_version` is no longer updated.

## Why it exists

Retained so tools that expect the file still find it.
