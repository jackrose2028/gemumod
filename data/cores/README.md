# Cores

Put the EmulatorJS core archives here exactly as they are, for example:

    data/cores/snes9x-wasm.7z
    data/cores/snes9x-legacy-wasm.7z
    data/cores/snes9x-thread-wasm.7z
    data/cores/snes9x-thread-legacy-wasm.7z

Then run `node tools/generate-core-manifest.mjs` (from the repository root) to refresh
`manifest.json`. The page reads that file to know which systems are available.
