// Game folders under data/ (A2600, GB, GBC, GG, NES, SNES, N64 …), described by data/platforms.json.
// GitHub Pages cannot list a folder, so each one carries an index.json (tools/generate-rom-index.mjs).
// A local server that lists folders (serve.py / start-windows.bat) is read directly, so new files
// appear without regenerating the index.
import { SYSTEMS, extensionOf } from "./detect.js";

const IGNORED = /^(index\.json|readme(\.txt|\.md)?|\.gitkeep|\.ds_store|thumbs\.db|desktop\.ini)$/i;
const ARCHIVES = ["zip", "7z"];

/** Whether a file in a platform folder is something the system can run: one of its ROM extensions or a zip/7z. */
export function isGameFile(name, system) {
    const ext = extensionOf(name);
    if (ARCHIVES.includes(ext)) return true;
    const entry = SYSTEMS.find(([id]) => id === system);
    // Unknown system: anything except obvious non-game files
    if (!entry || !entry[2].length) return !/^(txt|md|nfo|jpe?g|png|gif|webp|pdf|html?|json|srm|sav|state|ips|bps|ups)$/.test(ext);
    return entry[2].includes(ext);
}

export async function loadPlatforms() {
    try {
        const response = await fetch("data/platforms.json", { cache: "no-cache" });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.platforms) ? data.platforms : [];
    } catch (e) {
        return [];
    }
}

function parseListing(html, folder) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const files = [];
    for (const a of doc.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href");
        if (!href || href.startsWith("?") || href.startsWith("/") || href.startsWith("..") || href.endsWith("/") || /^[a-z]+:/i.test(href)) continue;
        let name;
        try { name = decodeURIComponent(href.split("?")[0]); } catch (e) { continue; }
        if (name.includes("/") || name.startsWith(".") || IGNORED.test(name)) continue;
        files.push({ name: name, size: 0 });
    }
    return files;
}

/** Files in one platform folder: live directory listing when the server offers one, else index.json. */
// Only local servers list folders; on GitHub Pages the probe would just log a 404 per folder
const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|.+\.local)$/i;

export async function listFolder(folder) {
    const base = "data/" + encodeURIComponent(folder) + "/";
    if (LOCAL_HOST.test(location.hostname)) try {
        const response = await fetch(base, { cache: "no-cache" });
        const type = response.headers.get("content-type") || "";
        if (response.ok && type.includes("text/html")) {
            const html = await response.text();
            if (/Directory listing for|Index of/i.test(html)) return sortFiles(parseListing(html, folder));
        }
    } catch (e) { /* no listing available */ }
    try {
        const response = await fetch(base + "index.json", { cache: "no-cache" });
        if (!response.ok) return [];
        const data = await response.json();
        return sortFiles((data.files || []).filter((f) => f && typeof f.name === "string" && !IGNORED.test(f.name)));
    } catch (e) {
        return [];
    }
}

function sortFiles(files) {
    return files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

/** Platforms whose cores are present, each with its file list. Folders are fetched in parallel. */
export async function loadFolders(isAvailable) {
    const platforms = (await loadPlatforms()).filter((p) => isAvailable(p.system));
    const lists = await Promise.all(platforms.map((p) => listFolder(p.folder)));
    // Only ROMs and zips count as games; readme files, cover art and saves dropped in a folder are skipped
    return platforms.map((p, i) => Object.assign({}, p, { files: lists[i].filter((f) => isGameFile(f.name, p.system)) }));
}

export function romUrl(folder, name) {
    return "data/" + encodeURIComponent(folder) + "/" + encodeURIComponent(name);
}

export function gameTitle(name) {
    return name.replace(/\.[^.]*$/, "").replace(/[_]+/g, " ");
}

export function playUrl(params) {
    const query = new URLSearchParams(params);
    const keep = new URLSearchParams(location.search);
    for (const k of ["debug", "lang", "threads", "engine"]) if (keep.has(k) && !query.has(k)) query.set(k, keep.get(k));
    return "play.html?" + query.toString();
}
