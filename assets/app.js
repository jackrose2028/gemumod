// Home page: game folders, drop zone, recent games and options. Games open on play.html.
import { SYSTEMS, PATCH_EXTENSIONS, extensionOf, labelFor, classifyFiles, detectSystem } from "./detect.js";
import * as library from "./library.js";
import { exportBackup, importBackup } from "./backup.js";
import { loadFolders, gameTitle, playUrl } from "./folders.js";
import { $, params, flag, OPTIONS_KEY, needsThreads, isAvailable, loadManifest, banner, setupServiceWorker, ENGINES, getEngine, setEngine, isEngineRemembered, needsEngineChoice, prefetchCore, readOptions, setDepth25, installedCores, preferredCore, setPreferredCore, coreNeedsThreads, coreSingleThread } from "./common.js";
import { initTooltips } from "./tooltips.js";
import { initDevice, applyView } from "./mobile.js";

let manifest = null;
let available = SYSTEMS;
let busy = false;
let ready = false;
let leaving = false;
let queued = null;
let waitingForEngine = null;

// ---------- cores ----------
function populateSystems() {
    available = SYSTEMS.filter(([id]) => isAvailable(id));
    const select = $("system");
    for (const [id, label] of available) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = label + (needsThreads(id) && !window.crossOriginIsolated ? " (needs threads)" : "");
        select.appendChild(option);
    }
    $("status").textContent = manifest
        ? `${available.length} systems ready (${Object.keys(manifest.cores).length} cores)`
        : "No core manifest found. Copy the *.7z cores into data/cores/ and run: node tools/generate-core-manifest.mjs";
}

// ---------- options ----------
function restoreOptions() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}"); } catch (e) { /* ignore */ }
    for (const input of document.querySelectorAll("[data-remember]")) {
        if (typeof saved[input.id] === "boolean") input.checked = saved[input.id];
        input.addEventListener("change", saveOptions);
    }
    if (saved.mode !== undefined) {
        const radio = document.querySelector(`input[name=mode][value="${saved.mode}"]`);
        if (radio) radio.checked = true;
    }
    for (const radio of document.querySelectorAll("input[name=mode]")) radio.addEventListener("change", () => {
        saveOptions();
        applyView(); // the layout follows Browser mode at once
    });
    if (params.has("debug")) $("debug").checked = flag("debug");
    if (params.has("threads")) $("threads").checked = flag("threads");
    if (flag("debug") || flag("threads")) $("advanced").open = true;
    saveOptions();
}
function saveOptions() {
    const options = {};
    for (const input of document.querySelectorAll("[data-remember]")) options[input.id] = input.checked;
    const mode = document.querySelector("input[name=mode]:checked");
    options.mode = mode ? mode.value : "";
    try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(options)); } catch (e) { /* ignore */ }
    $("recentSection").hidden = !options.library || library.listRecent().length === 0;
}

// ---------- system and core choice (asked before every game file is opened) ----------
// Older versions remembered one system per file type ("every .zip is arcade"), which sent zips of other consoles to
// the wrong core. Those mappings are cleared; the system now comes from the file's contents and the user confirms it.
try {
    for (const key of Object.keys(localStorage)) if (key.startsWith("ejs-system-")) localStorage.removeItem(key);
} catch (e) { /* storage blocked */ }

const CORE_NOTES = {
    fbneo: "FinalBurn Neo: current arcade core, most games",
    fbalpha2012_cps1: "FinalBurn Alpha 2012: Capcom CPS-1 arcade boards only",
    fbalpha2012_cps2: "FinalBurn Alpha 2012: Capcom CPS-2 arcade boards only",
    mame2003: "MAME 2003 (0.78 romsets)",
    mame2003_plus: "MAME 2003-Plus (0.78 romsets, more games)",
    mupen64plus_next: "Mupen64Plus-Next: best compatibility",
    parallel_n64: "ParaLLEl N64: alternative for games that fail in Mupen64Plus",
    fceumm: "FCEUmm: fast, very compatible",
    nestopia: "Nestopia: accurate",
    snes9x: "Snes9x: fast, very compatible",
    bsnes: "bsnes: accurate, needs a faster device",
    gambatte: "Gambatte: accurate Game Boy / Color",
    mgba: "mGBA: accurate, also runs Game Boy / Color",
    genesis_plus_gx: "Genesis Plus GX: Master System, Mega Drive, Game Gear, Sega CD",
    picodrive: "PicoDrive: fast, also 32X",
    stella2014: "Stella 2014: Atari 2600",
    pcsx_rearmed: "PCSX ReARMed: fast PlayStation",
    mednafen_psx_hw: "Beetle PSX HW: accurate PlayStation",
    ppsspp: "PPSSPP: PlayStation Portable (needs threads)",
    melonds: "melonDS: Nintendo DS",
    desmume2015: "DeSmuME 2015: Nintendo DS",
    desmume: "DeSmuME: Nintendo DS"
};

