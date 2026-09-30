// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
// Uploads the package to Microsoft Edge Add-ons and submits it for certification (Add-ons API v1.1).
//
// Required environment: EDGE_PRODUCT_ID, EDGE_CLIENT_ID, EDGE_API_KEY
// Optional: RELEASE_NOTES (shown to reviewers), DRY_RUN=true.
// Usage: node scripts/publish-edge.mjs [path/to/package.zip]
import fs from "node:fs";
import path from "node:path";
import { ROOT, readManifest, fail, sleep } from "./lib.mjs";

const env = process.env;
const API = (env.EDGE_API_BASE || "https://api.addons.microsoftedge.microsoft.com").replace(/\/$/, "");
const POLL_MS = Number(env.POLL_INTERVAL_MS || 10000);
const dryRun = /^(1|true|yes)$/i.test(env.DRY_RUN || "");

const version = readManifest().version;
const zip = process.argv[2] || path.join(ROOT, "dist", `ai-leak-guard-${version}.zip`);
if (!fs.existsSync(zip)) fail(`Package not found: ${zip}. Run "npm run build" first.`);

const missing = ["EDGE_PRODUCT_ID", "EDGE_CLIENT_ID", "EDGE_API_KEY"].filter(k => !env[k]);
if (missing.length) {
  console.log(`::warning::Edge Add-ons publishing skipped. Not configured: ${missing.join(", ")}`);
  process.exit(0);
}

const base = `${API}/v1/products/${env.EDGE_PRODUCT_ID}/submissions`;
const auth = { Authorization: `ApiKey ${env.EDGE_API_KEY}`, "X-ClientID": env.EDGE_CLIENT_ID };
const notes = (env.RELEASE_NOTES || `Version ${version}`).slice(0, 2000);

if (dryRun) {
  console.log(`[dry run] Would upload ${path.basename(zip)} (version ${version})`);
  console.log(`[dry run] POST ${base}/draft/package`);
  console.log(`[dry run] POST ${base} {"notes": ${JSON.stringify(notes)}}`);
  process.exit(0);
}

async function request(url, init, what) {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) fail(`${what} failed (HTTP ${res.status}): ${text.slice(0, 1000)}`);
  let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { res, body };
}
function operationId(res, what) {
  const loc = res.headers.get("location");
  if (!loc) fail(`${what}: no operation ID in the response`);
  return loc.replace(/\/$/, "").split("/").pop();
}
// Polls an operation. Returns "done", or "timeout" when it is still running after maxChecks.
async function waitFor(url, what, maxChecks) {
  for (let i = 0; i < maxChecks; i++) {
    await sleep(POLL_MS);
    const { body } = await request(url, { headers: auth }, `Checking ${what}`);
    const status = String(body.status || "");
    console.log(`${what}: ${status}`);
    if (/succe|complete/i.test(status)) return "done";
    if (/fail/i.test(status)) fail(`${what} failed: ${JSON.stringify(body.errors || body.message || body).slice(0, 1500)}`);
  }
  return "timeout";
}

console.log(`Uploading ${path.basename(zip)} (version ${version}) to Edge Add-ons...`);
const up = await request(`${base}/draft/package`, { method: "POST", headers: { ...auth, "Content-Type": "application/zip" }, body: fs.readFileSync(zip) }, "Upload");
const upOp = operationId(up.res, "Upload");
if ((await waitFor(`${base}/draft/package/operations/${upOp}`, "Upload", 30)) !== "done") fail("Upload still processing after 30 checks. Check Partner Center.");

console.log("Submitting for certification...");
const sub = await request(base, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ notes }) }, "Submission");
const subOp = operationId(sub.res, "Submission");
if ((await waitFor(`${base}/operations/${subOp}`, "Submission", 30)) === "timeout") {
  console.log("::warning::Submission accepted but still processing. Check its status in Partner Center.");
} else {
  console.log("Submitted for certification.");
}
