// Recent games: metadata in localStorage, file bytes (ROM, BIOS, patch) in IndexedDB.
// The game page opens a game by its id, so files picked on the home page survive the page change.
const RECENT_KEY = "ejs-recent";
const PLAYTIME_KEY = "ejs-playtime";
const DB_NAME = "EJS-library";
const STORE = "roms";
const MAX_ENTRIES = 12;
const MAX_STORED_BYTES = 512 * 1024 * 1024;

let dbPromise = null;
function db() {
    if (!window.indexedDB) return Promise.resolve(null);
    if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => request.result.createObjectStore(STORE);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }
    return dbPromise;
}
async function tx(mode, run) {
    const database = await db();
    if (!database) return undefined;
    return new Promise((resolve) => {
        const transaction = database.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        transaction.oncomplete = () => resolve(request ? request.result : true);
        transaction.onerror = transaction.onabort = () => resolve(undefined);
    });
}
const putBlob = (key, blob) => tx("readwrite", (s) => s.put(blob, key));
const getBlob = (key) => tx("readonly", (s) => s.get(key));
async function deleteEntryData(id) {
    await tx("readwrite", (s) => {
        s.delete(id);
        s.delete(id + "#bios");
        return s.delete(id + "#patch");
    });
}

export function listRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { return []; }
}
function saveRecent(list) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
}
export function getEntry(id) {
    return listRecent().find((e) => e.id === id) || null;
}
export function playtimeFor(gameName) {
    try { return JSON.parse(localStorage.getItem(PLAYTIME_KEY) || "{}")[gameName] || 0; } catch (e) { return 0; }
}
export function idFor(rom, name) {
    return rom instanceof Blob ? "file|" + name + "|" + rom.size : "url|" + rom;
}

/**
 * Records a game and returns its id. Files (ROM, BIOS, patch) are stored so the game page and
 * later visits can open them. With keep=false only this game is kept (no recent list).
 */
export async function remember({ rom, name, system, core = null, bios, patch, keep = true }) {
    const isFile = rom instanceof Blob;
    const id = idFor(rom, name);
    let list = listRecent().filter((e) => e.id !== id);
    let stored = !isFile;
    if (isFile && rom.size <= MAX_STORED_BYTES) stored = (await putBlob(id, rom)) !== undefined;
    if (bios) await putBlob(id + "#bios", bios);
    else await tx("readwrite", (s) => s.delete(id + "#bios"));
    if (patch) await putBlob(id + "#patch", new File([patch], patch.name));
    else await tx("readwrite", (s) => s.delete(id + "#patch"));
    list.unshift({
        id, name, system, core,
        size: isFile ? rom.size : 0,
        url: isFile ? null : rom,
        stored,
        bios: bios ? bios.name : null,
        patch: patch ? patch.name : null,
        lastPlayed: Date.now()
    });
    const max = keep ? MAX_ENTRIES : 1;
    for (const old of list.slice(max)) await deleteEntryData(old.id);
    list = list.slice(0, max);
    saveRecent(list);
    return id;
}

export async function touch(id) {
    const list = listRecent();
    const entry = list.find((e) => e.id === id);
    if (!entry) return;
    entry.lastPlayed = Date.now();
    saveRecent([entry].concat(list.filter((e) => e !== entry)));
}

export async function forget(id) {
    saveRecent(listRecent().filter((e) => e.id !== id));
    await deleteEntryData(id);
}

/** The ROM (File or URL string) plus any stored BIOS and patch for an entry; rom is null if gone. */
export async function open(entry) {
    let rom = entry.url || null;
    if (!rom) {
        const blob = await getBlob(entry.id);
        rom = blob ? new File([blob], entry.name) : null;
    }
    const biosBlob = entry.bios ? await getBlob(entry.id + "#bios") : null;
    const patchBlob = entry.patch ? await getBlob(entry.id + "#patch") : null;
    return {
        rom,
        bios: biosBlob ? new File([biosBlob], entry.bios) : null,
        patch: patchBlob ? new File([patchBlob], entry.patch) : null
    };
}

/** A BIOS or patch picked on the home page, waiting for the next game opened from a link. */
export async function setPending(kind, file) {
    if (file) await putBlob("__pending#" + kind, new File([file], file.name));
    else await tx("readwrite", (s) => s.delete("__pending#" + kind));
}
export async function takePending() {
    const bios = await getBlob("__pending#bios");
    const patch = await getBlob("__pending#patch");
    if (bios || patch) {
        await tx("readwrite", (s) => {
            s.delete("__pending#bios");
            return s.delete("__pending#patch");
        });
    }
    return {
        bios: bios ? new File([bios], bios.name || "bios") : null,
        patch: patch ? new File([patch], patch.name || "patch.ips") : null
    };
}

export function timeAgo(time) {
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + " min ago";
    if (minutes < 1440) return Math.round(minutes / 60) + " h ago";
    return Math.round(minutes / 1440) + " days ago";
}
export function formatPlaytime(seconds) {
    if (seconds < 60) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h ? `${h} h ${m} min played` : `${m} min played`;
}
