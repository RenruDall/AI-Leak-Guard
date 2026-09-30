// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
/* AI Leak Guard – content script for AI chat sites.
 * Intercepts paste and send, checks the text locally, and asks before confidential data leaves. */
(function () {
  "use strict";
  const { detect, mask, preview } = self.ALG;
  const I18N = self.ALG_I18N;
  const SETTINGS = self.ALG_SETTINGS;

  // Safe defaults apply until stored settings have loaded.
  let settings = { enabled: true, lang: "auto", disabled: [], customTerms: [], allowSendAnyway: true };
  let dialogOpen = false;
  let lastEditor = null;
  const allowed = new Set(); // values the user explicitly allowed in this tab

  const SITE_NAMES = {
    "chatgpt.com": "ChatGPT", "chat.openai.com": "ChatGPT", "claude.ai": "Claude", "gemini.google.com": "Gemini",
    "copilot.microsoft.com": "Copilot", "m365.cloud.microsoft": "Microsoft 365 Copilot", "www.perplexity.ai": "Perplexity",
    "chat.mistral.ai": "Le Chat", "chat.deepseek.com": "DeepSeek", "grok.com": "Grok", "www.meta.ai": "Meta AI"
  };
  const siteName = SITE_NAMES[location.hostname] || location.hostname;

  async function refresh() { settings = await SETTINGS.load(); }
  refresh();
  try { chrome.storage.onChanged.addListener(refresh); } catch (e) {}

  // ---------- editor helpers ----------
  function editorFrom(node) {
    const el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el) return null;
    if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search|)$/i.test(el.type))) return el;
    return el.closest('[contenteditable=""],[contenteditable="true"],[contenteditable="plaintext-only"]');
  }
  const isField = el => el.tagName === "TEXTAREA" || el.tagName === "INPUT";
  const getText = el => (isField(el) ? el.value : el.innerText || "");

  function saveSelection(el) {
    if (isField(el)) return { s: el.selectionStart, e: el.selectionEnd };
    const sel = getSelection();
    return sel.rangeCount ? { r: sel.getRangeAt(0).cloneRange() } : null;
  }
  function restoreSelection(el, saved) {
    el.focus();
    if (!saved) return;
    if (isField(el)) el.setSelectionRange(saved.s, saved.e);
    else if (saved.r) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(saved.r); }
  }
  function insertText(el, text) {
    el.focus();
    const done = document.execCommand("insertText", false, text);
    if (!done && isField(el)) {
      el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  function replaceAll(el, text) {
    el.focus();
    if (isField(el)) el.select();
    else { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    insertText(el, text);
  }

  function check(text) {
    if (!settings || !settings.enabled || !text) return [];
    return detect(text, { disabled: settings.disabled, customTerms: settings.customTerms, allowValues: allowed });
  }

  // ---------- dialog ----------
  function showDialog(mode, findings) {
    const T = I18N.t(settings.lang);
    dialogOpen = true;
    return new Promise(resolve => {
      const host = document.createElement("div");
      host.setAttribute("data-ai-leak-guard", "");
      host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647;";
      const root = host.attachShadow({ mode: "closed" });

      const groups = new Map();
      for (const f of findings) {
        const g = groups.get(f.type) || { type: f.type, severity: f.severity, items: [] };
        if (!g.items.some(v => v === f.value)) g.items.push(f.value);
        groups.set(f.type, g);
      }
      const canMask = findings.some(f => f.mask);
      const canAnyway = settings.allowSendAnyway;
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

      root.innerHTML = `
<style>
  :host{all:initial}
  .scrim{position:fixed;inset:0;background:rgba(10,14,20,.45);display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .box{--bg:#fff;--ink:#141a22;--muted:#5d6673;--line:#e1e5ea;--hi:#b3261e;--hi-bg:#fdeceb;--md:#8a5a00;--md-bg:#fff4dc;--acc:#1b5fd1;
       background:var(--bg);color:var(--ink);width:min(460px,100%);max-height:90vh;overflow:auto;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.28);border-top:5px solid var(--hi)}
  @media (prefers-color-scheme:dark){.box{--bg:#1b2028;--ink:#e8ebef;--muted:#a3abb6;--line:#2f3642;--hi:#f2938c;--hi-bg:#3d2120;--md:#f0c26a;--md-bg:#3a2e14;--acc:#8cb4ff}}
  .in{padding:18px 20px;display:grid;gap:12px}
  h2{margin:0;font-size:18px;line-height:1.25}
  p{margin:0}
  .muted{color:var(--muted);font-size:13px}
  ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
  li{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:8px 10px;border-radius:8px;background:var(--md-bg)}
  li.high{background:var(--hi-bg)}
  li b{font-weight:600}
  li code{font:12px ui-monospace,Menlo,Consolas,monospace;color:var(--muted);white-space:nowrap}
  .btns{display:flex;flex-wrap:wrap;gap:8px}
  button{font:600 14px system-ui,-apple-system,"Segoe UI",sans-serif;border-radius:8px;padding:9px 14px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--ink)}
  button.primary{background:var(--acc);border-color:var(--acc);color:#fff}
  @media (prefers-color-scheme:dark){button.primary{color:#0d1117}}
  button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
  .foot{border-top:1px solid var(--line);padding:10px 20px;font-size:12px;color:var(--muted)}
</style>
<div class="scrim" part="scrim">
  <div class="box" role="alertdialog" aria-modal="true" aria-labelledby="t">
    <div class="in">
      <h2 id="t">${esc(T.title)}</h2>
      <p>${esc((mode === "paste" ? T.introPaste : T.introSend).replace("{site}", siteName))}</p>
      <ul>${[...groups.values()].map(g => `<li class="${g.severity}"><b>${esc(T.types[g.type] || g.type)}${g.items.length > 1 ? " ×" + g.items.length : ""}</b><code>${esc(g.items.slice(0, 2).map(preview).join(", "))}</code></li>`).join("")}</ul>
      ${canMask ? `<p class="muted">${esc(T.hintMask)}</p>` : ""}
      ${mode === "send" ? `<p class="muted">${esc(T.hintSend)}</p>` : ""}
      ${!canAnyway ? `<p class="muted">${esc(T.policy)}</p>` : ""}
      <div class="btns">
        ${canMask ? `<button class="primary" data-a="mask">${esc(mode === "paste" ? T.maskPaste : T.maskSend)}</button>` : ""}
        ${canAnyway ? `<button data-a="anyway">${esc(mode === "paste" ? T.anywayPaste : T.anywaySend)}</button>` : ""}
        <button data-a="cancel">${esc(T.cancel)}</button>
      </div>
    </div>
    <div class="foot">AI Leak Guard · ${esc(T.localOnly)}</div>
  </div>
</div>`;

      function close(choice) {
        document.removeEventListener("keydown", onKey, true);
        host.remove();
        dialogOpen = false;
        resolve(choice);
      }
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); close("cancel"); }
      }
      root.addEventListener("click", e => {
        const b = e.target.closest("button[data-a]");
        if (b) close(b.dataset.a);
      });
      document.addEventListener("keydown", onKey, true);
      document.documentElement.appendChild(host);
      const first = root.querySelector("button");
      if (first) first.focus();
    });
  }

  // ---------- paste ----------
  document.addEventListener("paste", async e => {
    if (dialogOpen) return;
    const el = editorFrom(e.target);
    if (!el) return;
    const text = e.clipboardData && e.clipboardData.getData("text/plain");
    const findings = check(text);
    if (!findings.length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const saved = saveSelection(el);
    SETTINGS.bumpStat("warnings");
    const choice = await showDialog("paste", findings);
    restoreSelection(el, saved);
    if (choice === "mask") { insertText(el, mask(text, findings)); SETTINGS.bumpStat("masked"); }
    else if (choice === "anyway") { findings.forEach(f => allowed.add(f.value)); insertText(el, text); SETTINGS.bumpStat("allowed"); }
    else SETTINGS.bumpStat("cancelled");
  }, true);

  // ---------- send (Enter key or send button) ----------
  async function guardSend(e, el) {
    const findings = check(getText(el));
    if (!findings.length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    SETTINGS.bumpStat("warnings");
    const choice = await showDialog("send", findings);
    el.focus();
    if (choice === "mask") { replaceAll(el, mask(getText(el), findings)); SETTINGS.bumpStat("masked"); }
    else if (choice === "anyway") { findings.forEach(f => allowed.add(f.value)); SETTINGS.bumpStat("allowed"); }
    else SETTINGS.bumpStat("cancelled");
  }

  document.addEventListener("focusin", e => { const el = editorFrom(e.target); if (el) lastEditor = el; }, true);

  document.addEventListener("keydown", e => {
    if (dialogOpen || e.key !== "Enter" || e.shiftKey || e.altKey || e.isComposing) return;
    const el = editorFrom(e.target);
    if (el) guardSend(e, el);
  }, true);

  const SEND_RE = /\b(send|submit|senden|absenden|invia|inviare|envoyer)\b/i;
  document.addEventListener("click", e => {
    if (dialogOpen) return;
    const b = e.target.closest && e.target.closest('button,[role="button"]');
    if (!b || !lastEditor || !lastEditor.isConnected) return;
    const label = [b.getAttribute("aria-label"), b.getAttribute("data-testid"), b.getAttribute("title")].filter(Boolean).join(" ");
    if (SEND_RE.test(label.replace(/[-_]/g, " "))) guardSend(e, lastEditor);
  }, true);
})();
