# `ko.json`

| | |
|---|---|
| **Path** | `data/localization/ko.json` |
| **Category** | Localization |
| **Size** | 12.3 KB |
| **Lines** | 374 |

## What it is

Korean translation of the EmulatorJS player interface (`ko`).

## How it works

- A flat JSON object mapping English UI strings (keys) to translated text. `data/loader.js` picks the file from `EJS_language` or the browser locale, falls back from regional codes such as `pt-BR` to `pt`, and merges it over the defaults into `config.langJson`.
- `EJS_Frontend.localization(text)` looks each label up and falls back to English if a key is missing (missing keys are collected for debugging).

## Why it exists

Lets Korean-speaking players use menus, settings and messages in their language.

## Notes

- Contains 34 keys that `en.json` does not have (371 keys vs 338), so it was translated from a different version of the string list.
