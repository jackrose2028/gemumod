# `en.json`

| | |
|---|---|
| **Path** | `data/localization/en.json` |
| **Category** | Localization |
| **Size** | 9.6 KB |
| **Lines** | 341 |

## What it is

English translation of the EmulatorJS player interface (`en`).

## How it works

- A flat JSON object mapping English UI strings (keys) to translated text. `data/loader.js` picks the file from `EJS_language` or the browser locale, falls back from regional codes such as `pt-BR` to `pt`, and merges it over the defaults into `config.langJson`.
- `EJS_Frontend.localization(text)` looks each label up and falls back to English if a key is missing (missing keys are collected for debugging).

## Why it exists

Lets English-speaking players use menus, settings and messages in their language.

## Notes

- English is the reference set. The loader skips fetching it (`en` and `en-US` are defaults), and the other files should contain the same keys.
