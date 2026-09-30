// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
// Uploads the package to the Chrome Web Store and submits it for review (Chrome Web Store API v2).
//
// Required environment:
//   CWS_PUBLISHER_ID, CWS_EXTENSION_ID
//   and either CWS_ACCESS_TOKEN (e.g. from Workload Identity Federation)
//   or CWS_CLIENT_ID + CWS_CLIENT_SECRET + CWS_REFRESH_TOKEN (OAuth refresh token).
// Optional: CWS_STAGED=true (publish only after you click Publish in the dashboard),
//           CWS_DEPLOY_PERCENTAGE=10 (staged rollout), DRY_RUN=true.
// Usage: node scripts/publish-chrome.mjs [path/to/package.zip]
import fs from "node:fs";
import path from "node:path";
import { ROOT, readManifest, fail, sleep } from "./lib.mjs";

const env = process.env;
const API = (env.CWS_API_BASE || "https://chromewebstore.googleapis.com").replace(/\/$/, "");
const TOKEN_URL = env.CWS_TOKEN_URL || "https://oauth2.googleapis.com/token";
const POLL_MS = Number(env.POLL_INTERVAL_MS || 10000);
const dryRun = /^(1|true|yes)$/i.test(env.DRY_RUN || "");

const version = readManifest().version;
const zip = process.argv[2] || path.join(ROOT, "dist", `ai-leak-guard-${version}.zip`);
if (!fs.existsSync(zip)) fail(`Package not found: ${zip}. Run "npm run build" first.`);

const missing = ["CWS_PUBLISHER_ID", "CWS_EXTENSION_ID"].filter(k => !env[k]);
const hasToken = !!env.CWS_ACCESS_TOKEN || (env.CWS_CLIENT_ID && env.CWS_CLIENT_SECRET && env.CWS_REFRESH_TOKEN);
if (!hasToken) missing.push("CWS_ACCESS_TOKEN or CWS_CLIENT_ID/CWS_CLIENT_SECRET/CWS_REFRESH_TOKEN");
if (missing.length) {
  console.log(`::warning::Chrome Web Store publishing skipped. Not configured: ${missing.join(", ")}`);
  process.exit(0);
}

const item = `${API}/v2/publishers/${env.CWS_PUBLISHER_ID}/items/${env.CWS_EXTENSION_ID}`;
const uploadUrl = `${API}/upload/v2/publishers/${env.CWS_PUBLISHER_ID}/items/${env.CWS_EXTENSION_ID}:upload`;
const publishBody = { publishType: /^(1|true|yes)$/i.test(env.CWS_STAGED || "") ? "STAGED_PUBLISH" : "DEFAULT_PUBLISH" };
if (env.CWS_DEPLOY_PERCENTAGE) publishBody.deployInfos = [{ deployPercentage: Number(env.CWS_DEPLOY_PERCENTAGE) }];

if (dryRun) {
  console.log(`[dry run] Would upload ${path.basename(zip)} (version ${version})`);
  console.log(`[dry run] POST ${uploadUrl}`);
  console.log(`[dry run] POST ${item}:publish ${JSON.stringify(publishBody)}`);
  process.exit(0);
}

async function call(url, init, what) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) fail(`${what} failed (HTTP ${res.status}): ${text.slice(0, 1000)}`);
  return body;
}

async function accessToken() {
  if (env.CWS_ACCESS_TOKEN) return env.CWS_ACCESS_TOKEN;
  const body = await call(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.CWS_CLIENT_ID, client_secret: env.CWS_CLIENT_SECRET, refresh_token: env.CWS_REFRESH_TOKEN, grant_type: "refresh_token" })
  }, "Getting an access token");
  if (!body.access_token) fail("Token response did not contain an access_token");
  return body.access_token;
}

const token = await accessToken();
const auth = { Authorization: `Bearer ${token}` };

console.log(`Uploading ${path.basename(zip)} (version ${version}) to the Chrome Web Store...`);
const up = await call(uploadUrl, { method: "POST", headers: { ...auth, "Content-Type": "application/zip" }, body: fs.readFileSync(zip) }, "Upload");
let state = up.uploadState || "";
console.log(`Upload state: ${state || "(none reported)"}`);

for (let i = 0; /IN_PROGRESS/.test(state); i++) {
  if (i >= 30) fail("Upload still in progress after 30 checks. Check the Developer Dashboard.");
  await sleep(POLL_MS);
  const st = await call(`${item}:fetchStatus`, { headers: auth }, "Fetching status");
  state = st.lastAsyncUploadState || "";
  console.log(`Upload state: ${state}`);
}
if (/FAIL|NOT_FOUND/.test(state)) fail(`Upload failed with state ${state}: ${JSON.stringify(up).slice(0, 1000)}`);
if (up.crxVersion && up.crxVersion !== version) fail(`Store received version ${up.crxVersion}, expected ${version}`);

console.log("Submitting for review...");
const pub = await call(`${item}:publish`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(publishBody) }, "Publish");
console.log(`Submitted. Item state: ${pub.state || "(not reported)"}`);
if (pub.warningInfo) console.log(`::warning::Store warnings: ${JSON.stringify(pub.warningInfo)}`);
