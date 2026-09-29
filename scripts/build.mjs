// Packages the extension into dist/ai-leak-guard-<version>.zip after sanity checks.
import fs from "node:fs";
import path from "node:path";
import { ROOT, listFiles, readManifest, writeZip, setOutput, fail } from "./lib.mjs";

const manifest = readManifest();
const version = manifest.version;
if (!/^\d+(\.\d+){0,3}$/.test(version)) fail(`manifest.json version "${version}" is not a valid extension version`);

const files = listFiles();
const problems = [];

// Store descriptions must be 132 characters or less.
for (const f of files.filter(f => /^_locales\/[^/]+\/messages\.json$/.test(f))) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
  const desc = m.extDesc && m.extDesc.message;
  if (!desc) problems.push(`${f}: missing extDesc`);
  else if (desc.length > 132) problems.push(`${f}: description is ${desc.length} characters (max 132)`);
}
// Files referenced by the manifest must exist.
const referenced = [
  ...Object.values(manifest.icons || {}),
  ...Object.values((manifest.action && manifest.action.default_icon) || {}),
  manifest.action && manifest.action.default_popup,
  manifest.options_page,
  manifest.storage && manifest.storage.managed_schema,
  ...(manifest.content_scripts || []).flatMap(c => c.js || [])
].filter(Boolean);
for (const r of referenced) if (!files.includes(r)) problems.push(`manifest references missing file ${r}`);
// Test-only changes must never ship.
const content = fs.readFileSync(path.join(ROOT, "src/content.js"), "utf8");
if (!content.includes('mode: "closed"')) problems.push("src/content.js: warning dialog must use a closed shadow root");
if (JSON.stringify(manifest).includes("localhost")) problems.push("manifest.json contains a localhost match (test-only)");

if (problems.length) fail("Build checks failed:\n - " + problems.join("\n - "));

const zipPath = path.join(ROOT, "dist", `ai-leak-guard-${version}.zip`);
writeZip(zipPath, files.map(name => ({ name, data: fs.readFileSync(path.join(ROOT, name)) })));
const kb = (fs.statSync(zipPath).size / 1024).toFixed(1);
console.log(`Built ${path.relative(ROOT, zipPath)} (${files.length} files, ${kb} KB)`);
setOutput("zip", path.relative(ROOT, zipPath).split(path.sep).join("/"));
setOutput("version", version);