/**
 * Shows the Load game dialog: the detected system (or a request to pick one) and the core to run it with.
 * Resolves to { system, core } or null when cancelled.
 */
async function askSystemAndCore(file) {
    const dialog = $("loadDialog");
    const systemSelect = $("loadSystem");
    const coreSelect = $("loadCore");
    const forced = $("system").value;
    const { system: detected, reason } = await detectSystem(file, available);
    $("loadFile").textContent = file.name;
    const detectedLine = $("loadDetected");
    if (forced) {
        detectedLine.textContent = `System set to ${labelFor(forced)} in the options below.`;
        detectedLine.className = "small ok";
    } else if (detected) {
        detectedLine.textContent = `Detected: ${labelFor(detected)} (from ${reason}). Change it if that is wrong.`;
        detectedLine.className = "small ok";
    } else {
        detectedLine.textContent = "This file could be for several systems. Choose the one it is for.";
        detectedLine.className = "small warn";
    }
    systemSelect.textContent = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a system…";
    systemSelect.appendChild(placeholder);
    for (const [id, label] of available) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = label;
        systemSelect.appendChild(option);
    }
    systemSelect.value = forced || detected || "";
    const engineId = getEngine() || "emulatorjs";

    const fillCores = () => {
        const system = systemSelect.value;
        coreSelect.textContent = "";
        $("loadStart").disabled = !system;
        $("loadSystemName").textContent = system ? labelFor(system) + " game" : "game of this system";
        if (!system) {
            coreSelect.disabled = true;
            $("loadCoreNote").textContent = "";
            return;
        }
        const cores = installedCores(system);
        const preferred = preferredCore(system);
        cores.forEach((core, i) => {
            const option = document.createElement("option");
            option.value = core;
            const nostalgistOnlyThreads = engineId === "nostalgist" && !coreSingleThread(core);
            option.textContent = core + (i === 0 ? " (default)" : "") + (nostalgistOnlyThreads ? " (needs EmulatorJSMod)" : "");
            coreSelect.appendChild(option);
        });
        coreSelect.disabled = cores.length < 2;
        coreSelect.value = preferred && cores.includes(preferred) ? preferred : cores[0];
        $("loadRemember").checked = !!preferred;
        noteCore();
    };
    const noteCore = () => {
        const core = coreSelect.value;
        const note = CORE_NOTES[core] || "";
        const threads = core && coreNeedsThreads(core) ? (note ? " · " : "") + "needs threads" : "";
        $("loadCoreNote").textContent = note + threads;
    };
    systemSelect.onchange = fillCores;
    coreSelect.onchange = noteCore;
    fillCores();

    return new Promise((resolve) => {
        const finish = (value) => {
            dialog.removeEventListener("close", onClose);
            $("loadCancel").onclick = null;
            if (dialog.open) dialog.close();
            resolve(value);
        };
        const onClose = () => {
            if (dialog.returnValue === "start" && systemSelect.value) {
                const system = systemSelect.value;
                const core = coreSelect.value || null;
                // Remember (or forget) the core for this system
                if ($("loadRemember").checked) setPreferredCore(system, core);
                else if (preferredCore(system)) setPreferredCore(system, null);
                finish({ system, core });
            } else {
                finish(null);
            }
        };
        dialog.returnValue = "";
        dialog.addEventListener("close", onClose);
        $("loadCancel").onclick = () => { dialog.returnValue = ""; dialog.close(); };
        if (dialog.showModal) dialog.showModal();
        else dialog.setAttribute("open", "");
        (systemSelect.value ? $("loadStart") : systemSelect).focus();
    });
}

