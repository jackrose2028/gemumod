# `CACHING.md`

| | |
|---|---|
| **Path** | `docs/CACHING.md` |
| **Category** | Documentation |
| **Size** | 16.1 KB |
| **Lines** | 417 |

## What it is

Design document for EmulatorJS's caching system (about 16 KB).

## How it works

- Sections: Overview, High-Level Architecture (EJS_Download + EJS_Cache), Detailed Implementation, Configuration Options, Best Practices, Troubleshooting and the Cache Manager UI. Includes the flow: URL cache check → expiry check → HEAD `Last-Modified` check → download.

## Why it exists

Explains why second launches are fast and how to tune size and age limits (`EJS_cacheConfig`).
