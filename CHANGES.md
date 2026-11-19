# Changes

# 4.3.0-local.16: addendum, system and core chosen before a game file opens

Why: opening a zip with an N64 game could start it as an arcade game on the wrong core (FinalBurn Alpha 2012 CPS-1). Three things caused it: a zip was treated as arcade whenever its contents could not be read by name; the system picker remembered one answer per file type ("Remember for this file type" was ticked by default), so after one arcade zip every later zip went to arcade without asking; and a 7z was always taken for arcade.

1. Load game dialog: every ROM or zip opened on the home page (drop, file picker, Open file on phones) now shows the system it was detected as, how it was detected, and the emulator core that will run it, before anything starts. Both can be changed; Start game opens it, Cancel stops. When the system can't be told, the dialog asks for it and Start game waits until one is chosen.
2. Zips are read properly: the dialog looks inside the zip, decompresses the start of the largest file and checks its header, so an N64, NES, SNES, Game Boy, GBA, Mega Drive, Master System/Game Gear, Lynx or 7800 game is recognised even when the file inside has an odd name such as rom.bin; readme, picture and save files in the zip are ignored. File types inside the zip are the fallback.
3. Archives are never assumed to be arcade: a zip or 7z whose contents can't be identified asks for the system instead of picking arcade.
4. The old per-file-type answers ("every .zip is arcade") are deleted on the first visit after this update.
5. Core choice: the dialog lists the cores installed for the system (the default first) with a short note on each (for example "Mupen64Plus-Next: best compatibility", "FinalBurn Alpha 2012: Capcom CPS-1 arcade boards only"), and marks cores that need threads or that NostalgistMod cannot run. "Use this core for every <system> game" remembers the choice; it is then also used for games opened from the library folders, the player's library and links.
6. The chosen core really is used: it is stored with the game in Recent games and passed to the engine, and it takes priority over a core saved earlier in the EmulatorJS settings menu (which previously overrode it). `play.html?url=...&core=` also accepts a core name (for example `&core=parallel_n64`) as well as a system.
7. Threads follow the chosen core: a core that needs threads is only required when that core is picked.

# 4.3.0-local.15: addendum, 2.5D mode for NES and SNES

