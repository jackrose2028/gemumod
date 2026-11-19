// Builds engines/NostalgistMod.js from this modified Nostalgist source.
//   node tools/nostalgist-mod/build.mjs
// Needs esbuild (npm i -D esbuild) and the "ini" package.
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../engines/NostalgistMod.js");
const license = fs.readFileSync(path.join(here, "LICENSE.txt"), "utf8");
await build({
    entryPoints: [path.join(here, "src/entries/esm.ts")],
    bundle: true,
    format: "esm",
    target: "es2022",
    outfile: out,
    legalComments: "none",
    nodePaths: process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [],
    banner: { js: "/*!\n * NostalgistMod: Nostalgist.js adapted to run this site's local EmulatorJS cores (no CDN).\n * Based on Nostalgist.js by arianrhodsandlot, https://github.com/arianrhodsandlot/nostalgist\n *\n" + license.split("\n").map((l) => " * " + l).join("\n") + "\n */" }
});
console.log("Wrote", path.relative(process.cwd(), out));
