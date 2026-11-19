# `backup.js`

| | |
|---|---|
| **Path** | `assets/backup.js` |
| **Category** | Launcher shared module |
| **Size** | 6.7 KB |
| **Lines** | 160 |

## What it is

Export and import of all player progress as one JSON file.

## How it works

- Dumps two IndexedDB databases (`/data/saves` for in-game saves and `EmulatorJS-states` for save states) plus every `ejs-*` key from `localStorage`. Binary values are base64-encoded with type tags (`__u8`, `__ab`, `__date`) and the file is marked `emulatorjs-backup`.
- `importBackup()` decodes and writes entries back, replacing same-named ones and keeping others; it errors helpfully if other tabs block the database.

## Why it exists

Browser storage is fragile and device-bound. A backup lets players keep a safe copy or move progress to another browser; ROMs are excluded so the file stays small.

## Referenced by

Files in this project that mention this asset by name or path:

- `ENHANCEMENTS.txt`
- `assets/app.js`
- `sw.js`
