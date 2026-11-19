// Reference docs viewer: renders the Markdown files in reference-docs/ (listed in reference-docs/files.json)
// with a local copy of marked, sanitised with a local copy of DOMPurify. Nothing is loaded from outside the site.
//   reference.html?doc=assets/app.js.md            opens one document (default: 00-PROJECT-OVERVIEW.md)
//   reference.html?doc=01-INDEX.md#data           and jumps to a heading
import { marked } from "./vendor/marked.esm.js";
import DOMPurify from "./vendor/purify.es.mjs";
import { initDevice } from "./mobile.js";

initDevice();

const BASE = "reference-docs/";
const DEFAULT_DOC = "00-PROJECT-OVERVIEW.md";
const $ = (id) => document.getElementById(id);
let files = [];
let current = null;

const slug = (text) => text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

/** Resolves a link inside a document (relative to that document) to a path inside reference-docs/, or null. */
function resolveDocLink(href, fromDoc) {
    if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//") || href.startsWith("#")) return null;
    const [pathPart, hash] = href.split("#");
    if (!pathPart.endsWith(".md")) return null;
    const url = new URL(pathPart, new URL(fromDoc, "https://docs.invalid/"));
    if (url.origin !== "https://docs.invalid") return null;
    const path = decodeURIComponent(url.pathname.slice(1));
    return { path, hash: hash || "" };
}
const viewerUrl = (path, hash) => "reference.html?doc=" + encodeURIComponent(path) + (hash ? "#" + hash : "");

function renderList(filter) {
    const list = $("refList");
    list.textContent = "";
    const words = filter.toLowerCase().split(/\s+/).filter(Boolean);
    const shown = files.filter((f) => words.every((w) => (f.path + " " + f.title).toLowerCase().includes(w)));
    let group = null;
    for (const file of shown) {
        const folder = /^\d\d-/.test(file.path) ? "Guides" : (file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "(project root)");
        if (folder !== group) {
            group = folder;
            const heading = document.createElement("li");
            heading.className = "group";
            heading.textContent = folder;
            list.appendChild(heading);
        }
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = viewerUrl(file.path);
        a.dataset.path = file.path;
        a.textContent = /^\d\d-/.test(file.path) ? file.title : file.path.split("/").pop().replace(/\.md$/, "");
        a.title = file.path;
        if (file.path === current) a.setAttribute("aria-current", "page");
        li.appendChild(a);
        list.appendChild(li);
    }
    $("refCount").textContent = shown.length === files.length ? `${files.length} documents` : `${shown.length} of ${files.length} documents`;
}

async function openDoc(path, hash, push) {
    if (!files.some((f) => f.path === path)) path = DEFAULT_DOC;
    const main = $("refDoc");
    if (path !== current) {
        main.innerHTML = "<p class=\"muted\">Loading…</p>";
        let text;
        try {
            const response = await fetch(BASE + path.split("/").map(encodeURIComponent).join("/"), { cache: "no-cache" });
            if (!response.ok) throw new Error("HTTP " + response.status);
            text = await response.text();
        } catch (e) {
            main.innerHTML = "";
            const p = document.createElement("p");
            p.textContent = `Could not open ${path} (${e.message}).`;
            main.appendChild(p);
            return;
        }
        main.innerHTML = DOMPurify.sanitize(marked.parse(text, { gfm: true }));
        // Headings get ids so links like 01-INDEX.md#data work
        const used = new Set();
        for (const h of main.querySelectorAll("h1, h2, h3, h4")) {
            let id = slug(h.textContent) || "section";
            while (used.has(id)) id += "-";
            used.add(id);
            h.id = id;
        }
        for (const a of main.querySelectorAll("a[href]")) {
            const target = resolveDocLink(a.getAttribute("href"), path);
            if (target) {
                a.href = viewerUrl(target.path, target.hash);
                a.dataset.path = target.path;
                a.dataset.hash = target.hash;
            } else if (/^(https?:)?\/\//i.test(a.getAttribute("href"))) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }
        }
        for (const table of main.querySelectorAll("table")) {
            const wrap = document.createElement("div");
            wrap.className = "table-wrap";
            table.replaceWith(wrap);
            wrap.appendChild(table);
        }
        current = path;
        const file = files.find((f) => f.path === path);
        document.title = (file ? file.title : path) + " – Reference docs";
        renderList($("refFilter").value);
    }
    if (push) history.pushState({ path, hash }, "", viewerUrl(path, hash));
    const anchor = hash && document.getElementById(hash);
    if (anchor) anchor.scrollIntoView();
    else window.scrollTo(0, 0);
    document.body.classList.remove("nav-open");
    $("toggleNav").setAttribute("aria-expanded", "false");
}

// Links between documents open in place (no page reload); modifier clicks still open new tabs
document.addEventListener("click", (event) => {
    const a = event.target.closest && event.target.closest("a[data-path]");
    if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openDoc(a.dataset.path, a.dataset.hash || "", true);
});
window.addEventListener("popstate", () => {
    const params = new URLSearchParams(location.search);
    openDoc(params.get("doc") || DEFAULT_DOC, location.hash.slice(1), false);
});
$("refFilter").addEventListener("input", () => renderList($("refFilter").value));
$("toggleNav").addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    $("toggleNav").setAttribute("aria-expanded", String(open));
    if (open) $("refFilter").focus();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== $("refFilter")) {
        event.preventDefault();
        document.body.classList.add("nav-open");
        $("refFilter").focus();
    }
});

(async () => {
    try {
        const response = await fetch(BASE + "files.json", { cache: "no-cache" });
        files = (await response.json()).files || [];
    } catch (e) {
        $("refDoc").textContent = "The reference docs list (reference-docs/files.json) could not be loaded.";
        return;
    }
    const params = new URLSearchParams(location.search);
    renderList("");
    await openDoc(params.get("doc") || DEFAULT_DOC, location.hash.slice(1), false);
})();
