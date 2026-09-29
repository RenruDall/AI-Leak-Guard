// Tests the publish scripts against local mock versions of the Chrome Web Store and Edge Add-ons APIs.
import http from "node:http";
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import assert from "node:assert";
import { ROOT, readManifest } from "../scripts/lib.mjs";

const version = readManifest().version;
const zip = path.join(ROOT, "dist", `ai-leak-guard-${version}.zip`);
if (!fs.existsSync(zip)) spawnSync(process.execPath, [path.join(ROOT, "scripts/build.mjs")], { stdio: "inherit", env: { ...process.env, GITHUB_OUTPUT: "" } });
const zipSize = fs.statSync(zip).size;

let mode = "ok"; // ok | fail
const calls = [];
let pollsLeft = 0;
const server = http.createServer((req, res) => {
  let chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    calls.push({ method: req.method, url: req.url, auth: req.headers.authorization || "", client: req.headers["x-clientid"] || "", size: body.length, body: body.toString("utf8").slice(0, 300) });
    const json = (code, obj, headers = {}) => { res.writeHead(code, { "content-type": "application/json", ...headers }); res.end(JSON.stringify(obj)); };
    const u = req.url;
    // Google OAuth
    if (u === "/token") return json(200, { access_token: "ya29.mock" });
    // Chrome Web Store v2
    if (u.endsWith(":upload")) { pollsLeft = 2; return json(200, mode === "fail" ? { uploadState: "FAILED" } : { uploadState: "UPLOAD_IN_PROGRESS", crxVersion: version }); }
    if (u.endsWith(":fetchStatus")) return json(200, { lastAsyncUploadState: --pollsLeft > 0 ? "UPLOAD_IN_PROGRESS" : "SUCCEEDED" });
    if (u.endsWith(":publish")) return json(200, { state: "PENDING_REVIEW" });
    // Edge Add-ons v1.1
    if (u.endsWith("/submissions/draft/package") && req.method === "POST") { pollsLeft = 2; res.writeHead(202, { location: "/v1/products/p1/submissions/draft/package/operations/op-up" }); return res.end(); }
    if (u.includes("/draft/package/operations/")) return json(200, mode === "fail" ? { status: "Failed", errors: [{ message: "Manifest version already used" }] } : { status: --pollsLeft > 0 ? "InProgress" : "Succeeded" });
    if (u.endsWith("/submissions") && req.method === "POST") { pollsLeft = 1; res.writeHead(202, { location: "op-sub" }); return res.end(); }
    if (u.includes("/submissions/operations/")) return json(200, { status: "Succeeded" });
    json(404, { error: "unknown " + u });
  });
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

function run(script, extraEnv) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", script)], {
    env: { PATH: process.env.PATH, POLL_INTERVAL_MS: "10", ...extraEnv }, encoding: "utf8"
  });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
const cwsEnv = { CWS_API_BASE: base, CWS_TOKEN_URL: `${base}/token`, CWS_PUBLISHER_ID: "pub1", CWS_EXTENSION_ID: "ext1", CWS_CLIENT_ID: "c", CWS_CLIENT_SECRET: "s", CWS_REFRESH_TOKEN: "r" };
const edgeEnv = { EDGE_API_BASE: base, EDGE_PRODUCT_ID: "p1", EDGE_CLIENT_ID: "client-1", EDGE_API_KEY: "key-1", RELEASE_NOTES: "Nine languages" };
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("ok  " + name); };