// ---------- start: store the files, then open the game page ----------
async function start(request) {
    if (!ready) {
        queued = request;
        $("status").textContent = "Getting ready…";
        return;
    }
    if (busy || leaving) return;
    if (!getEngine() && $("engineDialog").open) {
        waitingForEngine = request;
        return;
    }
    busy = true;
    try {
        const sorted = classifyFiles(request.files);
        if (!sorted.rom) {
            banner("Drop a ROM file (a patch or BIOS alone can't be played).", "warn");
            return;
        }
        const rom = sorted.rom;
        if (PATCH_EXTENSIONS.includes(extensionOf(rom.name))) {
            banner("That is a patch file. Drop it together with the ROM it belongs to.", "warn");
            return;
        }
        const bios = sorted.bios || $("bios").files[0] || null;
        const patch = sorted.patch || $("patch").files[0] || null;
        const choice = await askSystemAndCore(rom);
        if (!choice) return;
        const { system, core } = choice;
        if ((core ? coreNeedsThreads(core) : needsThreads(system)) && !window.SharedArrayBuffer) {
            banner(labelFor(system) + " needs threads, which this browser has not enabled yet. Reload the page once and try again.", "warn");
            return;
        }
        if (!getEngine()) setEngine("emulatorjs");
        const id = await library.remember({ rom, name: rom.name, system, core, bios, patch, keep: $("library").checked });
        leaving = true;
        location.href = playUrl({ id });
    } catch (e) {
        banner("Could not open that file: " + e.message, "error");
    } finally {
        busy = false;
    }
}

// ---------- engine choice ----------
function showEngine() {
    const id = getEngine();
    $("engineName").textContent = id ? ENGINES[id].name : "not chosen";
}
function openEngineChooser(required) {
    const dialog = $("engineDialog");
    const cards = $("engineCards");
    const current = getEngine();
    cards.textContent = "";
    $("rememberEngine").checked = isEngineRemembered();
    for (const engine of Object.values(ENGINES)) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "engine-card" + (engine.id === current ? " current" : "");
        const name = document.createElement("strong");
        name.textContent = engine.name + (engine.id === current ? " (current)" : "");
        const tagline = document.createElement("span");
        tagline.textContent = engine.tagline + ". " + engine.details;
        card.append(name, tagline);
        card.addEventListener("click", () => {
            setEngine(engine.id, $("rememberEngine").checked);
            dialog.close();
            showEngine();
            resumeAfterEngine();
            refreshFolders();
        });
        cards.appendChild(card);
    }
    // When the site opens without a choice, Escape picks the default instead of leaving it unset
    dialog.oncancel = required ? (event) => {
        event.preventDefault();
        setEngine("emulatorjs", $("rememberEngine").checked);
        dialog.close();
        showEngine();
        resumeAfterEngine();
    } : null;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else setEngine(current || "emulatorjs");
}

// A file dropped while the engine question is open waits for the answer
function resumeAfterEngine() {
    if (!waitingForEngine) return;
    const request = waitingForEngine;
    waitingForEngine = null;
    start(request);
}

// ---------- game folders ----------
let folderList = null;
/** Lists the folder games once the chosen engine and the core manifest are loaded, marking what that engine can't run. */
async function refreshFolders() {
    if (!folderList) return;
    const id = getEngine() || "emulatorjs";
    let supports = () => ({ ok: true });
    try {
        const engine = await ENGINES[id].load();
        if (engine.supports) supports = engine.supports;
    } catch (e) { /* engine failed to load; the game page reports it */ }
    renderFolders(folderList, supports, id);
}
function renderFolders(folders, supports = () => ({ ok: true }), engineId = "emulatorjs") {
    const host = $("folders");
    host.textContent = "";
    const total = folders.reduce((n, f) => n + f.files.length, 0);
    $("foldersSection").hidden = folders.length === 0;
    $("foldersSummary").textContent = total
        ? `${total} game${total === 1 ? "" : "s"} in ${folders.filter((f) => f.files.length).length} folder(s), ready for ${ENGINES[engineId].name}. `
        : "No games in the folders yet";
    if (total) {
        const open = document.createElement("a");
        open.href = playUrl({ engine: engineId });
        open.textContent = "Open the library in the player";
        $("foldersSummary").appendChild(open);
    }
    // Folders with games first; empty ones stay listed as a hint of where to put files
    const ordered = folders.filter((f) => f.files.length).concat(folders.filter((f) => !f.files.length));
    for (const folder of ordered) {
        const details = document.createElement("details");
        details.className = "platform";
        if (folder.files.length && folder.files.length <= 8) details.open = true;
        const summary = document.createElement("summary");
        summary.innerHTML = "<span></span><span class=\"count\"></span>";
        summary.firstChild.textContent = folder.label;
        const support = supports(folder.system);
        summary.lastChild.textContent = folder.files.length + (folder.files.length === 1 ? " game" : " games") + (support.ok ? "" : " · not on " + ENGINES[engineId].name);
        if (!support.ok) {
            details.classList.add("unsupported");
            summary.title = support.reason;
        }
        details.appendChild(summary);
        if (!folder.files.length) {
            const empty = document.createElement("p");
            empty.className = "muted small";
            empty.textContent = `Add ${folder.label} ROMs or zips to data/${folder.folder}/ to list them here.`;
            details.appendChild(empty);
        } else {
            const list = document.createElement("ul");
            list.className = "games";
            for (const file of folder.files) {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = playUrl({ folder: folder.folder, file: file.name });
                a.textContent = gameTitle(file.name);
                a.title = support.ok ? file.name : file.name + " (" + support.reason + ")";
                a.dataset.system = folder.system;
                li.appendChild(a);
                list.appendChild(li);
            }
            details.appendChild(list);
        }
        host.appendChild(details);
    }
}

