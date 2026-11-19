# `index.ts`

| | |
|---|---|
| **Path** | `tools/nostalgist-mod/src/index.ts` |
| **Category** | TypeScript source (entry) |
| **Size** | 46 B |
| **Lines** | 2 |

## What it is

Package entry. Re-exports `Nostalgist` from `entries/esm.ts`.

## How it works

- One line: `export { Nostalgist } from './entries/esm.ts'`.

## Why it exists

Standard library entry point so other code can import the package by name.
