// Writes reference-docs/files.json: the list of Markdown documents the reference viewer (reference.html) may open,
// with each document's title (its first heading). GitHub Pages cannot list folders, so the viewer reads this file.
//
//   node tools/generate-reference-index.mjs
//
// Re-run after adding, renaming or removing documents (the GitHub workflow does it automatically on push).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "reference-docs");
const files = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name.endsWith(".md")) {
            const rel = path.relative(docsDir, full).split(path.sep).join("/");
            const text = fs.readFileSync(full, "utf8");
            const heading = (text.match(/^#\s+(.+)$/m) || [, rel])[1].replace(/`/g, "").trim();
            files.push({ path: rel, title: heading, size: fs.statSync(full).size });
        }
    }
})(docsDir);
// Numbered guides first (00-, 01-, 02-…), then everything by path
const rank = (p) => (/^\d\d-/.test(p) ? 0 : 1);
files.sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" }));
const out = path.join(docsDir, "files.json");
const text = JSON.stringify({ files }, null, 1) + "\n";
if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== text) {
    fs.writeFileSync(out, text);
    console.log(`Wrote reference-docs/files.json (${files.length} documents).`);
} else {
    console.log("Reference index already up to date.");
}