// ---------- recent games ----------
function renderRecent() {
    const list = library.listRecent();
    $("recentSection").hidden = list.length === 0 || !$("library").checked;
    const ul = $("recent");
    ul.textContent = "";
    for (const entry of list) {
        const li = document.createElement("li");
        const info = document.createElement("div");
        info.className = "info";
        const title = document.createElement("div");
        title.className = "name";
        title.textContent = entry.name;
        title.title = entry.name;
        const sub = document.createElement("div");
        sub.className = "sub";
        const played = library.formatPlaytime(library.playtimeFor(entry.name.replace(/\.[^.]*$/, "")));
        const extras = [entry.patch && "patched", entry.bios && "BIOS"].filter(Boolean).join(", ");
        sub.textContent = [labelFor(entry.system), library.timeAgo(entry.lastPlayed), played, extras].filter(Boolean).join(" · ");
        info.append(title, sub);

        const play = document.createElement("a");
        play.className = "button play";
        play.textContent = "Play";
        play.href = playUrl({ id: entry.id });
        play.dataset.system = entry.system;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove";
        remove.textContent = "✕";
        remove.title = "Remove from recent games";
        remove.setAttribute("aria-label", "Remove " + entry.name);
        remove.addEventListener("click", async () => {
            await library.forget(entry.id);
            renderRecent();
        });
        li.append(info, play, remove);
        ul.appendChild(li);
    }
}

// ---------- storage, backup ----------
const mb = (bytes) => (bytes / 1048576).toFixed(bytes > 10485760 ? 0 : 1) + " MB";
async function showStorage() {
    if (!navigator.storage || !navigator.storage.estimate) {
        $("storageInfo").textContent = "Storage: unknown";
        return;
    }
    const { usage, quota } = await navigator.storage.estimate();
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
    $("storageInfo").textContent = `Storage: ${mb(usage || 0)} of ${mb(quota || 0)}${persisted ? " (protected)" : ""}`;
}
async function clearCache() {
    if (!confirm("Remove downloaded cores and cached games? Saves, save states and recent games are kept.")) return;
    if (window.caches) {
        for (const name of await caches.keys()) if (name.startsWith("ejs-local-")) await caches.delete(name);
    }
    await new Promise((resolve) => {
        const request = indexedDB.deleteDatabase("EmulatorJS-Cache");
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
    });
    banner("Download cache cleared.");
    showStorage();
}
async function doExport() {
    try {
        const { blob, records } = await exportBackup();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "emulatorjs-saves-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        banner(`Backup exported (${records} saved items).`);
    } catch (e) {
        banner("Export failed: " + e.message, "error");
    }
}
async function doImport(file) {
    try {
        const records = await importBackup(file);
        banner(`Backup restored (${records} saved items).`);
        showStorage();
    } catch (e) {
        banner("Import failed: " + e.message, "error");
    }
}

