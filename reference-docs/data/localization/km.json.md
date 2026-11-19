# `km.json`

| | |
|---|---|
| **Path** | `data/localization/km.json` |
| **Category** | Localization |
| **Size** | 13.4 KB |
| **Lines** | 340 |

## What it is

Khmer translation of the EmulatorJS player interface (`km`).

## How it works

- A flat JSON object mapping English UI strings (keys) to translated text. `data/loader.js` picks the file from `EJS_language` or the browser locale, falls back from regional codes such as `pt-BR` to `pt`, and merges it over the defaults into `config.langJson`.
- `EJS_Frontend.localization(text)` looks each label up and falls back to English if a key is missing (missing keys are collected for debugging).

## Why it exists

Lets Khmer-speaking players use menus, settings and messages in their language.
