// Store screenshots (1280x800) and a small promo tile (440x280). Not part of the extension package.
// Run: npx playwright install chromium && node store/screenshots.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, copyExtension } from "../scripts/lib.mjs";

const OUT = path.join(ROOT, "store", "images"); fs.mkdirSync(OUT, { recursive: true });
const PORT = 8766, HOST = "assistant.example", ORIGIN = `http://${HOST}:${PORT}`;
const ext = fs.mkdtempSync(path.join(os.tmpdir(), "alg-shots-"));
copyExtension(ext);
const mf = JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"));
mf.content_scripts[0].matches.push(`${ORIGIN}/*`);
fs.writeFileSync(path.join(ext, "manifest.json"), JSON.stringify(mf));
const cs = path.join(ext, "src/content.js");
fs.writeFileSync(cs, fs.readFileSync(cs, "utf8").replace('mode: "closed"', 'mode: "open"'));
const demo = fs.readFileSync(path.join(ROOT, "store", "demo-chat.html"));
const server = http.createServer((q, r) => { r.setHeader("content-type", "text/html; charset=utf-8"); r.end(demo); }).listen(PORT);
const extId = p => [...crypto.createHash("sha256").update(p).digest("hex").slice(0, 32)].map(c => String.fromCharCode(97 + parseInt(c, 16))).join("");

const lang = process.argv[2] || "en-US", tag = lang.slice(0, 2);
const ctx = await chromium.launchPersistentContext("", { headless: true, channel: "chromium", locale: lang, viewport: { width: 1280, height: 800 },
  args: [`--lang=${lang}`, `--host-resolver-rules=MAP ${HOST} 127.0.0.1`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`] });
const TEXT = { en: "Please remind Rossi Logistica: invoice 2026-118, pay to IBAN DE89 3704 0044 0532 0130 00. Contact: mario.rossi@example.it. Confidential.",
  de: "Bitte Rossi Logistica erinnern: Rechnung 2026-118, Zahlung an IBAN DE89 3704 0044 0532 0130 00. Kontakt: mario.rossi@example.it. Vertraulich.",
  it: "Ricorda a Rossi Logistica: fattura 2026-118, pagamento su IBAN DE89 3704 0044 0532 0130 00. Contatto: mario.rossi@example.it. Riservato." }[tag] || "";
try {
  const p = await ctx.newPage(); await p.goto(ORIGIN); await p.waitForTimeout(600);
  await p.focus("#ta"); await p.evaluate(t => { const dt = new DataTransfer(); dt.setData("text/plain", t); document.getElementById("ta").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); }, TEXT);
  const dialog = p.locator("[data-ai-leak-guard] >> [role=alertdialog]"); await dialog.waitFor({ timeout: 5000 }); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, `1-warning-${tag}.png`) });
  await dialog.locator("button[data-a=mask]").click(); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, `2-masked-${tag}.png`) });
  const id = extId(ext);
  const o = await ctx.newPage(); await o.setViewportSize({ width: 1280, height: 800 }); await o.goto(`chrome-extension://${id}/options/options.html`); await o.waitForSelector('#cats label', { timeout: 15000 }); await o.waitForTimeout(400);
  await o.screenshot({ path: path.join(OUT, `3-settings-${tag}.png`) });
  const pop = await ctx.newPage(); await pop.setViewportSize({ width: 300, height: 200 });
  await pop.goto(`chrome-extension://${id}/popup/popup.html`); await pop.waitForTimeout(500);
  const ph = await pop.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height + 24)), pw = 300;
  await pop.setViewportSize({ width: 1280, height: 800 });
  // popup on a calm backdrop
  await pop.setContent(`<style>body{margin:0;height:800px;display:grid;place-items:center;background:linear-gradient(135deg,#EEF2FF,#F7F7F8)}iframe{width:${pw}px;height:${ph}px;zoom:1.5;border:0;border-radius:14px;box-shadow:0 20px 60px rgba(20,30,60,.18);background:#fff}</style><iframe src="chrome-extension://${id}/popup/popup.html"></iframe>`);
  await pop.waitForTimeout(700); await pop.screenshot({ path: path.join(OUT, `4-popup-${tag}.png`) });
  if (tag === "en") {
    const icon = fs.readFileSync(path.join(ROOT, "icons/icon128.png")).toString("base64");
    const t = await ctx.newPage(); await t.setViewportSize({ width: 440, height: 280 });
    await t.setContent(`<style>body{margin:0;width:440px;height:280px;display:flex;align-items:center;gap:22px;padding:0 34px;box-sizing:border-box;background:linear-gradient(135deg,#0F172A,#1E3A8A);color:#fff;font:600 15px -apple-system,"Segoe UI",Roboto,sans-serif}img{width:96px;height:96px}b{display:block;font-size:28px;line-height:1.1;margin-bottom:8px}span{opacity:.85;font-weight:500;line-height:1.4}</style><img src="data:image/png;base64,${icon}"><div><b>AI Leak Guard</b><span>Stops passwords, IBANs and customer data before they reach AI chats.</span></div>`);
    await t.screenshot({ path: path.join(OUT, "promo-440x280.png") });
  }
  console.log("screenshots written to store/images for", lang);
} finally { await ctx.close(); server.close(); }
