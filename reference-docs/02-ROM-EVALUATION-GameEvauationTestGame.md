# ROM evaluation: `GameEvauationTestGame.sfc`

A full technical evaluation of the SNES ROM you supplied: what it is, how its raw 65816 machine code produces a running game, and how this website pulls the file in and plays it.

> **Method and limits.** Everything below was measured from the file itself: header fields, checksum, byte statistics, a custom 65816 disassembler I wrote for this evaluation, and a recursive code trace from the reset, NMI and IRQ vectors. The ROM was not run in an emulator for this document. I could not compare it with a reference database (no network), so the identification as *Super Mario All-Stars* comes from the header title, size, checksum validity and internal signatures, not from a database match. Parts marked **(inference)** are interpretations of the evidence. This is a commercial Nintendo title; this document describes its structure and does not reproduce its graphics, music or large code listings. Only play ROMs you are legally entitled to use.

## 1. Identity

| Property | Value |
|---|---|
| File name | `GameEvauationTestGame.sfc` (as uploaded; the "test game" name is yours, not the cartridge's) |
| Size | 2,097,152 bytes (exactly 2 MiB = 64 banks of 32 KiB) |
| Copier header | None (size is an exact multiple of 1024, so there is no 512-byte header; ROM byte 0 is file byte 0) |
| MD5 | `53c038150ba00d5f8d8574b4d36283f2` |
| SHA-1 | `c05817c5b7df2fbfe631563e0b37237156a8f6b6` |
| SHA-256 | `a9e3e57d591e995e8e0dd228b619b6aed42205eaf55316fa8ff33f236b3a32b3` |
| Internal title | `SUPER MARIO ALL_STARS` (21 bytes, space padded) |
| Mapping | LoROM (`$20`, slow ROM) |
| Cartridge type | `$02`: ROM + RAM + battery, no coprocessor |
| ROM size code | `$0B` (2 MiB) |
| RAM size code | `$03` (8 KiB battery SRAM) |
| Region code | `$01` (North America, NTSC) |
| Licensee | `$01` (Nintendo) |
| Version | 0 |
| Header checksum | complement `$55A3` + checksum `$AA5C` = `$FFFF` (valid) |
| Computed checksum | sum of every byte, 16-bit = `$AA5C` (**matches**) |

**What the checksum tells you:** the stored and recomputed checksums agree, so the file is internally consistent. Either it is an untouched dump, or any modification was followed by a checksum fix-up. It cannot prove which.

The title and header describe the 1993 Nintendo compilation that bundles four Super Mario games remade for the SNES. The ROM also contains the text `NAK1989 S-CG-CADVer1.23` eight times (at file offsets such as `0x12FF27`, `0x1E4F0B`). It looks like a signature left by a graphics-editing tool used during development. **(inference)**

## 2. What a `.sfc` file is

An SNES cartridge is a chip of read-only memory wired into the console's address bus. A `.sfc` file is a byte-for-byte copy of that chip. There is no file system and no executable format. The console's CPU (a 65C816 clocked at up to 3.58 MHz) simply starts executing bytes at an address read from a table near the end of the ROM. Everything else (graphics, tile maps, music, level data) is just more bytes that the code copies into the console's other chips.

## 3. How the ROM is laid out in memory

For LoROM, the 65816's 24-bit address is *bank:offset*. ROM appears in the upper half of each bank (`$8000-$FFFF`):

```
file offset = (bank & $7F) * $8000 + (offset - $8000)
bank $00 offset $8000  -> file $000000
bank $01 offset $8000  -> file $008000
...
bank $3F offset $FFFF  -> file $1FFFFF
banks $40-$7D, $80-$FF mirror the same 2 MiB
```

Other memory in the system, all outside the ROM file:

| Address | What | Used here for |
|---|---|---|
| `$7E:0000-$7F:FFFF` | 128 KiB work RAM (WRAM) | game variables, decompression buffers, copies of graphics before upload |
| `$70:0000-$70:7FFF` | Battery SRAM (8 KiB, mirrored) | save files |
| `$2100-$213F` | PPU registers (video chip) | screen mode, scroll, VRAM, palette, sprites |
| `$2140-$2143` | APU I/O ports | talking to the SPC700 sound processor |
| `$4200-$421F` | CPU I/O (NMI enable, joypads, multiply/divide) | timing and input |
| `$4300-$437F` | DMA channel registers | bulk copies ROM/WRAM to VRAM, CGRAM, OAM |

## 4. The cartridge header and vectors

The header lives at file offset `0x7FC0` (CPU `$00:FFC0`). The last 32 bytes of bank 0 hold the interrupt vectors the CPU reads from `$00:FFE4-$00:FFFF`:

| Vector | Address in ROM | Handler (bank 00) |
|---|---|---|
| COP (native) | `$FFE4` | `$82FE` (a bare `RTI`) |
| BRK (native) | `$FFE6` | `$FFFF` (unused) |
| ABORT (native) | `$FFE8` | `$82FE` |
| **NMI** (native) | `$FFEA` | **`$82D8`** |
| **IRQ** (native) | `$FFEE` | **`$836C`** |
| COP / ABORT / NMI (emulation) | `$FFF4 / F8 / FA` | `$82FE` |
| **RESET** (emulation) | `$FFFC` | **`$8000`** |
| IRQ/BRK (emulation) | `$FFFE` | `$836C` |

The console always powers on in 6502 "emulation mode", so RESET at `$00:8000` is where the game begins, which is the very first byte of the ROM file (`SEI`, opcode `78`).

## 5. How the raw code produces the game

### 5.1 Boot sequence (reset handler, `$00:8000`)

Disassembled from the file (shortened):

```
8000  SEI                     ; no interrupts
8001  STZ NMITIMEN ($4200)     ; NMI/IRQ/auto-joypad off
8004  STZ HDMAEN   ($420C)     ; HDMA off
8007  STZ MDMAEN   ($420B)     ; DMA off
800A  STZ $2140..$2143         ; clear the four sound-processor ports
8016  LDA #$80 : STA INIDISP   ; forced blank (screen off)
801B  CLC : XCE                 ; switch the CPU to native 65816 mode
801D  REP #$38                  ; 16-bit A/X/Y, binary arithmetic
801F  LDA #$0000 : TCD          ; direct page = $0000
8023  LDA #$01FF : TCS          ; stack = $01FF
8027  SEP #$30 : LDA #$00 : PHA : PLB   ; data bank = 0
802D  LDA $213F : BIT #$10 : BEQ $803B    ; read PPU status: PAL/NTSC bit
8034  JMP $93C7               ; PAL console -> separate screen routine
803B  JSR $83B6               ; clear RAM, init PPU/DMA tables
8040  STA $701FF0 / $701FF2   ; touch the SRAM
804D  STA $0150, $0152 ...    ; set up the game's task state
805A  LDA #$81 : STA NMITIMEN ; turn on NMI + auto joypad read
8060  JSR $8C1B               ; validate / initialise battery save data
8065  LDA #$AA : STA $702000 : CMP $700000 : BNE fail   ; SRAM mirror test
8071  LDA #$55 : STA $702000 : CMP $700000 : BNE fail
```

What this does, step by step:

1. **Silences the hardware** (interrupts, DMA, sound ports, screen forced blank) so nothing runs half-initialised.
2. **Switches to native 16-bit mode** and sets the stack and direct page.
3. **Region check.** Bit 4 of `$213F` is 1 on a PAL console. On PAL it jumps to `$93C7`, which loads a separate screen routine instead of the normal game. I did not trace that routine to its end, so what it displays is **(inference)** a region notice.
4. **Clears memory** with the helper at `$83B6`, which uses DMA transfers into WRAM rather than slow CPU loops.
5. **Save-RAM validation** (`$8C1B`). The code looks for two signature words in SRAM: `$9743` at `$70:0002` and `$5321` at `$70:1FFC`. If either is missing, it clears the 8 KiB SRAM, runs a per-slot initialiser sixteen times (counter at `$70:0004`), writes both signatures, and starts over. So the first launch of a blank save file creates a fresh save area.
6. **SRAM size test.** It writes `$AA`, then `$55`, to `$70:2000` and compares with `$70:0000`. On a real 8 KiB chip the two addresses are the same cell (the address wraps), so the compare succeeds. A failure jumps to `$00:9641`, which stops interrupts, silences the sound ports and then builds a screen with the same code pattern as the PAL path, so it is probably an error message **(inference, not traced to the end)**. On an emulator whose save RAM is sized from the header (8 KiB), the test passes.

### 5.2 The main loop (`$00:807D`)

```
807D  LDA $0122 : BEQ $807D     ; wait until the NMI sets the "frame ready" flag
8082  JSR $86CC                 ; read joypads
8085  CLI
8086  INC $FD                   ; frame counter
8088  LDX $E0                   ; current game mode
808A  LDA $883D,x : BEQ ...     ; optional per-mode pre-hook (JSR $8719)
8092  JSL $0080C7               ; run the current game mode
8096  ...                       ; optional per-mode post-hook (JSR $8773)
80A0  STZ $0122 : JMP $807D     ; clear the flag, wait for next frame
```

This is the classic console pattern: **the game logic runs once per video frame (about 60 times a second), paced by the vertical-blank interrupt.** The loop sleeps by spinning on `$0122`; the NMI handler sets it.

### 5.3 Input (`$00:86CC`)

The routine reads the auto-joypad results from `$4218-$421B` and keeps three values per pad: the current state, the previous state, and the "newly pressed this frame" mask, calculated as `(old XOR new) AND new`. Gameplay code reads those RAM bytes rather than the hardware.

### 5.4 The game-mode dispatcher (`$00:80C7`)

A one-byte variable `$E0` is the current mode. Three parallel 11-entry tables (low bytes at `$00:80A6`, high bytes at `$00:80B1`, bank bytes at `$00:80BC`) form 24-bit pointers. `JML [$0003]` jumps to the chosen mode's code. The ten used entries are:

| Mode | Target | What it appears to be |
|---|---|---|
| 0 | `$00:9BC0` | startup/logo sequence; has its own sub-state table at `$9B80` indexed by `$E1`, checks for Start/button presses and fades |
| 1 | `$00:A2D8` | loads the last-selected game from SRAM (`$70:000E/F`), sets up the menu screen and falls into mode 2 |
| 2 | `$00:A39B` | menu / game-selection logic **(inference)** |
| 3 | `$00:B1CE` | further menu/transition code |
| 4 | `$00:B440` | further menu/transition code |
| 5 | `$00:B2A5` | further menu/transition code |
| 6 | `$00:A2C5` | transition |
| 7 | `$00:89F9` | shuts down interrupts and sound (writes `$FF` to APU port 1) before handing off, i.e. **leaves the menu to start a game** **(inference)** |
| 8 | `$00:81A0` | copies 16 bytes of RAM (`$70-$7F`) into SRAM at `$70:0490`, stores `$D0/$D1` into `$70:000E/F`, i.e. **saves the menu state** |
| 9 | `$00:822B` | transition |
| 10 | `$00:0000` | unused slot |

### 5.5 Interrupts hand work to four game engines

The NMI handler at `$00:82D8` saves all registers, sets direct page 0 and data bank = program bank, then reads a mode byte from WRAM (`$7F:FF00`) and calls `JSR ($82CE,x)`. The IRQ handler `$836C` does the same with a table at `$8362`. The tables contain:

| Index | NMI target | IRQ target | Meaning |
|---|---|---|---|
| 0 | `$82FF` (menu NMI, in bank 0) | `$838B` | menu / shell |
| 1 | `JSL $03:8003` | `JSL $03:8006` | engine in bank `$03` (file `0x018000`) |
| 2 | `JSL $0D:8003` | `JSL $0D:8006` | engine in bank `$0D` (file `0x068000`) |
| 3 | `JSL $11:8003` | `JSL $11:8006` | engine in bank `$11` (file `0x088000`) |
| 4 | `JSL $20:8003` | `JSL $20:8006` | engine in bank `$20` (file `0x100000`) |

Each of those four banks begins with the same three-slot jump table: `$8000` = initialise, `$8003` = NMI handler, `$8006` = IRQ handler (for example bank `$03`: `JMP $8015`, `JMP $8308`, `JMP $850D`). That is a uniform plug-in interface: the shell in bank 0 is a launcher and the selected "engine" supplies its own frame code. Because the title is *Super Mario All-Stars*, the natural reading is **(inference)** one engine per bundled game. The recursive trace supports this: the code reachable from the vectors concentrates in bank 0 (6,205 bytes) and in banks `$03`, `$0D`, `$11`, `$20`.

The NMI body for the menu (`$82FF`) does the per-frame hardware work during vertical blank:

- restores the screen brightness from RAM (`STA INIDISP`),
- turns off HDMA, then calls further per-frame routines (`JSR $841A`, `JSR $87CC`); given the DMA activity elsewhere in bank 0, these are probably where queued data is pushed to VRAM/OAM/CGRAM **(inference, not traced)**,
- optionally programs the V-IRQ timer (`$4207-$420A`) for a mid-screen raster effect, then re-arms `NMITIMEN`.

### 5.6 How graphics reach the screen

The ROM does not store a picture. It stores:

1. **Tile graphics** (many are compressed; see the entropy table below),
2. **Tile maps** describing which tile goes where,
3. **Palettes**, and
4. **Code** that copies them to the video chip.

Evidence from the code scan of the whole ROM (counts of instructions that touch hardware registers):

| Register / action | Writes found |
|---|---|
| `MDMAEN $420B` (start DMA) | 174 |
| `VMADD $2116` (VRAM address) | 161 |
| `VMAIN $2115` (VRAM increment mode) | 96 |
| `NMITIMEN $4200` | 77 |
| `DAS0 $4305` (DMA byte count) | 47 |
| `VMDATA $2118` (direct VRAM write) | 45 |
| `HDMAEN $420C` (HDMA per-scanline effects) | 39 |
| `INIDISP $2100` (brightness / blank) | 36 |

The pipeline is: **ROM bytes -> (decompress into WRAM buffers) -> DMA during vertical blank into VRAM / palette RAM / OAM -> the PPU draws the picture 60 times a second.** The DMA is done during NMI because the PPU's memory is only safely writable while the beam is off-screen. HDMA (39 uses) provides per-scanline effects such as gradient backdrops and wavy backgrounds.

### 5.7 How sound reaches the speakers

The SNES sound system is a separate computer (an SPC700 CPU and DSP with its own 64 KiB RAM). The main CPU can only exchange four bytes with it through `$2140-$2143`. A scan for direct register accesses finds writes to port 0 (16), port 1 (19), port 2 (23) and port 3 (20), and reads of ports 2 and 3 (14 and 11). At reset the game zeroes all four ports; the error and mode-7 paths write `$FF` or `$F0` to them. Music and sound-effect data are streamed to the sound chip through those ports (an upload handshake, then command bytes). Sound commands in gameplay are single-byte writes to a port.

### 5.8 Save data

- 8 KiB battery SRAM at `$70:0000-$70:1FFF` (mirrored at `$70:2000`).
- Validity signature words `$9743` (at `$70:0002`) and `$5321` (at `$70:1FFC`).
- The menu stores the last-chosen game at `$70:000E/F` and copies a 16-byte block (RAM `$70-$7F`) to `$70:0490` when leaving.
- Roughly 333 direct long-address references touch bank `$70` and 33 touch bank `$71`, so save handling is spread through the code rather than isolated.

## 6. Whole-file map (statistics)

The table shows each 32 KiB bank. *Entropy* near 8 bits means compressed or random-like data; lower values mean code, tile maps or tables. *Inbound calls* counts `JSL`/`JML` instructions anywhere in the ROM whose target is that bank (banks `$40+` folded onto their mirror). It is a heuristic for "which banks are call targets", not a precise code map.

| Bank | File offset | Entropy | `00` bytes | `FF` bytes | Inbound calls |
|---|---|---|---|---|---|
| 00 | 000000 | 5.91 | 7% | 24% | 2465 |
| 01 | 008000 | 4.20 | 40% | 19% | 170 |
| 02 | 010000 | 3.69 | 35% | 32% | 121 |
| 03 | 018000 | 7.03 | 3% | 1% | 124 |
| 04 | 020000 | 7.22 | 4% | 4% | 183 |
| 05 | 028000 | 6.53 | 5% | 16% | 121 |
| 06 | 030000 | 4.57 | 42% | 10% | 70 |
| 07 | 038000 | 5.14 | 23% | 25% | 69 |
| 08 | 040000 | 5.14 | 36% | 8% | 143 |
| 09 | 048000 | 5.51 | 26% | 14% | 94 |
| 0A | 050000 | 3.33 | 62% | 0% | 49 |
| 0B | 058000 | 6.96 | 5% | 4% | 48 |
| 0C | 060000 | 5.56 | 16% | 22% | 277 |
| 0D | 068000 | 7.03 | 3% | 0% | 93 |
| 0E | 070000 | 6.97 | 3% | 15% | 94 |
| 0F | 078000 | 6.93 | 6% | 5% | 132 |
| 10 | 080000 | 4.91 | 36% | 11% | 152 |
| 11 | 088000 | 7.19 | 5% | 2% | 229 |
| 12 | 090000 | 7.02 | 2% | 0% | 139 |
| 13 | 098000 | 6.83 | 7% | 6% | 203 |
| 14 | 0A0000 | 6.69 | 14% | 7% | 283 |
| 15 | 0A8000 | 6.13 | 5% | 19% | 439 |
| 16 | 0B0000 | 5.48 | 34% | 1% | 55 |
| 17 | 0B8000 | 5.69 | 31% | 2% | 30 |
| 18 | 0C0000 | 4.97 | 33% | 18% | 69 |
| 19 | 0C8000 | 5.48 | 29% | 11% | 33 |
| 1A | 0D0000 | 3.86 | 29% | 32% | 114 |
| 1B | 0D8000 | 4.60 | 45% | 10% | 42 |
| 1C | 0E0000 | 4.95 | 33% | 14% | 137 |
| 1D | 0E8000 | 5.10 | 35% | 11% | 105 |
| 1E | 0F0000 | 2.30 | 76% | 2% | 87 |
| 1F | 0F8000 | 5.76 | 3% | 22% | 98 |
| 20 | 100000 | 7.00 | 6% | 1% | 462 |
| 21 | 108000 | 6.54 | 11% | 8% | 67 |
| 22 | 110000 | 4.80 | 3% | 45% | 457 |
| 23 | 118000 | 6.85 | 3% | 5% | 422 |
| 24 | 120000 | 7.14 | 4% | 5% | 92 |
| 25 | 128000 | 6.57 | 3% | 18% | 93 |
| 26 | 130000 | 6.97 | 3% | 9% | 52 |
| 27 | 138000 | 6.92 | 2% | 10% | 1075 |
| 28 | 140000 | 5.85 | 2% | 27% | 111 |
| 29 | 148000 | 6.97 | 3% | 7% | 263 |
| 2A | 150000 | 6.85 | 8% | 2% | 185 |
| 2B | 158000 | 6.57 | 21% | 3% | 102 |
| 2C | 160000 | 3.24 | 62% | 9% | 54 |
| 2D | 168000 | 4.63 | 33% | 18% | 67 |
| 2E | 170000 | 4.45 | 46% | 2% | 74 |
| 2F | 178000 | 5.36 | 33% | 5% | 41 |
| 30 | 180000 | 4.82 | 41% | 6% | 210 |
| 31 | 188000 | 5.41 | 34% | 8% | 60 |
| 32 | 190000 | 4.96 | 34% | 11% | 47 |
| 33 | 198000 | 4.48 | 46% | 7% | 76 |
| 34 | 1A0000 | 5.40 | 34% | 6% | 43 |
| 35 | 1A8000 | 4.66 | 43% | 5% | 45 |
| 36 | 1B0000 | 5.13 | 36% | 9% | 58 |
| 37 | 1B8000 | 5.28 | 35% | 8% | 76 |
| 38 | 1C0000 | 4.68 | 39% | 10% | 65 |
| 39 | 1C8000 | 5.40 | 36% | 5% | 63 |
| 3A | 1D0000 | 4.70 | 30% | 21% | 40 |
| 3B | 1D8000 | 6.93 | 3% | 12% | 23 |
| 3C | 1E0000 | 5.84 | 8% | 25% | 95 |
| 3D | 1E8000 | 3.90 | 45% | 18% | 73 |
| 3E | 1F0000 | 4.31 | 48% | 2% | 309 |
| 3F | 1F8000 | 4.08 | 52% | 3% | 70 |

Whole-file: 24.6% of bytes are `$00`, 11.4% are `$FF`, entropy 6.04 bits per byte. The ROM is therefore full: no large empty regions, and a mix of compressed and uncompressed content.

**Reachability caveat.** Following only direct jumps and calls from the vectors reaches about 15 KB of code (0.7% of the file). That is a lower bound, not the real code size, because the game dispatches almost everything through tables and indirect jumps (`JML [$0003]`, `JSR ($82CE,x)`, the per-engine tables). Fully mapping the code would need dynamic tracing in an emulator.

## 7. How playing the game is pulled in, and from where

This section connects the ROM to the website you uploaded (`EmulatorJS-main-TestNewVersion`). The ROM is **not** in that project: `data/SNES/` contains only a readme and an empty `index.json`, so the game has to reach the page from one of two places.

### 7.1 Path A: you drop or pick the file on the home page

1. **Drop / pick** on `index.html` (`#drop`, handled in `assets/app.js`). The file stays in the browser; nothing is uploaded.
2. **Classify** (`assets/detect.js: classifyFiles`): a single file becomes the ROM. A BIOS or `.ips/.bps/.ups` patch would be separated if dropped together.
3. **Detect the console** (`detectSystem`): the extension `sfc` is claimed only by the `snes` entry (`smc, sfc, fig, swc, gd3, gd7, dx2, bsx, bs, st`), so the system is `snes` without sniffing headers.
4. **Store** (`assets/library.js: remember`): the bytes go into IndexedDB database `EJS-library` (store `roms`, key `file|<name>|<size>`) and metadata into `localStorage["ejs-recent"]`. Files up to 512 MB are kept, so a 2 MiB ROM qualifies.
5. **Navigate** to `play.html?id=file|GameEvauationTestGame.sfc|2097152`.
6. **Open** (`assets/play.js`): `library.open(entry)` reads the bytes back from IndexedDB as a `File`.
7. **Engine** (default EmulatorJSMod, `engines/EmulatorJSMod.js`): sets `EJS_gameUrl` to that `File`, `EJS_core = "snes"`, `EJS_pathtodata = "data/"`, then injects `data/loader.js`. (NostalgistMod would also run it, using `assets/nostalgist-player.js`, since SNES needs no threads.)

### 7.2 Path B: the ROM sits in `data/SNES/` on the server

1. You place the file in `data/SNES/`. `assets/folders.js` finds it through a live directory listing (local `serve.py`) or through `data/SNES/index.json` (generated by `tools/generate-rom-index.mjs`, automatically by the GitHub workflow).
2. It appears in the **SNES** group on the home page and in the game-page dropdowns.
3. Clicking it opens `play.html?folder=SNES&file=GameEvauationTestGame.sfc`; `play.js` computes the URL `data/SNES/GameEvauationTestGame.sfc`.
4. `EJS_gameUrl` is that URL string. `EJS_Download` (`data/src/cache.js`) fetches it over HTTP(S) from **your own site** (no third party), and stores a copy in the `EmulatorJS-Cache` IndexedDB so the next start is instant. The service worker deliberately does not cache ROMs a second time.

### 7.3 Common path: from file to running game

| Step | Where | What happens |
|---|---|---|
| 1 | `data/loader.js` | builds the config from `EJS_*` globals, loads `emulator.js`, `emulator.css`, the language pack and `data/cores/manifest.json` in parallel |
| 2 | `emulator.js: getCore` | `data/src/consts.js` maps `snes` to `["snes9x", "bsnes"]`. The manifest lists only **snes9x** (4 variants), so snes9x is used |
| 3 | `fetchGameCore` | chooses `snes9x-wasm.7z` (or `-legacy-` on WebGL1 browsers, `-thread-` only if threads are enabled) and requests it as `data/cores/<file>?v=<size>` |
| 4 | `compression.js` | the `.7z` is extracted in a worker (`extract7z.js`) into the emulator's JavaScript glue, a WebAssembly binary, `core.json` and licence |
| 5 | `initModule` | starts the WASM runtime (RetroArch with the **snes9x** libretro core compiled in). Saves are mounted from IndexedDB at `/data/saves` |
| 6 | `downloadFiles` | `download(gameUrl)`; a `File` object is read directly, a URL is fetched; compressed content (zip/7z) would be unpacked here |
| 7 | `startGameFromDownload` / `selectRomFile` | picks the ROM file name and writes the bytes into the virtual file system as `/<name>` |
| 8 | `startGame` | `Module.callMain(["/GameEvauationTestGame.sfc"])`: RetroArch loads the file into the snes9x core |
| 9 | snes9x | (expected behaviour) parses the header at `0x7FC0`, detects LoROM, sizes SRAM from the RAM-size byte (8 KiB), loads the existing `.srm` (if any) from `/data/saves`, then **powers the emulated console on and executes the ROM from the RESET vector `$00:8000`** |
| 10 | per frame | the core runs the 65816, PPU, DMA and SPC700 for one frame; the page draws the canvas, plays the audio, and forwards keyboard/gamepad input (the game's joypad routine `$86CC` reads it as `$4218`) |

So the "code that runs the game" is the ROM's own machine code, and the thing that *runs* that code is the snes9x core: an emulated 65816, PPU, DSP and SPC700 compiled to WebAssembly and downloaded from **`data/cores/snes9x-*.7z` on your own site**.

### 7.4 Where progress is stored while playing

| Data | Where it lives |
|---|---|
| Battery save (`.srm`, 8 KiB) | `/data/saves/` in the emulator's file system, persisted to IndexedDB (`/data/saves`, via IDBFS auto-persist). Saved periodically and on exit |
| Save states | IndexedDB `EmulatorJS-states` (EmulatorJSMod) or `NostalgistMod-saves` (NostalgistMod) |
| Quick-save slots, resume point | persistent slots managed by `data/src/enhancements.js` |
| Recent-games entry and the ROM copy | `localStorage["ejs-recent"]` and IndexedDB `EJS-library` |
| Core and ROM download cache | IndexedDB `EmulatorJS-Cache` and Cache Storage `ejs-local-6-cores` (the `.7z` cores only) |

**Export backup** on the home page writes the first two rows (saves and states) plus settings into one JSON file; ROMs are excluded.

### 7.5 Compatibility notes specific to this ROM

- **No coprocessor** (cartridge type `$02`), so the snes9x core needs no special chip emulation; no Super FX/SA-1 data is required.
- **LoROM 2 MiB with 8 KiB SRAM** is a standard layout; the startup SRAM mirror test relies on the emulator sizing SRAM from the header, which snes9x does.
- **NTSC.** The reset code diverts PAL consoles to another screen. The header's region code is NTSC, which snes9x normally follows, so the normal path should run.
- **Threads are not needed**; SNES runs on the plain `snes9x-wasm.7z` variant, so the cross-origin-isolation service-worker reload is optional for this game.
- The ROM is 2 MiB, so cold start is dominated by the core download (about 1.1 MB), not the game.

## 8. Summary

- The file is a clean, 2 MiB LoROM image whose header says **SUPER MARIO ALL_STARS**, with a valid checksum, 8 KiB battery SRAM and no coprocessor.
- Execution starts at `$00:8000`. The shell in bank 0 initialises the hardware, validates save RAM, then runs a frame-locked main loop that calls a table-selected game mode. Four additional banks (`$03`, `$0D`, `$11`, `$20`) expose the same init/NMI/IRQ jump-table interface, which fits four bundled games (inference).
- Pictures and sound are not stored as pictures or audio: they are data that the code decompresses into RAM and pushes to the PPU with DMA during vertical blank, and to the sound processor through four I/O ports.
- On your site the ROM arrives either from your own browser's IndexedDB (drop/pick) or from `data/SNES/` on your own server, is written into an in-memory file system, and is executed by the **snes9x** WebAssembly core loaded from `data/cores/`. Nothing is fetched from a third party.

### Open questions I could not settle from the file alone

- Exactly which game each of the four engine banks contains.
- The complete code map (needs execution tracing).
- Whether this dump is bit-identical to a retail release (needs a reference hash database).
