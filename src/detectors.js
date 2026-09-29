/* AI Leak Guard – detection engine. Runs fully on-device; no network access. */
(function (root) {
  "use strict";

  // ---------- validators ----------
  function ibanValid(raw) {
    const s = raw.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
    const r = s.slice(4) + s.slice(0, 4);
    let rem = 0;
    for (const ch of r) {
      const v = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
      for (const d of v) rem = (rem * 10 + Number(d)) % 97;
    }
    return rem === 1;
  }

  function luhnValid(raw) {
    const d = raw.replace(/\D/g, "");
    if (d.length < 13 || d.length > 19) return false;
    if (/^(\d)\1+$/.test(d)) return false;
    let sum = 0, alt = false;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = Number(d[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  const CF_ODD = { 0:1,1:0,2:5,3:7,4:9,5:13,6:15,7:17,8:19,9:21,A:1,B:0,C:5,D:7,E:9,F:13,G:15,H:17,I:19,J:21,K:2,L:4,M:18,N:20,O:11,P:3,Q:6,R:8,S:12,T:14,U:16,V:10,W:22,X:25,Y:24,Z:23 };
  function codiceFiscaleValid(raw) {
    const s = raw.toUpperCase();
    if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(s)) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      const c = s[i];
      if (i % 2 === 0) sum += CF_ODD[c];
      else sum += /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65;
    }
    return String.fromCharCode(65 + (sum % 26)) === s[15];
  }

  function partitaIvaValid(d) {
    if (!/^\d{11}$/.test(d) || /^0+$/.test(d)) return false;
    let x = 0, y = 0;
    for (let i = 0; i < 10; i++) {
      const n = Number(d[i]);
      if (i % 2 === 0) x += n;
      else { const m = n * 2; y += m > 9 ? m - 9 : m; }
    }
    return (10 - ((x + y) % 10)) % 10 === Number(d[10]);
  }

  const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
  function dniValid(raw) { // Spanish DNI and NIE
    const s = raw.toUpperCase().replace(/[\s-]/g, "");
    const m = /^([XYZ]?)(\d{7,8})([A-Z])$/.exec(s);
    if (!m) return false;
    if (m[1] && m[2].length !== 7) return false;
    if (!m[1] && m[2].length !== 8) return false;
    const num = Number((m[1] ? "XYZ".indexOf(m[1]) : "") + m[2]);
    return DNI_LETTERS[num % 23] === m[3];
  }

  function nirValid(raw) { // French social security number (NIR)
    const s = raw.toUpperCase().replace(/\s/g, "");
    if (!/^[12]\d{4}(?:\d{2}|2A|2B)\d{6}\d{2}$/.test(s)) return false;
    const body = s.slice(0, 13).replace("2A", "19").replace("2B", "18");
    const key = Number(s.slice(13));
    return 97 - (Number(body) % 97) === key;
  }

  const digits = s => s.replace(/\D/g, "");

  function bsnValid(raw) { // Dutch citizen service number, "11-proof"
    const d = digits(raw);
    if (d.length !== 9 || /^0+$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 8; i++) s += (9 - i) * Number(d[i]);
    s -= Number(d[8]);
    return s % 11 === 0;
  }

  function peselValid(raw) { // Polish PESEL
    const d = digits(raw);
    if (d.length !== 11) return false;
    const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    let s = 0;
    for (let i = 0; i < 10; i++) s += w[i] * Number(d[i]);
    const month = Number(d.slice(2, 4)) % 20;
    return month >= 1 && month <= 12 && (10 - (s % 10)) % 10 === Number(d[10]);
  }

  function nifPtValid(raw) { // Portuguese tax number (NIF)
    const d = digits(raw);
    if (!/^[1235689]\d{8}$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 8; i++) s += (9 - i) * Number(d[i]);
    const r = s % 11;
    return (r < 2 ? 0 : 11 - r) === Number(d[8]);
  }

  function personnummerValid(raw) { // Swedish personal identity number (also coordination numbers)
    const d = digits(raw).slice(-10);
    if (d.length !== 10) return false;
    const month = Number(d.slice(2, 4)), day = Number(d.slice(4, 6));
    if (month < 1 || month > 12 || !((day >= 1 && day <= 31) || (day >= 61 && day <= 91))) return false;
    let s = 0;
    for (let i = 0; i < 10; i++) { let n = Number(d[i]); if (i % 2 === 0) { n *= 2; if (n > 9) n -= 9; } s += n; }
    return s % 10 === 0;
  }

  // ---------- rules ----------
  // Optional `context(before, match)`: must return true, where `before` is the 40 characters
  // preceding the match. Used for short all-digit IDs that would otherwise cause false alarms.
  // category: secrets | finance | personal | internal | labels
  // severity: high | medium | info
  const RULES = [
    { id: "private_key", category: "secrets", severity: "high",
      re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z0-9 ]*PRIVATE KEY-----|$)/g },
    { id: "aws_key", category: "secrets", severity: "high", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
    { id: "github_token", category: "secrets", severity: "high",
      re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/g },
    { id: "ai_api_key", category: "secrets", severity: "high", re: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_\-]{20,}/g },
    { id: "slack_token", category: "secrets", severity: "high", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
    { id: "google_api_key", category: "secrets", severity: "high", re: /\bAIza[0-9A-Za-z_\-]{35}\b/g },
    { id: "azure_key", category: "secrets", severity: "high",
      re: /(?:AccountKey|SharedAccessKey)=([A-Za-z0-9+\/=]{30,})/g, group: 1 },
    { id: "sas_signature", category: "secrets", severity: "high", re: /[?&]sig=([A-Za-z0-9%+\/=]{20,})/g, group: 1 },
    { id: "jwt", category: "secrets", severity: "high",
      re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
    { id: "password", category: "secrets", severity: "high",
      re: /(?<![\p{L}])(?:password|passwort|kennwort|parola ?d'ordine|mot de passe|mdp|contraseña|contrasena|clave|wachtwoord|hasło|haslo|senha|palavra-passe|lösenord|losenord|pwd|passwd|pass)\s*[:=]\s*("[^"\n]{3,}"|'[^'\n]{3,}'|[^\s;,'"]{4,})/giu, group: 1 },

    { id: "iban", category: "finance", severity: "high",
      re: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g, validate: ibanValid },
    { id: "card", category: "finance", severity: "high",
      re: /\b\d(?:[ -]?\d){12,18}\b/g, validate: luhnValid },
    { id: "vat_id", category: "finance", severity: "medium",
      re: /\b(?:IT\s?(\d{11})|DE\s?\d{9}|ATU\s?\d{8}|CHE[- ]?\d{3}\.?\d{3}\.?\d{3}|FR\s?[0-9A-HJ-NP-Z]{2}\s?\d{3}\s?\d{3}\s?\d{3}|ES\s?[A-Z0-9]\d{7}[A-Z0-9]|NL\s?\d{9}B\d{2}|PL\s?\d{10}|PT\s?\d{9}|SE\s?\d{10}01)\b/g,
      validate: (m, g) => (g && g[1] ? partitaIvaValid(g[1]) : true) },

    { id: "email", category: "personal", severity: "medium",
      re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { id: "phone", category: "personal", severity: "medium",
      re: /(?<![\w+])(?:\+|00)(?:351|420|39|49|43|41|33|44|34|31|32|48|46|45|47|1)[\s./-]?\(?\d{1,4}\)?(?:[\s./-]?\d{2,4}){2,4}(?!\w)/g },
    { id: "codice_fiscale", category: "personal", severity: "medium",
      re: /\b[A-Za-z]{6}[0-9LMNPQRSTUVlmnpqrstuv]{2}[A-Za-z][0-9LMNPQRSTUVlmnpqrstuv]{2}[A-Za-z][0-9LMNPQRSTUVlmnpqrstuv]{3}[A-Za-z]\b/g,
      validate: codiceFiscaleValid },
    { id: "dni", category: "personal", severity: "medium",
      re: /\b(?:[XYZxyz][- ]?)?\d{7,8}[- ]?[A-Za-z]\b/g, validate: dniValid },
    { id: "nir", category: "personal", severity: "medium",
      re: /\b[12]\s?\d{2}\s?\d{2}\s?(?:\d{2}|2[ABab])\s?\d{3}\s?\d{3}\s?\d{2}\b/g, validate: nirValid },
    { id: "bsn", category: "personal", severity: "medium",
      re: /\b\d{4}[. ]?\d{2}[. ]?\d{3}\b/g, validate: bsnValid,
      context: b => /\b(?:bsn|burgerservicenummer|sofinummer|sofi-nummer)\b/i.test(b) },
    { id: "pesel", category: "personal", severity: "medium",
      re: /\b\d{11}\b/g, validate: peselValid,
      context: b => /pesel/i.test(b) },
    { id: "nif_pt", category: "personal", severity: "medium",
      re: /\b[1235689]\d{2}[ ]?\d{3}[ ]?\d{3}\b/g, validate: nifPtValid,
      context: b => /\b(?:nif|contribuinte|n\.?º?\s?fiscal|n[úu]mero fiscal)\b/i.test(b) },
    { id: "personnummer", category: "personal", severity: "medium",
      re: /\b(?:19|20)?\d{6}[-+ ]?\d{4}\b/g, validate: personnummerValid,
      context: (b, m) => /\d{6}[-+]\d{4}$/.test(m) || /person(?:nummer|nr)|\bpnr\b|samordningsnummer/i.test(b) },

    { id: "internal_ip", category: "internal", severity: "medium",
      re: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g },
    { id: "internal_host", category: "internal", severity: "medium",
      re: /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:local|lan|corp|intranet|internal)\b/gi },

    { id: "label", category: "labels", severity: "info", mask: false,
      re: /(?<![\p{L}])(?:streng vertraulich|vertraulich|nur für den internen gebrauch|nur intern|strictly confidential|confidential|internal use only|do not distribute|strettamente riservato|riservato|uso interno|non divulgare|strictement confidentiel|confidentiel|diffusion restreinte|usage interne|ne pas diffuser|estrictamente confidencial|confidencial|uso restringido|no difundir|strikt vertrouwelijk|vertrouwelijk|alleen voor intern gebruik|ściśle poufne|poufne|tajemnica przedsiębiorstwa|do użytku wewnętrznego|estritamente confidencial|não divulgar|strikt konfidentiell|konfidentiell|sekretess|endast för internt bruk)(?![\p{L}])/giu },
  ];

  const CATEGORIES = ["secrets", "finance", "personal", "internal", "labels", "custom"];

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /**
   * detect(text, opts) -> findings sorted by position, overlaps removed.
   * opts: { disabled: string[] (categories), customTerms: string[], allowValues: Set<string> }
   */
  function detect(text, opts) {
    opts = opts || {};
    const disabled = new Set(opts.disabled || []);
    const allow = opts.allowValues || new Set();
    const found = [];
    if (!text) return found;

    for (const rule of RULES) {
      if (disabled.has(rule.category)) continue;
      const re = new RegExp(rule.re.source, rule.re.flags.includes("d") ? rule.re.flags : rule.re.flags + "d");
      let m;
      while ((m = re.exec(text))) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        const g = rule.group;
        const start = g ? m.indices[g][0] : m.index;
        const end = g ? m.indices[g][1] : m.index + m[0].length;
        const value = text.slice(start, end);
        if (rule.validate && !rule.validate(m[0], m)) continue;
        if (rule.context && !rule.context(text.slice(Math.max(0, start - 40), start), m[0])) continue;
        if (allow.has(value)) continue;
        found.push({ type: rule.id, category: rule.category, severity: rule.severity, start, end, value, mask: rule.mask !== false });
      }
    }

    if (!disabled.has("custom")) {
      for (const term of (opts.customTerms || [])) {
        const t = String(term).trim();
        if (t.length < 2) continue;
        const re = new RegExp("(?<![\\p{L}\\p{N}])" + escapeRe(t) + "(?![\\p{L}\\p{N}])", "giu");
        let m;
        while ((m = re.exec(text))) {
          if (allow.has(m[0])) continue;
          found.push({ type: "custom_term", category: "custom", severity: "high", start: m.index, end: m.index + m[0].length, value: m[0], mask: true });
        }
      }
    }

    // Remove overlaps: prefer higher severity, then longer match.
    const rank = { high: 3, medium: 2, info: 1 };
    found.sort((a, b) => (rank[b.severity] - rank[a.severity]) || ((b.end - b.start) - (a.end - a.start)) || (a.start - b.start));
    const kept = [];
    for (const f of found) {
      if (!kept.some(k => f.start < k.end && k.start < f.end)) kept.push(f);
    }
    return kept.sort((a, b) => a.start - b.start);
  }

  /** Replace maskable findings with stable placeholders like [EMAIL_1]. */
  function mask(text, findings) {
    const ids = new Map();
    const counters = {};
    let out = "", pos = 0;
    for (const f of findings) {
      if (!f.mask) continue;
      const key = f.type + "\u0000" + f.value.toLowerCase();
      if (!ids.has(key)) {
        counters[f.type] = (counters[f.type] || 0) + 1;
        ids.set(key, "[" + f.type.toUpperCase() + "_" + counters[f.type] + "]");
      }
      out += text.slice(pos, f.start) + ids.get(key);
      pos = f.end;
    }
    return out + text.slice(pos);
  }

  /** Short preview that never shows the full secret. */
  function preview(value) {
    const v = value.replace(/\s+/g, " ").trim();
    if (v.length <= 6) return v[0] + "•••";
    if (v.length > 40) return v.slice(0, 4) + " ••• " + v.slice(-3);
    return v.slice(0, 3) + "•••" + v.slice(-2);
  }

  const api = { detect, mask, preview, RULES, CATEGORIES, _v: { ibanValid, luhnValid, codiceFiscaleValid, partitaIvaValid, dniValid, nirValid, bsnValid, peselValid, nifPtValid, personnummerValid } };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ALG = api;
})(typeof self !== "undefined" ? self : this);
