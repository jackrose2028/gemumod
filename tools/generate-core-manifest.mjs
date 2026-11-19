// Builds data/cores/manifest.json from the .7z cores in data/cores (or a folder given as argv[2]).
// No dependencies: it runs the project's own 7z worker (data/compression/extract7z.js) inside a vm.
//
//   node tools/generate-core-manifest.mjs [coresDir]
//
// Run it again whenever cores are added, removed or updated.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const coresDir = path.resolve(process.argv[2] || path.join(root, "data", "cores"));
const outFile = path.join(root, "data", "cores", "manifest.json");
const workerSource = fs.readFileSync(path.join(root, "data", "compression", "extract7z.js"), "utf8");

function extractJson(bytes, wanted) {
    return new Promise((resolve, reject) => {
        const found = {};
        const sandbox = {
            console: { log() {}, warn() {}, error() {} },
            setTimeout, clearTimeout, performance,
            importScripts() {},
            close() {},
            postMessage(message) {
                if (message.t === 2 && wanted.includes(message.file)) {
                    found[message.file] = JSON.parse(Buffer.from(message.data).toString("utf8"));
                } else if (message.t === 1) {
                    resolve(found);
                }
            }
        };
        sandbox.self = sandbox;
        vm.createContext(sandbox);
        try {
            vm.runInContext(workerSource, sandbox, { filename: "extract7z.js" });
            sandbox.onmessage({ data: new Uint8Array(bytes) });
        } catch (e) {
            reject(e);
        }
    });
}

const variantPattern = /^(.+?)(-thread)?(-legacy)?-wasm\.7z$/;
const names = fs.readdirSync(coresDir).filter((f) => variantPattern.test(f)).sort();
if (!names.length) {
    console.error("No *-wasm.7z cores found in " + coresDir);
    process.exit(1);
}

const files = {};
const byCore = {};
for (const name of names) {
    files[name] = fs.statSync(path.join(coresDir, name)).size;
    const prefix = name.match(variantPattern)[1];
    (byCore[prefix] = byCore[prefix] || []).push(name);
}

const cores = {};
for (const prefix of Object.keys(byCore)) {
    // The plain build is the smallest to unpack; any variant carries the same core.json
    const pick = byCore[prefix].find((n) => n === prefix + "-wasm.7z") || byCore[prefix][0];
    const { "core.json": core } = await extractJson(fs.readFileSync(path.join(coresDir, pick)), ["core.json"]);
    if (!core) {
        console.warn("No core.json in " + pick);
        continue;
    }
    cores[prefix] = {
        name: core.name,
        extensions: core.extensions || [],
        defaultWebGL2: !!(core.options && core.options.defaultWebGL2),
        supportsMouse: !!(core.options && core.options.supportsMouse)
    };
    console.log(prefix.padEnd(20), (core.extensions || []).join(" "));
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
// No timestamp: the file only changes when the cores change (keeps automated commits quiet)
fs.writeFileSync(outFile, JSON.stringify({ files, cores }, null, 1) + "\n");
console.log(`\nWrote ${path.relative(root, outFile)}: ${names.length} archives, ${Object.keys(cores).length} cores`);
