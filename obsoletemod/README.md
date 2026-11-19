# Emu

Seven-system retro emulator shelf. It opens in All mode with three default games: Dr. Mario (NES), Frogger (SNES), and Tetris & Dr. Mario (SNES).

- The gamepad button reveals the full 59-game library in All mode.
- All mode lists titles alphabetically across platforms; platform tabs are ordered by release year.
- Bundled ROM entries are in game-catalog.json; ROM files are grouped under roms/<system> and indexed by roms/manifest.json. ZIPs are unpacked locally in the browser. Update the manifest when adding codebase files because static hosting cannot list directory contents.
- Emulator settings are available from the gear button; Super Eagle is the default video filter.
- Each game has a ZIP export action for its source ROM and recognizable embedded/archived resources. NES iNES CHR tiles are exported as a PNG atlas; many other game asset formats require title-specific decoders.
- Game Gear uses EmulatorJS's genesis_plus_gx core.

## In this site (EmulatorJS local edition)

- Lives in `obsoletemod/` and is opened from the site's Links page (`links.html`), the Links link on the home page and the Links button on the game page. Its SITE button goes back to that Links page.
- Runs on the site's own EmulatorJSMod engine (`../data/loader.js`) and the `.7z` cores in `../data/cores`, so it also gets the F1 hotkeys, save slots and performance features. The old `emulator/cores/*.data` files and the CDN are no longer used.
- JSZip is local (`vendor/jszip.min.js`, MIT or GPLv3); Google Fonts were removed (system fonts are used instead), so nothing loads from outside the site.
- The ROM files are not part of the download: copy your `roms/<system>/` files back in. `roms/manifest.json`, `games.json` and `game-catalog.json` still list them.
