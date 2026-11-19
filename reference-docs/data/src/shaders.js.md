# `shaders.js`

| | |
|---|---|
| **Path** | `data/src/shaders.js` |
| **Category** | Engine data module |
| **Size** | 136.3 KB |
| **Lines** | 237 |

## What it is

`EJS_SHADERS`: a dictionary of 13 built-in video shaders (about 140 KB).

## How it works

- Names: 2xScaleHQ, 4xScaleHQ, sabr, crt-aperture, crt-easymode, crt-geom, crt-mattias, crt-beam, crt-caligari, crt-lottes, crt-zfast, crt-yeetron, bicubic, mix-frames.
- Each is either plain GLSL text or an object with a main `shader` and extra `resources` (text or base64), written to RetroArch's file system and enabled via `shader_enable`. Users can add more with `EJS_shaders`.

## Why it exists

Lets players apply CRT or upscaling looks without any external downloads.

## Referenced by

Files in this project that mention this asset by name or path:

- `data/src/setup.js`
- `sw.js`
