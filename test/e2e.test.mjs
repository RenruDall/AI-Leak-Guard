// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
// End-to-end test: loads the extension into Chromium and exercises it on a local chat-like page.
// Run: npx playwright install chromium && node test/e2e.test.mjs
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, copyExtension } from "../scripts/lib.mjs";

const PORT = 8765;
const ORIGIN = `http://localhost:${PORT}`;

// Test copy of the extension: also runs on the local page, and uses an open shadow root so tests can see the dialog.
const ext = fs.mkdtempSync(path.join(os.tmpdir(), "alg-e2e-"));
copyExtension(ext);
const mf = JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"));
mf.content_scripts[0].matches.push(`${ORIGIN}/*`);
fs.writeFileSync(path.join(ext, "manifest.json"), JSON.stringify(mf));
const cs = path.join(ext, "src/content.js");
fs.writeFileSync(cs, fs.readFileSync(cs, "utf8").replace('mode: "closed"', 'mode: "open"'));

const page = fs.readFileSync(path.join(ROOT, "test/fixtures/chat.html"));
const server = http.createServer((q, r) => { r.setHeader("content-type", "text/html; charset=utf-8"); r.end(page); }).listen(PORT);

// Chromium derives an unpacked extension's ID from its absolute path.
const extId = p => [...crypto.createHash("sha256").update(p).digest("hex").slice(0, 32)].map(c => String.fromCharCode(97 + parseInt(c, 16))).join("");

const results = [];
const check = (name, cond) => { results.push({ name, ok: !!cond }); console.log(`${cond ? "PASS" : "FAIL"} ${name}`); };

async function launch(locale) {
  const ctx = await chromium.launchPersistentContext("", {
    headless: true, channel: "chromium", locale,
    args: [`--lang=${locale}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`]
  });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
  return ctx;
}
async function paste(p, sel, text) {
  await p.evaluate(t => navigator.clipboard.writeText(t), text);
  await p.focus(sel);
  await p.keyboard.press("Control+V");
}
const dialogOf = p => p.locator("[data-ai-leak-guard] >> [role=alertdialog]");

