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
  const ICONS = {
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M12 8v4.5M12 16h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };
  function snippet(t, max) {
    if (t.length <= max) return t;
    const first = t.search(/\[[A-Z0-9_]+_\d+\]/);
    const start = Math.max(0, Math.min(first - 60, t.length - max));
    return (start > 0 ? "…" : "") + t.slice(start, start + max) + (start + max < t.length ? "…" : "");
  }

  function showDialog(mode, findings, text) {
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
        if (f.severity === "high") g.severity = "high";
        if (!g.items.some(v => v === f.value)) g.items.push(f.value);
        groups.set(f.type, g);
      }
      const sorted = [...groups.values()].sort((x, y) => (y.severity === "high") - (x.severity === "high"));
      const anyHigh = sorted.some(g => g.severity === "high");
      const canMask = findings.some(f => f.mask);
      const canAnyway = settings.allowSendAnyway;
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const masked = canMask && text ? esc(snippet(mask(text, findings).replace(/\s+/g, " ").trim(), 220)).replace(/\[[A-Z0-9_]+_\d+\]/g, m => `<mark>${m}</mark>`) : "";

      root.innerHTML = `
<style>
  :host{all:initial}
  *{box-sizing:border-box}
  .scrim{position:fixed;inset:0;background:rgba(9,12,20,.42);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px;
    font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;animation:fade .16s ease-out}
  .box{--bg:#fff;--ink:#0f172a;--muted:#5b6476;--line:#e3e8f0;--soft:#f3f6fa;--acc:#2155d6;--acc-ink:#fff;--hi:#c2342b;--hi-bg:#fdecea;--md:#9a6400;--md-bg:#fff4d9;--mark:#e3ecff;--mark-ink:#1d4ed8;
    position:relative;background:var(--bg);color:var(--ink);width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:18px;
    box-shadow:0 1px 0 rgba(255,255,255,.04) inset,0 24px 70px rgba(9,12,20,.32),0 2px 8px rgba(9,12,20,.08);animation:pop .2s cubic-bezier(.2,.9,.3,1.2)}
  @media (prefers-color-scheme:dark){.box{--bg:#161b24;--ink:#e8ecf3;--muted:#9aa4b5;--line:#283247;--soft:#1d2431;--acc:#7fa6ff;--acc-ink:#0b1220;--hi:#ff8e86;--hi-bg:#3a1d1c;--md:#f2c46b;--md-bg:#33290f;--mark:#22345c;--mark-ink:#b9ceff}}
  @keyframes fade{from{opacity:0}} @keyframes pop{from{opacity:0;transform:translateY(8px) scale(.97)}}
  @media (prefers-reduced-motion:reduce){.scrim,.box{animation:none}}
  .in{padding:20px 20px 16px}
  .top{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}
  .badge{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--md-bg);color:var(--md)}
  .badge.high{background:var(--hi-bg);color:var(--hi)}
  .badge svg{width:22px;height:22px}
  h2{margin:1px 0 2px;font-size:17px;line-height:1.3;font-weight:650;letter-spacing:-.01em}
  p{margin:0}
  .sub{color:var(--muted);font-size:13.5px}
  ul{list-style:none;margin:0 0 14px;padding:0;border:1px solid var(--line);border-radius:12px;overflow:hidden}
  li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--line)}
  li:first-child{border-top:0}
  li i{flex:none;width:8px;height:8px;border-radius:50%;background:var(--md)}
  li.high i{background:var(--hi)}
  li b{font-weight:600;flex:1;min-width:0}
  li .n{font:600 11px system-ui,sans-serif;color:var(--muted);background:var(--soft);border-radius:999px;padding:1px 7px}
  li code{font:12px ui-monospace,Menlo,Consolas,monospace;color:var(--muted);white-space:nowrap;max-width:45%;overflow:hidden;text-overflow:ellipsis}
  .prev{margin:0 0 14px}
  .prev span{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px}
  .prev div{background:var(--soft);border-radius:12px;padding:10px 12px;font:12.5px/1.55 ui-monospace,Menlo,Consolas,monospace;overflow-wrap:anywhere;max-height:120px;overflow:auto}
  mark{background:var(--mark);color:var(--mark-ink);border-radius:5px;padding:0 3px;font-weight:600}
  .note{color:var(--muted);font-size:12.5px;margin:-4px 0 14px}
  .btns{display:grid;gap:8px}
  .row{display:flex;gap:8px}
  .row button{flex:1}
  button{font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;border-radius:11px;padding:11px 14px;cursor:pointer;border:1px solid var(--line);background:var(--bg);color:var(--ink);transition:background .15s,border-color .15s,transform .1s}
  button:hover{background:var(--soft)}
  button:active{transform:scale(.985)}
  button.primary{background:var(--acc);border-color:var(--acc);color:var(--acc-ink);padding:12px 14px;font-size:14.5px}
  button.primary:hover{filter:brightness(1.06);background:var(--acc)}
  button.quiet{border-color:transparent;color:var(--muted)}
  button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
  .foot{display:flex;align-items:center;gap:7px;border-top:1px solid var(--line);padding:10px 20px;font-size:12px;color:var(--muted);background:var(--soft)}
  .foot svg{width:14px;height:14px;flex:none}
</style>
<div class="scrim" part="scrim">
  <div class="box" role="alertdialog" aria-modal="true" aria-labelledby="t" aria-describedby="d">
    <div class="in">
      <div class="top">
        <div class="badge ${anyHigh ? "high" : ""}">${ICONS.alert}</div>
        <div><h2 id="t">${esc(T.title)}</h2><p class="sub" id="d">${esc((mode === "paste" ? T.introPaste : T.introSend).replace("{site}", siteName))}</p></div>
      </div>
      <ul>${sorted.map(g => `<li class="${g.severity}"><i></i><b>${esc(T.types[g.type] || g.type)}</b>${g.items.length > 1 ? `<span class="n">×${g.items.length}</span>` : ""}<code>${esc(g.items.slice(0, 2).map(preview).join(", "))}</code></li>`).join("")}</ul>
      ${masked ? `<div class="prev"><span>${esc(T.preview)}</span><div>${masked}</div></div>` : canMask ? `<p class="note">${esc(T.hintMask)}</p>` : ""}
      ${mode === "send" ? `<p class="note">${esc(T.hintSend)}</p>` : ""}
      ${!canAnyway ? `<p class="note">${esc(T.policy)}</p>` : ""}
      <div class="btns">
        ${canMask ? `<button class="primary" data-a="mask">${esc(mode === "paste" ? T.maskPaste : T.maskSend)}</button>` : ""}
        <div class="row">
          ${canAnyway ? `<button class="${canMask ? "quiet" : ""}" data-a="anyway">${esc(mode === "paste" ? T.anywayPaste : T.anywaySend)}</button>` : ""}
          <button class="${canMask ? "" : "primary"}" data-a="cancel">${esc(T.cancel)}</button>
        </div>
      </div>
    </div>
    <div class="foot">${ICONS.lock}<span>AI Leak Guard · ${esc(T.localOnly)}</span></div>
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
      const first = root.querySelector("button.primary") || root.querySelector("button[data-a=cancel]");
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
    const choice = await showDialog("paste", findings, text);
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
    const choice = await showDialog("send", findings, getText(el));
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