2.5D view (`data/src/depth25.js`, EmulatorJSMod)
1. A 2.5D button on the home page (next to the engine) turns 2.5D mode on or off; it is remembered, applies to NES and SNES games, and `?depth25=1` or `?depth25=0` on a game address overrides it for one game. With 2.5D on, NES and SNES games always start in EmulatorJSMod, which draws the effect.
2. How it looks: every frame is redrawn as a scene with depth. The colours that fill most of the screen (the backdrop, sky bands, a checkerboard) become a dimmed far layer; everything else (level tiles, platforms, characters, items, text) becomes raised blocks, one per game pixel, each with a lit top face above it, a light top edge, darker right and lower edges, and a soft shadow cast down and to the right onto the far layer, with shading where blocks meet it.
3. Backdrop colours are worked out from the picture several times a second, so the layering follows the game from screen to screen without any per-game setup.
4. Gameplay is untouched: the emulator, timing, input, saves, screenshots (F8 saves the flat game picture) and every other feature run as before; 2.5D only changes how the finished frame is shown, on a second canvas laid exactly over the game.
5. Adjustable while playing: Shift+F8 switches between 2.5D and the flat picture, and the F1 panel has a 2.5D section with Block height, Shadows, Background brightness and Highlights sliders, saved per game. The phone game menu has a "2.5D view" switch.
6. Keeps the game at full speed: the effect is computed in two GPU passes (one at the game's own resolution, one on screen). If frames start taking longer than the screen's refresh, it draws with fewer pixels (4, 3, then 2 per game pixel) and remembers the level for that device.
7. Limits: the depth is worked out from colours, not from the game's own layers (a browser emulator cannot see those), so it does not reproduce hand-made 3D remakes of particular games. Games with a plain backdrop (most NES games) show the clearest layering; very detailed SNES backgrounds are partly raised along with the foreground; the sliders tune the result per game.

# 4.3.0-local.14: addendum, iPhone and mobile review

Fixes and improvements from a full pass over the site on phones (emulated iPhone SE, iPhone 15 and 15 Pro Max, Android, portrait, landscape and rotating while playing, with real multi-touch input)
1. Landscape on small phones (iPhone SE): the game picture ran under the on-screen d-pad and buttons in both engines. It is now fitted between them and centred, so the whole picture stays visible; on wider phones nothing changes.
2. ObsoleteMod on phones: its page stylesheet limited the game canvas size, which shrank the picture to a quarter in a corner with the picture-sized buffer; the layout now takes precedence. Its header overflowed the screen on 375-pixel-wide phones (the SITE button is now on its LINKS page on phones) and its filter row was 8 pixels too wide on small phones.
3. No layout flash: phones get the phone layout before the page is first drawn (`assets/early-view.js`), instead of briefly showing the desktop layout.
4. Reference docs on phones: the header buttons now fit on one scrolling row, tables scroll sideways instead of breaking words letter by letter, and long names wrap.
5. Engine chooser: never taller than the screen, two columns in landscape; the "can't start this game" card has margins and full-width buttons.
6. Game menu in landscape: wider, with four tools per row and the pickers side by side, so it rarely needs scrolling; the "Full screen" button is no longer shown twice on Android.
7. iPhone home-screen app: the web app manifest allows both orientations and has an id; the Add to Home Screen tip mentions that saves are kept more reliably, and every game start asks the browser to keep saves (Safari otherwise clears site data after weeks without a visit).
8. The "rotate your device" message no longer appears in the phone layout, where portrait is a designed layout; it remains in other pages that embed the player.
9. Vibration on the NostalgistMod pad waits for the first tap (browsers block it before that and logged an error).
10. Home page: game counts no longer wrap; the engine chooser text mentions the NostalgistMod touch controls.

Checked and working on phones: no page is wider than the screen (all pages at 375 and 430 pixels); touch on the on-screen controls of both engines (holding a button, two fingers at once, release), the game menu (tap to open pauses the game, swipe down closes and resumes), the save slot picker by touch (pick, save, close), rotation during play, the library, the error screen, Links, reference docs and ObsoleteMod.

# 4.3.0-local.13: addendum, save slot picker with pictures (in-game UI)

One change to EmulatorJSMod (`data/src/enhancements.js`), available in every game
1. What it changes: the nine quick-save slots were invisible. You chose one by pressing F3 and reading a one-line message ("SAVE SLOT 4 (USED)"), with no way to see what a slot held, when it was saved, or to clear it. Now Shift+F2 opens a save slot picker over the game: all nine slots as cards with a picture of the game at the moment it was saved, how long ago that was, and which slot F2 and F4 use (marked with a star).
2. Pictures: every save into a slot (F2, the controller's Select+R1, the phone menu, the picker itself) stores a small JPEG of that moment next to the slot, about 8 KB for a SNES picture, kept in the browser with the save. Older saves made before this change show "No picture" until they are saved again.
3. Everything in one place: Save here (or save over), Load, Delete, Close. The slot you pick also becomes the F2 / F4 slot, so quick save and quick load keep working on it afterwards. Tapping a card selects it; tapping the selected card again loads it (or saves into it when empty).
4. Keyboard: arrow keys move, 1 to 9 jump to a slot, Enter loads (saves into an empty slot), S saves, L loads, Delete removes, Esc or Shift+F2 closes. Controller: Select+Up opens it, the d-pad moves, A loads, X saves, Y deletes, B closes. While it is open the keys and buttons drive the picker, not the game.
5. The game pauses while the picker is open and continues when it closes (unless you loaded a slot, which resumes from that slot). Its last frame is kept so a save made from the picker still gets a correct picture even though the game is paused.
6. It fits the screen without scrolling: three slots across in portrait and on desktop, five across on wide landscape screens such as a phone held sideways, re-laid out when the screen rotates or the window is resized; on touch screens the buttons are finger-sized and the phone's on-screen gamepad is hidden behind it.
7. Where to find it: Shift+F2 in game, Select+Up on a controller, "Save slots… (Shift+F2)" in the F1 panel, and "Save slots" in the phone game menu. F1's hotkey list includes the new keys.

# 4.3.0-local.12: addendum, idle audio suspension (audio efficiency)

One change to EmulatorJSMod (`data/src/performance.js`, plus a pause/play event in `data/src/emulator.js`), on by default
1. What it changes: RetroArch plays sound through a WebAudio context (Emscripten's OpenAL). EmulatorJS created it once and left it running for the whole session, so the browser's audio thread and the device's audio output kept working at full rate (44.1 or 48 kHz, hundreds of wake-ups a second) even when the emulator had stopped producing sound. Now the context is suspended whenever no sound can come out, and resumed when play continues.
2. When it suspends: the game is paused (F5, the F1 panel, the phone game menu, auto-pause when a controller disconnects) or the tab or app is in the background. It does not suspend while a game runs muted, because RetroArch then still feeds the audio queue and would wait for room.
3. Why sound comes back cleanly: the context is suspended, not closed, so the sound already queued is kept and playback continues from the same point. There is no skip, no burst of queued sound and no new audio setup on resume.
4. Measured (headless Chrome, SNES game paused for 10 seconds, three runs each): the browser used 45 to 50 units of CPU time with the context suspended against 55 to 58 with it running, about 18% less while paused, and the audio clock stopped advancing (0.00 s instead of 3.00 s over 3 seconds). On real hardware the larger saving is that the audio device can go idle, which most matters for laptops and phones on battery.
5. iPhone and iPad: Safari stops audio during calls, Siri or when you switch apps (the "interrupted" state) and the old code never restarted it, so the game came back silent. When the game is visible and running again the context is resumed, and if Safari needs a tap first, the next tap or key press brings the sound back.
6. Where to see it: Shift+F10 stats have a new Audio line, for example "44100 Hz, suspended (paused), idle audio stopped for 3 s", and the F1 panel's Performance section has a "Stop audio processing while paused or hidden" switch (saved per game) to compare with the old behaviour. Pausing and resuming, save and load states, fast forward and mute work as before.

# 4.3.0-local.11: addendum, phone and iPhone view

A separate layout for phones that adapts to the device (`assets/mobile.js`)
1. The site works out what it is running on (touch screen, phone or small tablet, iPhone/iPad, Android, opened from the home screen) and switches to a phone layout on touch devices whose short side is up to 820 px. Browser mode in the home page options now also chooses the layout (Auto, Desktop, Mobile), and `?view=phone|desktop|auto` overrides it for one visit.
2. Rotation is followed live: the page knows portrait from landscape, re-measures after iOS settles the new size, and lays the game out again for the new shape without reloading or interrupting play.
3. The visible height is measured from the visual viewport, so Safari's toolbars no longer push the bottom of the game or the controls off screen; notches, rounded corners and the home indicator are kept clear with safe-area insets on every page.

Game page on a phone
4. Portrait: a slim bar (Home, game title, menu button), the game picture directly below it at full width, and the touch controls in the lower half, so neither covers the other, like a handheld.
5. Landscape: the bar disappears and the game gets the whole screen, centred between the controls; a small translucent handle at the top opens the menu.
6. Game menu sheet (menu button or handle, swipe down or tap outside to close): pauses the game while open and resumes it when closed; it holds the Platform, Game and Engine choices, quick actions (EmulatorJSMod: save state, load state, undo load, reset, screenshot, fast forward; NostalgistMod: its toolbar), an on-screen controls switch, Full screen on Android, and links to Home, Library, Links and Docs.
7. No accidental zooming or pop-ups while playing: pinch, double-tap zoom, long-press callouts, text selection and page bounce are switched off over the game, while quick repeated button taps still register.
8. iPhone: Safari has no full-screen mode for web pages, so the menu explains Add to Home Screen once (dismissible); the pages carry the iOS web-app tags, so the site opens from the home-screen icon full screen with a dark status bar.

NostalgistMod on touch screens (`assets/touch-pad.js`)
9. A new on-screen controller (NostalgistMod had none, so it could not be played on a phone): d-pad with diagonals, face buttons matched to the system (NES and Game Boy B/A, SNES Y/X/B/A with L/R, Game Gear 1/2, Mega Drive A/B/C, Atari 2600 Fire, N64 A/B/Z/L/R), Select and Start.
10. Real multi-touch: every finger is tracked separately and can slide from one button to the next or around the d-pad; buttons light up while held, Android devices give a short vibration, and everything is released when the tab is hidden or the menu opens.
11. It sits below the picture in portrait and at the sides in landscape, hides itself while a physical controller is connected, and can be switched off in the menu (remembered).

Picture fixes found while testing on phones
12. Some phone browsers give RetroArch a drawing buffer in CSS pixels instead of device pixels. EmulatorJSMod's picture-sized buffer now measures the unit RetroArch really uses and sizes the canvas in it, so the picture is sharp and correctly placed on those phones as well (before, the buffer could end up a third of the intended resolution).
13. NostalgistMod no longer sets its own buffer size, which on such phones put the picture in one corner of the screen; RetroArch sizes it from the canvas box after every layout change, on phones and on desktops alike.

Home page and other pages on a phone
14. Home: a bottom bar with Open file, Library, Recent and Links; "Tap to open a game file" instead of the drop text; larger rows, game tiles in two columns (three in landscape); a compact header in landscape; no help badges in the link row; 16 px fields so iOS does not zoom when a field is tapped.
15. The game library in the player, the Links page and the reference docs viewer use the same phone layout, safe areas and touch sizes.

# 4.3.0-local.10: addendum, reference docs viewer

Reference docs (`reference-docs/`, `reference.html`)
1. The supplied reference documents are part of the site: 144 Markdown pages in `reference-docs/`, one for every file of the project in the same folder layout, plus a project overview (00), an asset index (01) and a ROM evaluation (02).
2. New viewer page `reference.html`: shows any document as a formatted page (tables, code blocks, headings), with a side list of all documents grouped by folder, a filter box (press / to jump to it; several words narrow the list, e.g. "nostalgist classes"), and Overview and Asset index buttons. On narrow screens the list opens from a Documents button.
3. Links between documents open in place and the address changes with them (`reference.html?doc=assets/app.js.md`), so Back and Forward work and any page can be bookmarked or shared; links to headings (`#data`) jump to them. Only documents in the list can be opened.
4. Everything is local: Markdown is rendered with a copy of marked (`assets/vendor/marked.esm.js`, MIT) and cleaned with DOMPurify (`assets/vendor/purify.es.mjs`, Apache-2.0 or MPL-2.0) before it is shown. The service worker now also keeps `.md` files, so the docs open offline after a first visit.
5. `tools/generate-reference-index.mjs` writes `reference-docs/files.json` (the list the viewer reads, since GitHub Pages cannot list folders); the GitHub workflow runs it on every push that changes the docs, and `npm run index` runs it too.

Links to it
6. Home page: a third link, "Reference docs", next to "What's changed from the original EmulatorJS" and "Links".
7. Links page: a third entry in Documents, after ENHANCEMENTS.txt and the README.

# 4.3.0-local.9: addendum, ObsoleteMod and the Links page

ObsoleteMod added to the site (`obsoletemod/`)
1. The ObsoleteMod project ("Emu", a seven-system retro game shelf with ten library views, folder/ZIP/ROM import, ROM asset export, touch controls, state saves and its own emulator configuration page) is now part of the site, in its own folder with its pages, styles and data files unchanged apart from the items below.
2. It runs on this site's EmulatorJSMod engine and the `.7z` cores in `data/cores` instead of the EmulatorJS CDN and its old `.data` core copies, so it works on GitHub Pages without any outside request and gets the F1 hotkeys, save slots and performance features (picture-sized buffer, lean surface and the rest).
3. JSZip (used for ZIP imports and the asset export) is served from `obsoletemod/vendor/jszip.min.js` instead of esm.sh; Google Fonts were removed and the styles fall back to system fonts. Both outside requests would also have been blocked by the cross-origin isolation the site uses for threads.
4. A SITE button in ObsoleteMod's header and on its ROM links page leads back to the site's Links page.
5. Its ROM files are not shipped with the site download; `obsoletemod/roms/<system>/` keeps the folders and `roms/manifest.json` and the catalogues keep listing the games, so copying the files back restores the library.

Links page
6. New `links.html`: one page with every part of the site: EmulatorJS home, the game library in the player, ObsoleteMod, ObsoleteMod's configuration, ROM links and readme, ENHANCEMENTS.txt and the README.
7. Reached from a Links link on the home page (next to "What's changed") and a Links button next to Home on the game page.

Engine fix found while adding ObsoleteMod
8. `data/loader.js` can now be loaded again on the same page. Pages that play several games without reloading (ObsoleteMod opens and closes its player) inject the loader once per game; the second time the browser stopped it with "already declared" errors, and the next game never started. The loader now runs in its own block.

# 4.3.0-local.8: addendum, lean opaque game surface (graphics efficiency)

One change to EmulatorJSMod (`data/src/performance.js`), on by default
1. What it changes: the WebGL surface the game is drawn on is now created opaque (alpha off) and, for 2D cores, without the depth and stencil buffers. EmulatorJS created it the WebGL default way: transparent (alpha on, premultiplied), plus a 24-bit depth and an 8-bit stencil buffer the size of the screen surface.
2. Why the transparent surface cost work: the browser had to treat the game as a see-through layer and blend every pixel of it with the page below, every frame. An opaque layer is simply copied, and Chrome, Edge and Safari can hand an opaque canvas to the GPU's hardware overlay (direct scan-out), skipping the page compositing step completely in full screen.
3. Why depth and stencil were waste: NES, SNES, Game Boy, Game Boy Color, Game Gear, Atari 2600 and every other 2D core draws its finished picture as one flat image; RetroArch's menu and shaders work in their own buffers. The two buffers cost 4 bytes of video memory per pixel: 4.3 MB at 1195×896, 8.9 MB at the old full-player 2000×1112, about 21 MB in 4K full screen, all freed. They no longer have to be resolved or cleared each frame either.
4. 3D cores keep both buffers: Nintendo 64 (mupen64plus_next, parallel_n64), PSP, DS, Dreamcast, Saturn, 3DS, hardware PlayStation renderers and DOS, plus any core whose name ends in _hw or gl. A site owner can keep them for every core by setting `keepDepthBuffer: true` in the EmulatorJS config.
5. Measured (Chrome with software graphics, SNES with the CRT Easymode shader at 2× density, the heaviest case available here, two runs each): 16.1 fps with the old surface, 16.9 fps with the lean one, about 5% faster with nothing else changed. Without a shader both run at a full 60 fps; on a real graphics chip the gain shows as lower GPU load and power use rather than higher fps.
6. Nothing looks different: the game picture, shaders, screenshots, save states and the black bars around the picture are unchanged (checked by reading back screenshots with and without a shader).
7. Where to see it: Shift+F10 stats have a new Surface line, e.g. "opaque, no depth/stencil (2D core)" or "depth/stencil kept (3D core)"; the F1 panel's Performance section shows it too and has a "Lean opaque game surface" switch (saved per game, applies from the next start) to compare with the old surface.

# 4.3.0-local.7: addendum, picture-sized render buffer (graphics efficiency)

One change to EmulatorJSMod (`data/src/performance.js`), on by default
1. What it changes: RetroArch makes its drawing buffer as large as the canvas box. EmulatorJS made that box the whole player area, black bars included, at the screen's full pixel density. A 256×224 SNES game in a 1000×555 player on a 2× (Retina / high-DPI) screen was drawn into a 2000×1112 buffer: 2.2 million pixels per frame, about a third of them black bars. Now the canvas box is exactly the game's picture, and on screens with enough pixels the buffer is a whole multiple of the game's own lines (×3 or more). The browser's compositor scales that buffer the last step to the picture size.
2. Measured (Chrome, SNES at 60 fps): 1× screen 1000×555 buffer → 740×555 (26% fewer pixels); 2× screen 2000×1112 → 1195×896 (52% fewer); 1920×1080 window with the NES test ROM 1920×882 → 878×672 (65% fewer). A 4K full screen drops from about 8.3 to 5.4 million pixels per frame for a 224-line game.
3. Why it is faster: every frame RetroArch clears, draws and presents fewer pixels, the WebGL buffer uses less video memory, and the browser has less to copy to the screen. This matters most on laptops and phones with high-density screens, integrated graphics, 4K monitors and full screen.
4. How the picture looks: the black bars are drawn by the page instead of the game. With the whole-number step, every game pixel is the same size (no uneven rows or shimmer when the screen scrolls); the browser's final smooth step of at most about 1.33× softens edges very slightly. When the picture has fewer than three screen pixels per game line, the buffer keeps full resolution and only the bars are removed, so a small player on a 1× screen looks exactly as before.
5. Follows the game: the layout is recalculated when the player is resized, on full screen, when the game changes resolution (menus, hi-res and interlaced modes, PAL/NTSC) and when the video rotation changes.
6. Works with the other performance features: render resolution and performance mode scale this smaller buffer further (performance mode on a 2× screen gives ×3 lines, 896×672).
7. Kept at full size where it matters: with a shader chosen the buffer keeps every screen pixel of the picture (CRT and scanline shaders need them; the bars are still left out); mouse and light-gun cores keep the original canvas so pointer positions stay exact.
8. Where to see it: Shift+F10 stats show a new Buffer line, e.g. "picture only, x4 lines, 52% fewer pixels than 2000×1112"; the F1 panel's Performance section shows the same and has a "Picture-sized render buffer" switch (saved per game) to compare with the old behaviour. Screenshots work as before.

# 4.3.0-local.6: addendum, 15 performance features and folder games in both engines

Performance features in EmulatorJSMod (`data/src/performance.js`)
1. Live performance stats, Shift+F10: emulation speed in % of full speed, frame time average and worst, late frames,
   display refresh rate, render resolution, graphics chip and WebGL version, core build, JS memory and startup time.
2. Startup timing: how long the core download, the game load and the boot took, shown in the stats and the F1 panel
   (and in the console with ?debug=1).
3. Slow-game detector: after a warm-up, a game that runs below 90% speed for 10 seconds offers performance mode once.
4. Performance mode, Shift+F9 or the F1 panel: one switch for features 5 to 7, on and off while playing.
5. Render resolution 100%, 75% or 50%: RetroArch draws into a smaller buffer that is stretched to the same size on
   screen, which cuts the GPU work on weak or very high-resolution screens. Mouse cores always use 100%.
6. Automatic frameskip: in performance mode, cores that offer a frameskip option are set to auto (or 1), and back again.
7. Shader bypass: in performance mode the chosen shader is switched off and restored afterwards.
8. Low-latency canvas: the game canvas is created with a desynchronized WebGL context, so frames reach the screen
   without waiting for the page compositor (less input lag where the browser supports it).
9. Run-ahead (optional, off by default): RetroArch's single-instance run-ahead of one frame removes a frame of
   built-in game lag at the cost of extra CPU. Skipped in performance mode.
10. Refresh-rate adaptation: the display rate is measured at start; on 120, 180 and 240 Hz screens RetroArch presents
    every 2nd, 3rd or 4th refresh so 60 fps games keep their normal speed and smooth pacing.
11. Audio latency choice: Low 32 ms, Normal 64 ms, Safe 96 ms or Stable 128 ms (was fixed at 64 ms). Lower is more
    responsive, higher stops crackling on slow devices.
12. Software graphics warning: when the browser draws WebGL in software (SwiftShader, llvmpipe, Basic Render Driver),
    a message explains how to turn on hardware acceleration and offers performance mode.
13. Per-game performance profiles: every setting above is saved per game, and a new game starts with the settings
    used last.
14. Core prefetch: pointing at (or tabbing to) a game on the home page or in the player's library downloads its core
    in the background, so it is cached when the game starts. Skipped with data saver or on 2G connections.
15. Low-battery power saver: on battery at 20% or less, performance mode turns on for the session, with a button to undo.

The F1 panel has a new Performance section with these settings. Run-ahead, audio latency, low-latency canvas and the refresh-rate adaptation apply from the next game start (RetroArch reads them at boot); the others apply at once.

Folder games in both engines
16. play.html without a game opens the game library inside the player: once the chosen engine and the core list are
    loaded, every ROM and zip in data/A2600, GB, GBC, GG, NES, SNES and N64 is listed by platform and starts with
    one click, in EmulatorJSMod or NostalgistMod. Platforms the engine cannot run are shown disabled with the reason.
17. play.html?folder=NES lists one folder; adding &autoplay=1 starts its first game.
18. The home page loads the chosen engine before listing the folders, marks platforms that engine cannot run, links to
    the library in the player, and lists the folders again when the engine is changed.
19. Only real game files count: a folder's ROM extensions plus zip and 7z. Readme files, cover art, saves and patches
    dropped into a folder no longer appear as games.
20. Two files with the same title (game.nes and game.zip) show their type in the library.
21. NostalgistMod requests cores with the same address as EmulatorJSMod (with ?v=), so both engines and the prefetch
    share one cached download.

# 4.3.0-local.5: two engines (EmulatorJSMod and NostalgistMod)

Engine choice
1. When the site opens, a dialog asks which engine to use: EmulatorJSMod or NostalgistMod. The question is asked once per
   browser session; "Remember my choice" stops it. The home page shows the current engine with a Change button.
2. The game page has an Engine dropdown that restarts the current game with the other engine; links between games keep it.
3. A file dropped while the question is open waits for the answer.
4. `engines/EmulatorJSMod.js` is the entry point for the existing engine (data/loader.js + data/src).

NostalgistMod (`engines/NostalgistMod.js`, source and build script in `tools/nostalgist-mod`)
5. Built from the Nostalgist.js source (MIT) with no CDN access at all: cores are read from `data/cores/*.7z` and unpacked
   with the site's own 7z worker; the CDN ROM and shader lookups and the zip.js download are removed.
6. Runs the EmulatorJS core builds as they are: a loader for their `EJS_Runtime` module format and `Module.parent`.
7. Input bridge: these builds take input through `simulate_input`, not RetroArch's keyboard driver, so keyboard
   (Nostalgist's default bindings), gamepads (standard layout, left stick also as d-pad, analog sticks) and
   `press()` / `pressDown()` / `pressUp()` are routed there. Held buttons are released on blur and when the tab is hidden.
8. Save and load state use the builds' in-memory state functions; screenshots read the builds' fixed screenshot path.
9. A `File` passed to Nostalgist keeps its name (it became data1.bin, which broke patches and cue/bin sets).
10. Only single-threaded core builds are used (Nostalgist does not start pthreads); PSP and DOS show a message with a
    button to switch to EmulatorJSMod.

NostalgistMod player on the game page (`assets/nostalgist-player.js`)
11. Toolbar: Pause/Resume, Reset, Save state, Load state, Screenshot, Fullscreen, Exit.
12. Hotkeys F2 save, F4 load, F5 pause, Shift+F5 reset, F8 screenshot, F11 fullscreen (same as EmulatorJSMod).
13. In-game saves (SRAM) are restored on start and written every 30 s, when the tab is hidden and on exit; save states are
    kept per game. Both live in IndexedDB ("NostalgistMod-saves").
14. Patches, BIOS files and zipped ROMs work as with EmulatorJSMod; the canvas follows the player size; sound starts on
    the first click or key press.

# 4.3.0-local.4: game library and game page

Game library folders
1. New folders `data/A2600`, `data/GB`, `data/GBC`, `data/GG`, `data/NES`, `data/SNES` and `data/N64` for ROMs and zips.
2. `data/platforms.json` maps each folder to its system; add a line and a folder to add another platform.
3. The home page lists the games in those folders after the core list has loaded, and only for platforms whose cores exist.
4. `tools/generate-rom-index.mjs` writes `data/<FOLDER>/index.json`, because GitHub Pages cannot list folders.
5. `.github/workflows/update-indexes.yml` regenerates the game lists and the core manifest on every push, so games
   uploaded through the GitHub website appear without running anything locally.
6. On a local server that lists folders (`serve.py`, `start-windows.bat`) new files appear without regenerating the index.

Game page (`play.html`)
7. Every game now opens on its own page with a Home link and the game name.
8. A Platform dropdown (folders with games, plus Recent games) and a Game dropdown switch to another game in one step.
9. Files opened from your device are stored with their BIOS and patch, so the game page (and a reload of it) can open them.
10. A BIOS or patch chosen under Options also applies to the next game opened from a library link.
11. Exiting the game, or "Back to menu" after an error, returns to the home page.

Home page
12. Every option, section and button has a three-sentence explanation on hover, on keyboard focus, or by tapping its "?" badge.
13. "What's changed from the original EmulatorJS" opens `ENHANCEMENTS.txt`, a full list of the changes.

Fixes found while building this
14. Engine: files downloaded from a URL keep their real name ("Green Test.nes", not "Green%20Test.nes", and no
    "?v=…" suffix), so patches and companion files (cue/bin, m3u) find each other.
15. Service worker: game lists and folder listings are always fetched fresh, and ROMs in the folders are not cached
    a second time (EmulatorJS keeps its own copy).
16. The core manifest no longer contains a timestamp, so it only changes when the cores change.

# 4.3.0-local.3: 50 engine improvements

Under-the-hood work in `data/src` (no change to how the page is used).

Saves and data safety
1. On exit, IndexedDB saves are flushed (`syncfs`) before `/data/saves` is unmounted; the last in-game save could be lost before.
2. In-game saves are written when the tab is hidden (mobile browsers often close hidden tabs without unload events).
3. Loading saves from IndexedDB can no longer hang startup: errors and a 10 s timeout fall back to in-memory saves with a warning.
4. In-game saves are not rewritten every interval while the game is paused.
5. `disableDatabases`, or a browser without IndexedDB, uses no-op save-state storage instead of failing.
6. Settings writes survive a full or blocked localStorage instead of throwing during page hide.
7. Per-game settings are parsed once and cached until the next write (they were re-parsed on every `getCore()` call).
8. A malformed per-game settings entry no longer stops volume and mute from loading.

Startup and errors
9. The first start error is kept on screen; follow-on errors no longer overwrite the real cause.
10. `startGameError` cannot throw halfway (it crashed when saved settings existed but the core had not loaded), so the error screen always appears.
11. Startup failures anywhere in the download/initialisation chain now show an error instead of stalling on the loading text.
12. A failed save-state download no longer leaves startup waiting forever.
13. Core archives are validated: a missing `.js`/`.wasm` or bad `core.json` gives "Invalid core archive" instead of a crash.
14. Missing PPSSPP assets (`ppsspp-assets.zip`, not in the supplied cores) no longer stop PSP games from starting.
15. In-memory ROM/BIOS data that cannot be read resolves as a failed download instead of hanging.
16. Errors in a local archive (corrupt zip/7z) are reported with the file name, labelled as game data, not "Game Core".
17. Archives that contain only junk entries report "No game file found".
18. Late progress updates after the game started no longer throw (loading text removed); errors recreate the text if needed.
19. The loader finds its own path when `document.currentScript` is unavailable, and shows a message in the player box when the engine files are missing.

Loading performance
20. Local uncompressed ROMs are used directly: no full-file hash and no second copy in IndexedDB (a 700 MB disc image was duplicated before).
21. Cache blob writes for one item happen in a single transaction, with the manifest written last so a partial write never looks complete.
22. Cache blob reads issue all chunk requests in one transaction and merge into one buffer.
23. `getKeys()` reads keys only; the old cursor loaded every cached chunk into memory during cleanup.
24. The cache database is opened once (it was opened in parallel by every download) and the probe connection is closed.
25. If the cache database cannot be opened the cache switches off and downloads continue.
26. Cache eviction removes the least recently used items; the old loop evicted the newest items first.
27. Directories created while unpacking archives are remembered instead of re-checked for every file.
28. External support files download in parallel, and one failure no longer affects the others.
29. Which cores exist locally is computed once from the manifest instead of scanning it on every lookup.

Input
30. Keys and buttons held while the window loses focus or the tab is hidden are released (they stayed pressed in the game).
31. Buttons held on a controller that disconnects are released for that player.
32. The emulator-hotkey input path no longer allocates an array per input event.
33. Quick load reports an empty slot ("SLOT n IS EMPTY") instead of claiming success.
34. Play/pause and autofire release are safe to call before the core is running.

Audio and video
35. Suspended audio resumes on the first click, key or tap on every browser (was Safari-only, polling every 10 ms); the Safari prompt closes on the audio state change.
36. Volume values are clamped to 0..1 and ignored safely before the core has loaded.
37. The WebGL2 support probe releases its context (browsers cap live WebGL contexts).
38. iPadOS (desktop user agent) and browsers with UA client hints are detected as mobile.
39. Screenshots use a valid image type (`jpg` becomes `image/jpeg`, unknown types fall back to PNG); a failed encode retries as PNG.
40. RetroArch-source screenshots time out after 5 s and fall back to the canvas instead of polling forever.
41. The player reacts to container size changes (ResizeObserver), not only window resizes.

Engine structure
42. Event handlers are isolated: one failing `on()` handler no longer stops the rest (or the game start).
43. `off(event, handler)` added.
44. Exit tears everything down: all DOM listeners (826 in a SNES session), timers, gamepad polling and the resize observer.
45. Only the ROM download renames `config.gameUrl`; a BIOS or patch passed as data used to overwrite it.
46. `getBaseFileName` and `saveInBrowserSupported` handle a `File` ROM (they threw on `.startsWith`).
47. Core options: configured defaults are always written, saved values override by exact key (a saved `foo_bar` used to hide
    the default for `foo`), and empty values are quoted.
48. RetroArch config values are stripped of quotes and line breaks so a value cannot break or inject config lines.
49. Multi-disc playlists sort naturally ("Disc 2" before "Disc 10") and no longer require names that start with a digit.
50. Routine logs only appear in debug mode (core download, extraction choices, repeated gameId warning).

Also fixed in the launcher: a file picked in the first seconds of a first visit could be lost to the one-time
service-worker reload; it now waits for setup, and that reload never happens under a running game.

# 4.3.0-local.2: 50 enhancements

New `data/src/enhancements.js` (engine) and a rebuilt launcher (`index.html`, `assets/*.js`).
Turn the engine layer off with `window.EJS_disableEnhancements = true` (config `disableEnhancements`).

In game: hotkeys and controls
1. Hotkey layer on F-keys: ignored while typing, remapping or in menus, and never sent to the game.
2. F1 panel: hotkey list, play time, used save slots and on/off switches for the options below (remembered).
3. F2 quick save to the current slot.
4. F3 / Shift+F3 next / previous slot, showing whether it is used or empty.
5. F4 quick load, with a clear "slot is empty" message instead of a silent no-op.
6. Shift+F4 undo the last load (or reset / resume).
7. F5 pause / resume.
8. Shift+F5 reset game (undoable).
9. F6 fast forward on / off.
10. F7 slow motion on / off.
11. F8 screenshot download.
12. F9 mute / unmute.
13. F10 FPS counter overlay.
14. F11 fullscreen.
15. Controller hotkeys while holding Select: R1 save, L1 load, R2 fast forward, L2 next slot, Start pause.
    The combo button is not passed to the game.
16. Controller rumble on save and load (when supported).

Saves
17. Quick-save slots are kept in IndexedDB and restored next time (they were lost on reload).
18. A resume point is saved when the tab is hidden, the page closes or the game exits.
19. On start, a prompt offers to resume from that point.
20. In-game (SRAM) saves are flushed every 30 s by default, unless an interval is configured.
21. Persistent storage is requested so the browser does not evict saves.
22. Save states work with the supplied 4.2-era cores: `getState` falls back to `save_state_info` when the
    core has no `EmulatorJSGetState` (previously every save state failed with these cores).

In game: session
23. Pause when the tab is hidden; resume when it comes back.
24. Pause when a controller disconnects.
25. Screen Wake Lock while playing.
26. Media Session: game title and play / pause from system media controls.
27. Tab title shows the game name.
28. Mouse cursor hides after 2.5 s idle.
29. Optional CRT scanline overlay.
30. Play time per game (shown in F1 panel and the recent games list).
31. Low battery (15 %, not charging): resume point saved and a warning shown.
32. Portrait-phone hint to rotate for a bigger picture.
33. WebGL context loss: message with a reload button instead of a frozen canvas.
34. "Back to menu" button when a game fails to start.

Engine: downloads and storage
35. Transient download failures are retried twice with backoff; 404s fail immediately.
36. Stalled downloads time out after 30 s without data (before, only the headers had a timeout).
37. Items are not cached when the storage quota cannot hold them.
38. IndexedDB opens at the existing version and reconnects after a close, so restored or upgraded databases stay readable.
39. The service worker also precaches the decompression workers and launcher modules.

Launcher
40. Recent games: ROMs are kept in IndexedDB for one-click play (12 most recent, up to 512 MB each).
41. Remove a game from the list; entries whose data is gone are cleaned up.
42. Each entry shows system, last played and play time.
43. Header detection for ambiguous files (.bin/.iso/.cue …): NES/FDS, N64, GB, GBA, NDS, Genesis, 32X,
    Master System, Game Gear, Lynx, Atari 7800, Sega CD, Saturn, 3DO, PlayStation and PSP.
44. Zip detection from the file names inside (no extraction), e.g. a zip containing a .nes runs as NES.
45. IPS / BPS / UPS patches applied on load (drop with the ROM, or choose in Options).
46. Multi-file drop: ROM, BIOS and patch are sorted out automatically.
47. Options are remembered; the system picker can remember a choice per extension and can be cancelled.
48. Installable as an app (web manifest) and warnings when WebAssembly, WebGL or https are missing.
49. "New version available" banner, plus storage usage and a "Clear download cache" button.
50. Export / import of all saves, save states and settings as one backup file.

# 4.3.0-local

Local-only build of 4.3.0-pre for static hosting. Behaviour is unchanged unless listed here.

1. No CDN use: the CDN core fallback, the update check and the "download minified files" hints are gone.
2. Cores load from `data/cores/<core>[-thread][-legacy]-wasm.7z` exactly as built (no renaming to `.data`).
3. The per-core `reports/*.json` request is gone. The reports are not part of the supplied cores, so it returned
   404 on every launch, and the random fallback version it then used meant the cached core was never found:
   the core was downloaded and unpacked again each time.
4. `data/cores/manifest.json` (generated by `tools/generate-core-manifest.mjs`) lists the cores that exist, their
   extensions and WebGL2 defaults. Variant selection falls back across thread/legacy builds that are present.
5. `loader.js` imports `emulator.js` directly instead of probing for a `.min` file, and fetches script, styles,
   language pack and manifest in parallel.
6. Netplay, socket.io and the license text are loaded on first use (about 170 kB less at startup).
7. IndexedDB: one shared connection per database instead of opening a new, never-closed connection for every call.
8. IndexedDB: `getAll`/`getKeys` use a single cursor, and the racy `?EJS_KEYS!` read-modify-write index is no
   longer maintained.
9. Cache keys use a word-wise 32-bit hash (about 22 ms for 10 MB) instead of a per-byte loop.
10. Cache `put` checks for an existing entry without loading its blobs; `get` no longer waits on the access-time write.
11. Downloads fill a pre-sized buffer (no chunk list + Blob + copy) and report progress once per percent.
12. `sw.js` caches the app and recently used cores for fast repeat visits and offline use.
13. `sw.js` adds COOP/COEP headers so threaded cores work on GitHub Pages.
14. Gamepad polling follows display frames while a pad is connected and idles at 2 Hz otherwise (was a 100 Hz timer
    with per-poll allocations).
15. Core script and wasm blob URLs are created once and released; `locateFile` no longer leaks a URL per call.
16. Decompression worker scripts are fetched once and reused, workers are terminated when done, and worker errors
    now surface instead of hanging.
17. ROM, BIOS, save state, parent and patch downloads run in parallel.
18. Window resize is throttled to one run per frame; fullscreen changes now actually re-run the resize handler
    (the old code only called `.bind`).
19. Settings are written to `localStorage` after a short debounce and when the page is hidden.
20. `getCores()` no longer mutates the shared table (on iOS Safari it reversed the N64 core order on every call).

Also: new `index.html` (system picker limited to available cores, whole-page drag and drop, exit returns to the
menu), cache manager no longer throws when the cache is disabled, `.gitignore` no longer excludes `data/cores`,
and upstream CI/dev-container/packaging files were removed.

# 4.3.0-pre

**This is a PRE RELEASE. It is not marked as stable for a reason. Running this in a prod environment where stability is needed is not advised.** Many, many things have changed. Cores are not inter-changable between versions

Many subsystems were completely redone in this release. Things may break. Please report them so I can yell at other maintainers

One thing I really like about this update is PPSSPP is significantly more playable (as in, it is. Runs even at 10x fastforward on my pc)

- Redo method used to read save states from the backend (may be slower but significantly less error-prone)
- Throw network errors instead of supressing them
- Add genesis_plus_gx_wide core
- Add bsnes core
- Add freeintv core
- Add azahar core
- Redo start game detection
- Move to ES6 modules
- Disable async for most cores
- Move to rwebaudio driver
- Fix hardware rendering for PPSSPP core
- Finish DOS support with a batch bootup file (this can be disabled)
- Update af-FR translation (Thanks to [@t3chnob0y](https://github.com/t3chnob0y))
- Fix custom broken buttons (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Redo language support (Thanks to [@allancoding](https://github.com/allancoding))
- Update ko translation (Thanks to [@UzuCore](https://github.com/UzuCore))
- Fix context menu visibility options (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Update ja translation (Thanks to someone who seems to have deleted their account)
- Fix `EJS_dontExtractBIOS` if the bios url has a "/" in its path (Thanks to [@daguile](https://github.com/daguile))
- Add jsdoc comments to compression.js (Thanks to [@gantoine](https://github.com/gantoine))
- Improve multi-disc handling for dosbox-pure (Thanks to [@daguile](https://github.com/daguile))
- Added netplay over WebRTC (Thanks to [@S-Coding23](https://github.com/S-Coding23))
- Fix screenshot return in EJS_onSaveState (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Fix bug in loadExternalFilesFixed function (Thanks to [@lxyongit](https://github.com/lxyongit))
- Redo the SVG logos (Thanks to [@milktoastrat](https://github.com/milktoastrat))
- Add event for when game save is updated (Thanks to [@cryptonaus](https://github.com/cryptonaus))
- Support a fixed save flushing interval (Thanks to [@cryptonaus](https://github.com/cryptonaus))
- Update ja translation (Thanks to [@paln21](https://github.com/paln21))
- Refactor cache system (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Refactor decompression system (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Refactor download system (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Improve UI in development index.html (Thanks to [@298A-E9E3](https://github.com/298A-E9E3))
- Ability to disable beforeUnload event listener (Thanks to [@duanyu5871](https://github.com/duanyu5871))
- Fix PSX labels (Thanks to [@joethun](https://github.com/joethun))
- Fix save state text (Thanks to [@joethun](https://github.com/joethun))
- Add support for dynamic cheat codes (Thanks to [@S-Coding23](https://github.com/S-Coding23))
- Automatic core detection in the development index.html for Sega Mega Drive games (Thanks to [@298A-E9E3](https://github.com/298A-E9E3))
- Fix Sega Genesis control scheme (Thanks to [@mikhailv](https://github.com/mikhailv))
- Add auto fire interval (Thanks to [@zees-dev](https://github.com/zees-dev))
- Add Khmer localization (Thanks to [@Novsochetra](https://github.com/Novsochetra))
- Update Turkish Translation (Thanks to [@Notenlish](https://github.com/Notenlish))
- Add exit confirmation prompt and exit callback functionality (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Fix localization for Quick Save and Quick Load (Thanks to [@leonardoman9](https://github.com/leonardoman9))
- Add Ukrainian Translation (Thanks to [@MrSosige](https://github.com/MrSosige))

# 4.2.3

Bug fix release

- Redo image capture features (Thanks to [@allancoding](https://github.com/allancoding))
- Fix issue with invalid button names (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Fix issues with canvas size
- Update zh-CN translations (Thanks to [@incredibleIdea](https://github.com/incredibleIdea))

# 4.2.2 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/a796c4a3866652d1b6cb74a2b90e9552955c2b13)

- Prioritize gameName over gameUrl for the local storage identifier
- Fix CSS parsing when setting a background image (Thanks to [@kellenmace](https://github.com/kellenmace))
- Add `EJS_dontExtractBIOS` option (Thanks to [@pjft](https://github.com/pjft))
- Delete old screenshot file before saving a new one (Thanks to [@gantoine](https://github.com/gantoine))
- Add `saveSaveFiles` event for when save files are updated
- Add `saveDatabaseLoaded` event, for when the `/data/saves` directory has been mounted
- Add ability to set a system save interval
- Add the ability to hide settings from the settings menu with the `EJS_hideSettings` option
- Attempt to auto-detect system language and attempt to load that file.
- Add `EJS_disableAutoLang` option to disable auto language detection in `loader.js`
- Update Japanese translation file (Thanks to [@noel-forester](https://github.com/noel-forester))
- Add dropdown selection for gamepads
- Correct N64 virtual gamepad inputs
- Change path to `retroarch.cfg`
- Add `joystickInput` property for virtual gamepad buttons
- Removed `this.listeners`
- Update Korean translation file (Thanks to [@SooHyuck](https://github.com/SooHyuck))
- Redo touchscreen detection (Thanks to [@allancoding](https://github.com/allancoding))
- Redo toolbar visibility method (Thanks to [@allancoding](https://github.com/allancoding))
- Add `dosbox_pure` core (requires threading)
- Add toggle for direct keyboard input
- Redo scrolling in settings menu
- Redo about menu CSS
- Add setting to enable/disable mouse lock
- Properly handle failed save states
- Fix unknown axis events being discarded
- Write core settings file before loading the core (Some core settings are required to be loaded from here on startup)
- Add option to disable `alt` key when using direct keyboard input
- Cleanup famicom controls
- Fix setting gamepad axis to input values 16 to 23
- Rework internal method of getting user settings, add `this.getSettingValue` function
- Add Romanian translation file (Thanks to [@jurcaalexandrucristian](https://github.com/jurcaalexandrucristian))
- Fix build stack size when building cores
- Fix CHD support

# 4.2.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/13362ef0786990e93462f06505de772031cfc4c2)

This was a bug-fix only release.

- Core-fetch failsafe now fetches a pinned version (Thanks to [@gantoine](https://github.com/n-at))
- Fixes video rotation on the arcade core (Thanks to [@allancoding](https://github.com/allancoding))
- Updated French `af-FR` translation (Thanks to [@t3chnob0y](https://github.com/t3chnob0y))
- Fixes switching between cores.
- Change: Localstorage settings are now stored by game instead of by system.
- Fixed gamepad input for c-down.
- Fixed RetroArch always assuming save is `.srm`.
- Fixed EJS exit event
- Hide the "save/load save files" buttons if unsupported.
- Corrects the order of the core list.
- Corrects behaviour of the placement of bios/parent/patch files.
- Fixed rar decompression.
- Fixed picodrive core (`sega32x`)
- Fixed libretro-uae core (`amiga`)

# 4.2.0 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/8d42d53d4fdf0166f71eaa07529cadf93350b76e)

In my opinion, this is the most stable release we've had in a while. Many features added in this release were just side affects of fixing up some bugs.

- Let same_cdi core handle zipped bios file directly (Thanks to [@pastisme](https://github.com/pastisme))
- Fix audio sliders/mute button (Thanks to [@n-at](https://github.com/n-at))
- Add ability to rotate video (Thanks to [@allancoding](https://github.com/allancoding))
- Added persian `fa-AF` language (Thanks to [@iits-reza](https://github.com/iits-reza))
- Added more catches for a start-game error
- Fixed default webgl2 option
- Organized settings menu, by dividing entries into sub-menus
- Fixed the EmulatorJS exit button
- Added the ability to internally add configurable retroarch.cfg variables
- Fixed default settings being saved to localstorage
- Fixed in browser SRM saves (finally)
- Read save state from WebAssembly Memory
- Fixed an issue when loading PPSSPP assets
- Refactored the internal downloadFile function to be promised based instead of callback based
- Added checks if core requires threads or webgl2
- Added ability to switch between cores in the settings menu
- Added the ability to enable/disable threads if SharedArrayBuffer is defined
- Added a PSP controller scheme for the control settings menu
- Fixed the volume slider background height in firefox
- Added handling for lightgun devices
- Refactored the EmulatorJS `build-emulatorjs.sh` build script
- Added `ppsspp` core

# 4.1.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/4951a28de05e072acbe939f46147645a91664a07)

- Fixed 2xScaleHQ and 2xScaleHQ shaders (Thanks to [@n-at](https://github.com/n-at))
- Added Vietnamese (`vi-VN`) (Thanks to [@TimKieu](https://github.com/TimKieu))
- Disable CUE generation for the PUAE core (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Updated German translation (Thanks to [@jonas0b1011001](https://github.com/jonas0b1011001))
- Add missing calls to translate (Thanks to [@angelmarfil](https://github.com/angelmarfil))
- Added Turkish (`tr-TR`) (Thanks to [@iGoodie](https://github.com/iGoodie))
- Fixed Gamepad support for some older browsers (Thanks to [@ZhaoTonggang](https://github.com/ZhaoTonggang))
- Default to webgl1 on lower end cores.
- Added ability to switch between webgl1 and webgl2.
- Check core compatibility with EmulatorJS.
- Added core license to right-click menu.
- Removed usage of `replaceAll`.
- Added the ability to change settings on game start crash.
- Added `exit` button, to properly shutdown and save files.
- Fixed mouse on mobile devices.
- Modularized EmulatorJS.
- Fixed WHLoader hdf roms.
- Added support for `File` objects (Thanks to [@pastisme](https://github.com/pastisme)).

# 4.0.12 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/c3ba473d1afc278db136f8e1252d0456050d6047)

- Fix scroll bar css (Thanks to [@allancoding](https://github.com/allancoding))
- Flip the context menu instead of going off the page
- Add hooks for save files (Thanks to [@gantoine](https://github.com/gantoine))
- Add class for each virtual gamepad button
- Add `EJS_forceLegacyCores` option
- Add `EJS_noAutoFocus` (this is only for advanced developers, not likely an option you will use)
- Added supported Amiga file extensions (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Display the file name of the ROM/disk when using M3U lists (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Added vsync option
- Added advanced shader configuration support (Thanks to [@n-at](https://github.com/n-at))

# 4.0.11 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/cafd80d023afa9562c7054e89a4240f3381d64ff)

- Added the ability to disable localstorage using `EJS_disableLocalStorage`. (Thanks to [@n-at](https://github.com/n-at))
- Added the ability to trigger `EJS_emulator.displayMessage` with a duration. (Thanks to [@allancoding](https://github.com/allancoding))
- `EJS_emulator.gameManager.getState` now returns a Uint8Array instead of a promise.
- Fixed broken save states from the 4.0.10 release.

# 4.0.10 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/390605d2ab48db16c07c8fb4fc2815033af5c3a6)

- Fixed bug with duplicate control inputs.
- Fixed mobile settings menu positioning.
- Ability to load custom files into the wasm instance.
- Renamed the `mame2003` system to `mame`.
- Removed mame disclaimers on `mame2003` core.
- Added VICE cores for C64, C128, VIC20, Plus/4, and PET (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Added a padding between popup body and buttons.
- Added ability to disabled cached databases.
- Fixed screenshot for some cores.
- Fixed game element not being focused after fullscreening.
- Added missing Famicom controls.
- Fixed volume slider shadow. (Thanks to [@allancoding](https://github.com/allancoding))

# 4.0.9 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/ddb5c6092f12a63a46d74ea67e6469726665ebc2)

- Repository history rewrite - expect faster cloning times.
- Prevent Vice64 from creating cue files (Thanks to [@michael-j-green](https://github.com/michael-j-green))
- Chinese translation updated (Thanks to [@oyepriyansh](https://github.com/oyepriyansh))
- Added button to open context menu (Thanks to [@andrigamerita](https://github.com/andrigamerita))
- Fixed menu bar text placement for items on the right.
- Fixed a bug in safari where fullscreen would not resize the game element.
- Fixed a bug in safari where the bottom menu would be visible on initial page load.
- Fixed game rom filename showing as "game" when the game name is set.
- Added legacy nintendo 64 cores for browsers that don't support webgl2.

# 4.0.8 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/f579eb4c080f612723fd6a119b02173cafb37503)

- Fixed typo in virtual gamepad dpad.
- Added updated desmume core.
- Fixed key mapping (Thanks to [@allancoding](https://github.com/allancoding))
- Fixed adblock message (Thanks to [@allancoding](https://github.com/allancoding))
- Added `EJS_startButtonName` option.
- Re-Added ability to drag and drop save states.
- Fixed cheats menu.
- Added popup message for Safari mobile users if game is not running.
- Added `EJS_softLoad` option.
- Added amiga core.
- Added c64 core.

# 4.0.7 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/f579eb4c080f612723fd6a119b02173cafb37503)

- Added rewind (Thanks to [@n-at](https://github.com/n-at))
- Added slowdown (Thanks to [@n-at](https://github.com/n-at))
- Fixed "zone" object in front of settings menu.
- Fixed virtual gamepad alignment.
- Add `EJS_fullscreenOnLoaded` option.
- Add virtual gamepad toggle to the control menu (for touchscreen devices)
- Fix gamepad ID showing as "undefined".
- Added threaded cores.
- Added joystick translations (Thanks to [@allancoding](https://github.com/allancoding))
- Fixed fullscreen button tooltip (Thanks to [@allancoding](https://github.com/allancoding))
- Added TurboGrafx-16, SuperGrafx, PC Engine, neo geo pocket, WonderSwan, PC-FX, and ColecoVision support. (Thanks to [@n-at](https://github.com/n-at))
- Fixed cue file loading (Thanks to [@n-at](https://github.com/n-at))
- Fixed ability to hide volume slider (Thanks to [@n-at](https://github.com/n-at))
- Added new mame2003_plus core (now default mame2003 core)
- Use keycodes instead of labels (Thanks to [@allancoding](https://github.com/allancoding))

# 4.0.6 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/5e338e7a888480cea331f6d4656bc8986a7d6b28)

- Fixed n64 on iOS safari
- virtual gamepads for atari2600, atari7800, lynx, jaguar, vb, 3do (Thanks to [@n-at](https://github.com/n-at))
- control buttons for gba, vb, 3do, atari2600, atari7800, lynx, jaguar (Thanks to [@n-at](https://github.com/n-at))
- Added `EJS_controlScheme` (Thanks to [@n-at](https://github.com/n-at))
- Added Fast Forward

# 4.0.5 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/5307e6294ed9df5daabd6958b2b307bae01f59f1)

- Added `pcsx_rearmed` core
- Made `pcsx_rearmed` core the default `psx` core (better compatibility)
- Added `fbneo` core
- Made `fbneo` core the default `arcade` core (better compatibility)
- Added picodrive core (sega32x)
- Cleaned up documentation
- Fixed/updated rar de-compression
- Added segaMD, segaCD, sega32x button labels and virtual gamepad (Thanks to [@n-at](https://github.com/n-at))
- Added ability to use threads (pre compiled cores not yet available)
- Fixed reversed gamepad button events (down was up, up was down)
- Fixed Gamepad axis release not triggering
- Add ***highly beta*** psp core - see readme

# 4.0.4 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/41491a738cf92ef9cee7d53f323aa2ab9732c053)

- Fix cheats "x" button
- Optimize memory usage
- Added ability to set urls to blob/arraybuffer/uint8array if needed

# 4.0.3 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/5219ab51227bc0fb60cbc7b60e476b0145c932c9)

- Remove RetroArch messages
- Center video at top

# 4.0.2 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/06fe386e780bb55ef6baa4fbc6addd486bee747a)

- Add link to RetroArch License on about page
- Fix gamepad support for legacy browsers

# 4.0.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/efbb9dd462ee0e4f2120a6947af312e02fcf657c)

Complete application re-write. Everything changed. Although some changes to note are:

- Optimization for smaller screens.
- No more dead code.
- Fix Gamepad for firefox.
- Store srm in browser.
- Ability to import/export srm files.
- No more old cores

And much much more was changed...

# 3.1.5 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/f7fa5d41487a424233b40e903020455606d68fee)

- Fixed iOS bug for iPads
- Added netplay! (only working on old cores)

# 3.1.0 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/614f5cb55e2768199ba05b756b47d0ab7ab283fd)

- Added ability to drag and drop save states.
- Fixed some "update" and "cancel" and "close" button confustion
- Removed save state retroarch messages
- Beta netplay cleanup (not yet working)
- (Theoretically) fixed a bug that did not allow iOS devices to work

# 3.0.5 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/44c31371fb3c314cd8dea36ccbaad89fb3ab98e6)

- Fixed screen recording on devices that do not support getUserMedia api.
- Added C label buttons to nintendo 64 virtual gamepad.
- Fixed EJS_color bug.
- Savestates are pulled from the core itself, to always be correct.
- Several new cores. (a5200, beetle_vb, desmume2015, fbalpha2012_cps1, fbalpha2012_cps2, fceumm, gambatte, mame2003, mednafen_psx, mednafen_psx_hw, melonds, mgba, mupen64plus_next, nestopia, snes9x)
- D-pad for virtual gamepad.
- Updated translation files to include new menu options.
- Ability to add more than one zone object to virtual gamepads.
- Added ability to set custom menu options.
- Virtual gamepad left handed mode.
- Fixed Screen record svg.
- Updated svg icons.
- Cache "clear all" button.
- Cache button moved to menu bar.
- Added feature that will display the current downloaded size when the content length is not available.

# 2.3.9 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/088942083e44510f07133f2074a2d63a8af477cd)

- Fixed incorrect variable referencing when update bios download data callback.
- Fixed rom storage size limits.
- Fixed download percent not showing with some files.

# 2.3.8 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/5f176b963e4b2055983b82396378d1e3837a69c4)

- Remove broken shader.
- Add download percent message.
- Fixed UI "saving state" message not going away.

# 2.3.7 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/8b9607becfe0aaad42b8b8486c7d379821b72125)

- Add more shaders.
- Add bold fontsize option to custom virtual gamepad settings.
- No longer set "normalOptions" from localization file.

# 2.3.6 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/b2919bc2c3d2d4c9fe3ab4f4486790a376b7acfe)

- Remove default control mappings for gamepads.
- Upgraded invalid character regex to catch more characters.

# 2.3.5 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/a5a9916aba041e75ee73815376ed4fd2e22701bd)

- Use regex to detect and replace invalid characters in filename/gamename settings.

# 2.3.4 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/45d982b6362cfd29cb2eda9721066e03893ba0d8)

- Add new arcade core.
- Fix patch file game id set bug.

# 2.3.4 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/45d982b6362cfd29cb2eda9721066e03893ba0d8)

- Add new arcade core.

# 2.3.3 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/11bddd5a4277aa04f80b941f05cc024b3de58bfc)

- Make version in loader.js reasonable.
- Created function to return the game id to prevent unnecessary data stored.

# 2.3.2 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/e9e017435f2c41c6c2b127024cc88ac51bdf04d9)

- Fix reference error.
- Fix bug in custom virtual gamepad processor where if value is set to 0 it will see that as the value being missing.

# 2.3.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/0fd6d58e2011fa1a39bd2e11ba3d2f17773f0961)

- Use let instead of var.

# 2.3.0 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/2fd0f545285151524262cc799efef6d996d7c6c1)

- Added ability to customize virtual gamepad UI.
- Fixed bug where shader is not set on start.

# 2.2.9 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/018c39d4065b866487f8f18ca88c9488eab69a6d)

- Added feature to save save files to indexeddb every 5 minutes.

# 2.2.8 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/9860d662d02b56417044cca11937448041d9cf43)

- Re-write gamepad handler.

# 2.2.7 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/c03d18990b6536c1503bba2c640dbc13db982bb3)

- Removed un-needed FS proxy functions.

# 2.2.6 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/fd71b5dfc2bd44d8e1f0e7c6c7b3ee1a1127a696)

- Added fps counter.
- Fixed gba core aspect.

# 2.2.5 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/4b444ec23918149a6052807d778af82f79883c01)

- Added ability to set custom control mappings.
- Added ability to set custom default volume value.
- Fixed gamepad axis as button, gamepad varaible compared to incorrect value.
- Added ability to hide/show menu/context menu buttons.
- Added ability to set game url to other data types.

# 2.2.3 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/41eed05677b4927bd114613040bfe4572c92c4b4)

- Fixed rar unarchiving function reference.
- Updated rar header detection.
- Removed netplay.

# 2.2.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/19980deb12c3f0790176db6fc7b8b2de4069bf4e)

- Added core menu options for new cores.
- Added new mame2003 core.
- Added support for debug emscripten setting for new cores.

# 2.0.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/a72222c39a793c4ff470ebb2b71c04829fee4b5e)

- Control mapping for beta cores.
- Updated beta cores.
- Beta cores now the default option!
- Added a5200 core.
- Fixed save state for new n64 core.

# 1.2.2 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/8ab7bb3f49da373ed5d291c5f72039bbabf2fbc8)

- Moved virtual gamepad menu button to the top left as 3 lines.
- Added screen orientation lock.
- Added beta n64 core!

# 1.2.1 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/638658e6202fd39cb5c94bedcfa00ccdf8b25840)

- Updated beta core files.

# 1.1.6 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/fa153ba76791184d978f9fb8b69991b05b161bc8)

- Replaced axios module with custom script.
- Added pause/play for beta cores.
- Sepperated css into its own file.
- Renamed emu-min.js to emulator.min.js.

# 1.1.5 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/2767c635b8a6e05c57e054d2f9d01ae0c4ff6d47)

- Cleaned up fetch error function.
- Cleaned up virtual gamepad event listeners.
- Add code of conduct.

# 1.1.2 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/64731dd8219931155b4e698aa98dbf65c2120038)

- Fixed error where mame files were misnamed.
- Fixed bug where variable referenced was not defined in loader.js.
- Added .gitignore
- Added nodejs script to minify js files.
- Added audio to screen recording.
- Removed lots of dead code from emulator.js file.
- Update axios module.
- Added CORS error message
- Update nodejs buffer module.

# 1.1.0 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/715ded4ae23c2135bc9a8b9b7599f12c905393b3)

- Added minify feature.
- Added emulatorjs logo.
- Added beta nds and gb core.
- Fixed bug where when wasm was supported on the beta cores and not the old cores, a network error would appear if not using beta.
- Added volume setting and cheats to beta cores.

# 1.0 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/fde44b095bb89e299daaaa4c8d7deebc79019865)

- Official release of the beta cores.
- Ability to use beta cores in production.
- Ability to use the old emulatorjs netplay server.
- Set screen recording out file name to gamename if present.
- Set screenshot out file name to gamename if present.
- Fixed virtual gamepad bug where a function was referenced to as an array.

# 0.4.26 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/0709829a11266b6ab4bbbf3e61d6dd6d3c372133)

- Sepperated emulator.js file into 2 files.
- Added support for a custom netplay server.
- Fixed netplay room password input bug.
- Fixed bug on iOS where virtual gamepad zone was un-responsive.
- Added save state location feature.
- Added mame core setting.
- Added beta cores!
- Added localization.
- Re-wrote virtual gamepad code.
- Added EJS_terminate function.
- Exposed simulate_input function to window.
- Update webrtc adapter.

# 0.4.25 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/ef3200ef87bffe57241e05ae9646cc201142ec46)

- Moved load state on start from loader.js file to emulator.js file.
- Moved data path function from loader.js file to emulator.js file.
- Added ability to set custom path to data through `EJS_pathtodata` variable.
- Added support for custom paths.
- Expose the module and loader to window.
- Added `EJS_startOnLoaded` to start the emulator on load.
- Added quick save state slots.
- Added save state message.
- Only show save state slot in settings when save states are supported.
- Added ds pointer lock.
- Added menu button to virtual gamepad. Menu will only open when clicked on mobile.
- Created licenese
- Created official emulatorjs website.

# 0.4.24 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/73ff641616bcd10f088a004002183760832a1afc)

- Deobsfocuted emulator.js and loader.js files to the most of my extent.
- Added quick save/load hotkeys.
- Added ability to use gamepad axis as button.
- Fixed typo in controls title.
- Only show needed inputs per system in control settings.
- Re-write the loader.js file.
- Exposed some variables to window.
- Cleaned up context menu code.
- Cleaned up some syntax in emulator.js file.
- Declared `EJS_AdUrl` through loader.js file.
- Fixed bug where mapping an axis as a button didn't work.
- Added missing legacy n64 core.
- Updated n64 core.

# 0.4.23-07 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/83e148c82cbc8b4e835a808dcf84456975f82a7c)

- Removed not needed code.
- Added reset button to control settings.
- Added clear button to control settings.
- Added `EJS_AdUrl` option, the ability to add an ad to the emulator.
- Cleaned up some file fetching.
- Fixed RAR unarchiving.

# 0.4.23-05 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/018c787ccf6daca58c863d38fff61910f33f98ec)

- No longer cache games with the protocols of `file:`, and `chrome-extension:`.
- Changed default keymappings.
- Added screen recording button.

# 0.4.23-04 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/6464bbedc1cd58c023cd66656540fc174aedde8b)

- Added mame2003, snes2002, snes2005, snes2010, and vbanext cores.
- Added asmjs for all supported cores.

# 0.4.23-03 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/c883f267e1e56ed6b6472b891f78704c6e4b4c17)

- Start loader.js deobsfocuting.
- Deobsfocute extractzip.js.
- Added `EJS_gameName`, the ability to change the file name of save states.

# 0.4.23-02 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/5d97620b25a81e49c6ba313e586fb37a5ce66002)

- Start emulator.js deobsfocuting.

# 0.4.23-01 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/42a7e129cfded266b72539e8d1b5978d5e4119d8)

- Added support for loading "blob:" urls.
- Added support for loading state on game start.

# 0.4.23 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/5f5cf5cbba29cfd772d525a4c73a4bc5ea26654c)

- Added update available message.
- Fixed a bug where the 'x' from the ad iframe was still visible on game start.
- Added a2600 and mame cores.
- Remove visible 'x'
- Add rar extraction support.

# 0.4.19 [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/4fd22871663e5896bb5d0ce29a50ad508462387a)

- Added support for 32x, 3do, a7800, arcade, bluemsx, jaguar, lynx, ngp, pce, saturn, sega, segacd, and ws cores.

# Initial release [View Tree](https://github.com/EmulatorJS/EmulatorJS/tree/be2db16cba8bd85bf901cd89ca6de51414cea792)

- Support for unzipping zip files.
- Support for unzipping 7zip files.
- Support for vb, snes, psx, nes, nds, n64, gba, and gb systems. Only support for WASM.