try {
  // ---- main flow (German interface) ----
  const ctx = await launch("de-DE");
  const p = await ctx.newPage();
  await p.goto(ORIGIN);
  await p.waitForTimeout(500);
  const dialog = dialogOf(p);

  await paste(p, "#ta", "Bitte an mario.rossi@example.it, IBAN DE89 3704 0044 0532 0130 00 überweisen. VERTRAULICH");
  await dialog.waitFor({ timeout: 5000 });
  check("dialog appears on risky paste, in German", (await dialog.innerText()).includes("Möglicherweise vertrauliche Daten"));
  await dialog.locator("button[data-a=mask]").click();
  const v = await p.inputValue("#ta");
  check("paste with placeholders", v.includes("[EMAIL_1]") && v.includes("[IBAN_1]") && !v.includes("DE89"));

  await p.fill("#ta", "");
  await paste(p, "#ta", "Formuliere bitte eine freundliche Antwort.");
  await p.waitForTimeout(400);
  check("clean paste passes without dialog", (await dialog.count()) === 0);

  await p.fill("#ta", "db password: Winter2026!");
  await p.click("#send");
  await dialog.waitFor({ timeout: 5000 });
  await dialog.locator("button[data-a=cancel]").click();
  check("cancel blocks the send button", (await p.locator("#log li").count()) === 0);

  await p.click("#ce");
  await p.keyboard.type("Kunde CF RSSMRA85T10A562S bitte prüfen");
  await p.keyboard.press("Enter");
  await dialog.waitFor({ timeout: 5000 });
  await dialog.locator("button[data-a=anyway]").click();
  check("allow does not send by itself", (await p.locator("#log li").count()) === 0);
  await p.click("#ce");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(300);
  const logs = await p.locator("#log li").allInnerTexts();
  check("second Enter sends after allow", logs.length === 1 && logs[0].includes("RSSMRA85T10A562S"));

  await p.click("#ce");
  await p.keyboard.type("Key sk-proj-abcdefghijklmnopqrstuvwxyz123456 test");
  await p.keyboard.press("Enter");
  await dialog.waitFor({ timeout: 5000 });
  await dialog.locator("button[data-a=mask]").click();
  const ce = await p.locator("#ce").innerText();
  check("typed message replaced with placeholders", ce.includes("[AI_API_KEY_1]") && !ce.includes("sk-proj"));

  const op = await ctx.newPage();
  await op.goto(`chrome-extension://${extId(ext)}/options/options.html`);
  await op.fill("#terms", "Alpenblick");
  await op.click("#save");
  await op.locator("#saved").filter({ hasText: /\S/ }).waitFor({ timeout: 5000 }).catch(() => {});
  await op.fill("#try", "Projekt Alpenblick, Karte 4111 1111 1111 1111");
  // Wait for the result rather than a fixed time: settings load asynchronously.
  await op.locator("#tryOut .masked").waitFor({ timeout: 5000 }).catch(() => {});
  const tryOut = await op.locator("#tryOut").innerText();
  check("settings page: try-it box finds custom term and card", tryOut.includes("Geschützter Begriff") && tryOut.includes("Kreditkartennummer"));

  await p.fill("#ta", "");
  await paste(p, "#ta", "Status Alpenblick?");
  await dialog.waitFor({ timeout: 5000 });
  check("protected term from settings triggers on the chat page", (await dialog.innerText()).includes("Geschützter Begriff"));

  const pop = await ctx.newPage();
  await pop.goto(`chrome-extension://${extId(ext)}/popup/popup.html`);
  await pop.waitForTimeout(300);
  check("popup shows author credit and version", /AI Leak Guard \d+\.\d+\.\d+\s·\s© 2026 Michael Ladurner/.test(await pop.locator(".credit").innerText()));
  await pop.setViewportSize({ width: 312, height: 330 });
  await pop.screenshot({ path: path.join(os.tmpdir(), "alg-popup.png") });
  check("popup renders with counters", (await pop.locator("#enabledLbl").innerText()).length > 0 && Number(await pop.locator("#s-warn").innerText()) >= 1);
  await ctx.close();

  // ---- every interface language ----
  const cases = [
    ["en-US", "Pay DE89 3704 0044 0532 0130 00 now", "Possible confidential data", "[IBAN_1]"],
    ["it-IT", "CF RSSMRA85T10A562S del cliente", "Possibili dati riservati", "[CODICE_FISCALE_1]"],
    ["fr-FR", "N° sécu 1 85 05 78 006 084 91", "Données confidentielles possibles", "[NIR_1]"],
    ["es-ES", "DNI 12345678Z del cliente", "Posibles datos confidenciales", "[DNI_1]"],
    ["nl-NL", "Mijn BSN is 111222333", "Mogelijk vertrouwelijke gegevens", "[BSN_1]"],
    ["pl-PL", "PESEL 44051401359 klienta", "Możliwe dane poufne", "[PESEL_1]"],
    ["pt-PT", "NIF 123 456 789 do cliente", "Possíveis dados confidenciais", "[NIF_PT_1]"],
    ["sv-SE", "personnummer 811228-9874", "Möjligen konfidentiella uppgifter", "[PERSONNUMMER_1]"]
  ];
  for (const [locale, text, title, placeholder] of cases) {
    const c = await launch(locale);
    const lp = await c.newPage();
    await lp.goto(ORIGIN);
    await lp.waitForTimeout(400);
    await paste(lp, "#ta", text);
    const d = dialogOf(lp);
    await d.waitFor({ timeout: 5000 });
    const t = await d.innerText();
    await d.locator("button[data-a=mask]").click();
    check(`${locale}: translated dialog and masking`, t.includes(title) && (await lp.inputValue("#ta")).includes(placeholder));
    await c.close();
  }
} catch (e) {
  console.error(e);
  results.push({ name: "unexpected error", ok: false });
} finally {
  server.close();
  fs.rmSync(ext, { recursive: true, force: true });
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} end-to-end checks passed`);
process.exit(failed ? 1 : 0);