(async () => {
  try {
    let r = run("publish-chrome.mjs", {});
    ok("chrome: skips cleanly when not configured", () => { assert.strictEqual(r.code, 0); assert.match(r.out, /skipped/); });

    r = run("publish-edge.mjs", { ...edgeEnv, DRY_RUN: "true" });
    ok("edge: dry run makes no calls", () => { assert.strictEqual(r.code, 0); assert.match(r.out, /\[dry run\]/); assert.strictEqual(calls.length, 0); });
  } catch (e) { console.error(e); process.exitCode = 1; }

  // Real runs need the server to answer while the child runs, so use async spawn.
  const { spawn } = await import("node:child_process");
  const runLive = (script, extraEnv) => new Promise(resolve => {
    const c = spawn(process.execPath, [path.join(ROOT, "scripts", script)], { env: { PATH: process.env.PATH, POLL_INTERVAL_MS: "10", ...extraEnv } });
    let out = ""; c.stdout.on("data", d => (out += d)); c.stderr.on("data", d => (out += d));
    c.on("close", code => resolve({ code, out }));
  });

  try {
    calls.length = 0; mode = "ok";
    let r = await runLive("publish-chrome.mjs", cwsEnv);
    ok("chrome: refresh token, upload, poll, publish", () => {
      assert.strictEqual(r.code, 0, r.out);
      const up = calls.find(c => c.url.endsWith(":upload"));
      assert.strictEqual(up.url, "/upload/v2/publishers/pub1/items/ext1:upload");
      assert.strictEqual(up.auth, "Bearer ya29.mock");
      assert.strictEqual(up.size, zipSize);
      assert.strictEqual(calls.filter(c => c.url.endsWith(":fetchStatus")).length, 2);
      const pub = calls.find(c => c.url.endsWith(":publish"));
      assert.strictEqual(pub.url, "/v2/publishers/pub1/items/ext1:publish");
      assert.deepStrictEqual(JSON.parse(pub.body), { publishType: "DEFAULT_PUBLISH" });
      assert.match(r.out, /PENDING_REVIEW/);
    });

    calls.length = 0;
    r = await runLive("publish-chrome.mjs", { ...cwsEnv, CWS_CLIENT_ID: "", CWS_ACCESS_TOKEN: "wif-token", CWS_STAGED: "true", CWS_DEPLOY_PERCENTAGE: "10" });
    ok("chrome: access token from CI identity, staged 10% rollout", () => {
      assert.strictEqual(r.code, 0, r.out);
      assert(!calls.some(c => c.url === "/token"));
      assert.strictEqual(calls.find(c => c.url.endsWith(":upload")).auth, "Bearer wif-token");
      assert.deepStrictEqual(JSON.parse(calls.find(c => c.url.endsWith(":publish")).body), { publishType: "STAGED_PUBLISH", deployInfos: [{ deployPercentage: 10 }] });
    });

    calls.length = 0;
    r = await runLive("publish-edge.mjs", edgeEnv);
    ok("edge: upload, poll, submit with notes", () => {
      assert.strictEqual(r.code, 0, r.out);
      const up = calls.find(c => c.url.endsWith("/draft/package"));
      assert.strictEqual(up.url, "/v1/products/p1/submissions/draft/package");
      assert.strictEqual(up.auth, "ApiKey key-1");
      assert.strictEqual(up.client, "client-1");
      assert.strictEqual(up.size, zipSize);
      assert(calls.some(c => c.url === "/v1/products/p1/submissions/draft/package/operations/op-up"));
      assert.deepStrictEqual(JSON.parse(calls.find(c => c.url === "/v1/products/p1/submissions").body), { notes: "Nine languages" });
      assert(calls.some(c => c.url === "/v1/products/p1/submissions/operations/op-sub"));
      assert.match(r.out, /Submitted for certification/);
    });

    mode = "fail";
    r = await runLive("publish-edge.mjs", edgeEnv);
    ok("edge: failed upload stops the release with the store's message", () => { assert.strictEqual(r.code, 1); assert.match(r.out, /Manifest version already used/); });
    r = await runLive("publish-chrome.mjs", cwsEnv);
    ok("chrome: failed upload stops the release", () => { assert.strictEqual(r.code, 1); assert.match(r.out, /Upload failed/); });
  } catch (e) { console.error(e); process.exitCode = 1; }
  server.close();
  console.log(`\n${n} publish test groups passed`);
})();
