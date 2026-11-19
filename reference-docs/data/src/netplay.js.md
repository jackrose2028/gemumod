# `netplay.js`

| | |
|---|---|
| **Path** | `data/src/netplay.js` |
| **Category** | Engine feature module |
| **Size** | 85.9 KB |
| **Lines** | 2,069 |

## What it is

`Netplay`: WebRTC multiplayer (about 88 KB).

## How it works

- Uses a Socket.IO signalling server (`EJS_netplayServer`) for room management (`open-room`, `join-room`, `users-updated`, `webrtc-signal`, `data-message`) and WebRTC peer connections (with optional ICE servers) to stream the host's video/audio and synchronise input.
- Builds the Netplay menu (room list, create room, chat, player table), handles passwords, max players, reconnects and hides host-only UI for guests.

## Why it exists

Lets players play together online. It needs an external signalling server, so it does nothing in a fully local setup unless you configure one.

## Referenced by

Files in this project that mention this asset by name or path:

- `data/src/emulator.js`

## Notes

- Netplay only becomes available when `EJS_netplayServer` (URL) and a numeric `EJS_gameID` are set (see the check in `frontend.js`). This site sets neither, so Netplay stays off by default and nothing contacts an outside server.
