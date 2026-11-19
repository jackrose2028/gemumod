# `contributors.json`

| | |
|---|---|
| **Path** | `docs/contributors.json` |
| **Category** | Data |
| **Size** | 1.5 KB |
| **Lines** | 47 |

## What it is

Machine-readable contributor lists: an `ignore` list of logins and a `missing` list with contributions, avatar URL and profile URL.

## How it works

- Holds an `ignore` list of logins and a `missing` list of contributors (login, contribution count, avatar URL, profile URL). It looks like input data for a script that generates `contributors.md`; that script is not in this copy.

## Why it exists

Keeps the contributor list as data, so a credits page can be regenerated.