// ---------- environment ----------
function checkCapabilities() {
    if (typeof WebAssembly !== "object") {
        banner("This browser cannot run the emulator (WebAssembly is unavailable).", "error", []);
        return false;
    }
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
        banner("WebGL is unavailable. Most systems will fail to start; check that hardware acceleration is on.", "warn");
    } else {
        const lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
    }
    if (!window.isSecureContext) {
        banner("Open this page over https or localhost to enable offline play, threads and install.", "warn");
    }
    return true;
}

function describeThreads(state) {
    const note = $("threadsNote");
    if (state === "isolated" || window.crossOriginIsolated) {
        note.textContent = "available";
        return;
    }
    $("threads").disabled = true;
    note.textContent = state === "unavailable" ? "needs https or localhost" : "not available in this browser yet";
}

function wireInputs() {
    $("rom").addEventListener("change", (event) => {
        const files = Array.from(event.target.files);
        event.target.value = "";
        if (files.length) start({ files });
    });
    $("drop").addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            $("rom").click();
        }
    });
    const drop = $("drop");
    for (const type of ["dragenter", "dragover"]) {
        window.addEventListener(type, (event) => {
            event.preventDefault();
            drop.classList.add("over");
        });
    }
    window.addEventListener("dragleave", (event) => {
        if (!event.relatedTarget) drop.classList.remove("over");
    });
    window.addEventListener("drop", (event) => {
        event.preventDefault();
        drop.classList.remove("over");
        const files = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
        if (files.length) start({ files });
    });
    $("exportSaves").addEventListener("click", doExport);
    $("importSaves").addEventListener("change", (event) => {
        const file = event.target.files[0];
        event.target.value = "";
        if (file) doImport(file);
    });
    $("clearCache").addEventListener("click", clearCache);
    $("advanced").addEventListener("toggle", () => $("advanced").open && showStorage());
    $("library").addEventListener("change", renderRecent);
    // Kept for the next game, including one opened from the game library links
    $("bios").addEventListener("change", () => library.setPending("bios", $("bios").files[0] || null));
    $("patch").addEventListener("change", () => library.setPending("patch", $("patch").files[0] || null));
}

async function main() {
    // Old links: index.html?rom=game.nes (from roms/) open on the game page
    if (params.get("rom")) {
        const query = { url: "roms/" + params.get("rom").replace(/^\/+/, "") };
        if (params.get("core")) query.core = params.get("core");
        location.replace(playUrl(query));
        return;
    }
    initDevice();
    initTooltips();
    // 2.5D button: NES and SNES games open in 2.5D while it is on (remembered)
    const showDepth25 = () => {
        const on = readOptions().depth25;
        $("depth25Btn").setAttribute("aria-pressed", String(on));
        $("depth25Btn").querySelector(".depth25-state").textContent = on ? "On" : "Off";
    };
    $("depth25Btn").addEventListener("click", () => {
        setDepth25(!readOptions().depth25);
        showDepth25();
    });
    showDepth25();
    // Phone view: quick actions along the bottom
    $("tabOpen").addEventListener("click", () => $("rom").click());
    $("tabRecent").addEventListener("click", () => {
        const target = !$("recentSection").hidden ? $("recentSection") : $("foldersSection");
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    wireInputs();
    showEngine();
    $("changeEngine").addEventListener("click", () => openEngineChooser(false));
    if (needsEngineChoice()) openEngineChooser(true);
    restoreOptions();
    if (!checkCapabilities()) return;
    const [loaded, swState] = await Promise.all([
        loadManifest(),
        setupServiceWorker({
            shouldReload: () => !leaving,
            onUpdate: () => banner("A new version is available.", "", [["Reload", () => location.reload()], ["Later", null]])
        })
    ]);
    if (swState === "reloading") return;
    manifest = loaded;
    describeThreads(swState);
    populateSystems();
    renderRecent();
    ready = true;
    if (queued) {
        const request = queued;
        queued = null;
        start(request);
    }
    // Game folders are listed once the engine and cores are known, so only playable platforms appear
    folderList = await loadFolders(isAvailable);
    await refreshFolders();
    // Pointing at a game starts downloading its core, so it is ready by the time the game page opens
    const warm = (event) => {
        const link = event.target.closest && event.target.closest("a[data-system]");
        if (link) prefetchCore(link.dataset.system);
    };
    $("folders").addEventListener("pointerover", warm);
    $("folders").addEventListener("focusin", warm);
    $("recent").addEventListener("pointerover", warm);
}

main();
