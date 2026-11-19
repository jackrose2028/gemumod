// Service worker for static hosting (GitHub Pages).
// 1. Adds the COOP/COEP headers GitHub Pages cannot send, so threaded cores can use SharedArrayBuffer.
// 2. Caches the app and cores locally for fast repeat loads and offline use.
const VERSION = "ejs-local-17";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CORE_CACHE = `${VERSION}-cores`;
const MAX_CORES_CACHED = 12;

const SHELL_FILES = [
    "./",
    "index.html",
    "play.html",
    "links.html",
    "assets/mobile.js",
    "assets/early-view.js",
    "assets/touch-pad.js",
    "reference.html",
    "assets/reference.js",
    "assets/vendor/marked.esm.js",
    "assets/vendor/purify.es.mjs",
    "ENHANCEMENTS.txt",
    "data/platforms.json",
    "data/loader.js",
    "data/emulator.css",
    "data/src/emulator.js",
    "data/src/frontend.js",
    "data/src/cache.js",
    "data/src/storage.js",
    "data/src/compression.js",
    "data/src/GameManager.js",
    "data/src/gamepad.js",
    "data/src/setup.js",
    "data/src/consts.js",
    "data/src/utils.js",
    "data/src/shaders.js",
    "data/src/vendor/nipplejs.js",
    "data/src/enhancements.js",
    "data/src/performance.js",
    "data/src/depth25.js",
    "data/compression/extract7z.js",
    "data/compression/extractzip.js",
    "engines/EmulatorJSMod.js",
    "engines/NostalgistMod.js",
    "assets/nostalgist-player.js",
    "assets/app.js",
    "assets/play.js",
    "assets/common.js",
    "assets/folders.js",
    "assets/tooltips.js",
    "assets/detect.js",
    "assets/library.js",
    "assets/backup.js",
    "manifest.webmanifest",
    "assets/app.css",
    "docs/Logo-light.png",
    "docs/favicon.ico",
    "data/cores/manifest.json"
];

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(SHELL_CACHE);
        await Promise.all(SHELL_FILES.map((file) => cache.add(file).catch(() => {})));
        await self.skipWaiting();
    })());
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const keep = new Set([SHELL_CACHE, RUNTIME_CACHE, CORE_CACHE]);
        for (const name of await caches.keys()) {
            if (name.startsWith("ejs-local-") && !keep.has(name)) await caches.delete(name);
        }
        await self.clients.claim();
    })());
});

// Cross-origin isolation headers; same-origin only, so nothing external is affected.
function isolate(response) {
    if (!response || response.status === 0 || response.type === "opaque" || response.type === "opaqueredirect") return response;
    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(request, { cache: "no-cache" });
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch (e) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        throw e;
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    const refresh = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }).catch(() => null);
    return cached || (await refresh) || Response.error();
}

async function cacheFirstLimited(request) {
    const cache = await caches.open(CORE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        for (let i = 0; i < keys.length - MAX_CORES_CACHED; i++) {
            await cache.delete(keys[i]);
        }
    }
    return response;
}

// Site files the worker may keep; anything else (ROMs in the game folders) goes straight to the
// network, because EmulatorJS already keeps its own copy and a second one would double the storage.
const APP_FILE = /\.(html|js|mjs|css|json|webmanifest|png|ico|svg|txt|md|wasm)$/i;

async function handle(request) {
    const url = new URL(request.url);
    // Pages, game lists and folder listings must be fresh so new games show up
    if (request.mode === "navigate" || url.pathname.endsWith("/") || /\/(manifest|index|platforms|files)\.json$/.test(url.pathname)) {
        return networkFirst(request, SHELL_CACHE);
    }
    if (url.pathname.includes("/data/cores/") && url.pathname.endsWith(".7z")) {
        return cacheFirstLimited(request);
    }
    if (!APP_FILE.test(url.pathname)) {
        return fetch(request);
    }
    return staleWhileRevalidate(request, RUNTIME_CACHE);
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    // Range requests (media seeking) go straight to the network
    if (request.headers.has("range")) return;
    event.respondWith(handle(request).then(isolate));
});
