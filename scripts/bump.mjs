// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
// Sets a new version in manifest.json and prints the commands that start a release.
// Usage: npm run bump -- 0.4.0
import fs from "node:fs";
import path from "node:path";
import { ROOT, readManifest, fail } from "./lib.mjs";

const next = process.argv[2];
if (!next || !/^\d+\.\d+\.\d+$/.test(next)) fail("Usage: npm run bump -- 1.2.3");
const m = readManifest();
const cmp = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
if (cmp(next, m.version) <= 0) fail(`New version ${next} must be higher than the current ${m.version}. The stores reject equal or lower versions.`);

const file = path.join(ROOT, "manifest.json");
fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/"version":\s*"[^"]+"/, `"version": "${next}"`));
console.log(`manifest.json: ${m.version} -> ${next}\n`);
console.log("Start the release with:");
console.log(`  git commit -am "Release ${next}"`);
console.log(`  git tag v${next}`);
console.log("  git push origin main --tags");
