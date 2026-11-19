# `ejs-input-bridge.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/classes/ejs-input-bridge.ts` |
| **Category** | TypeScript source (added by this edition) |
| **Size** | 5.5 KB |
| **Lines** | 138 |

## What it is

`EjsInputBridge`: keyboard and gamepad input for EmulatorJS-built cores.

## How it works

- EmulatorJS core builds ignore RetroArch's keyboard joypad driver and take input through the exported `simulate_input(player, index, value)`. The bridge listens for key events and the Gamepad API, maps them using the configured `input_playerN_*` bindings and the EmulatorJS RetroPad button order, and calls `simulate_input`.
- Releases all buttons when the window blurs or the tab hides; ignores key presses on form controls.

## Why it exists

Without this bridge the cores built for EmulatorJS would load but not respond to the keyboard or pad in NostalgistMod.

## Referenced by

Files in this project that mention this asset by name or path:

- `engines/NostalgistMod.js`
- `tools/nostalgist-mod/src/classes/emulator.ts`
