// Writes data/<FOLDER>/index.json for every platform in data/platforms.json.
// GitHub Pages cannot list folders, so the site reads these files to know which games exist.
//
//   node tools/generate-rom-index.mjs
//
// Re-run after adding or removing games (the GitHub workflow does it automatically on push).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const { platforms } = JSON.parse(fs.readFileSync(path.join(dataDir, "platforms.json"), "utf8"));
const ignored = /^(index\.json|readme(\.txt|\.md)?|\.gitkeep|\.ds_store|thumbs\.db|desktop\.ini)$/i;

let changed = 0;
for (const platform of platforms) {
    const dir = path.join(dataDir, platform.folder);
    fs.mkdirSync(dir, { recursive: true });
    const files = fs.readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && !entry.name.startsWith(".") && !ignored.test(entry.name))
        .map((entry) => ({ name: entry.name, size: fs.statSync(path.join(dir, entry.name)).size }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    const out = path.join(dir, "index.json");
    const text = JSON.stringify({ files }, null, 1) + "\n";
    const before = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
    if (before !== text) {
        fs.writeFileSync(out, text);
        changed++;
    }
    console.log(platform.folder.padEnd(6), files.length + " file(s)");
}
console.log(changed ? `Updated ${changed} index file(s).` : "Indexes already up to date.");
