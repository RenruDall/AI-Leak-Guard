const L = {
  en: { on: "Protection on", warn: "warnings", mask: "masked", cancel: "stopped", local: "Counts only. Your text is never stored.", opts: "Settings and protected terms", managed: "Managed by your organisation" },
  de: { on: "Schutz aktiv", warn: "Warnungen", mask: "maskiert", cancel: "gestoppt", local: "Nur Zähler. Dein Text wird nie gespeichert.", opts: "Einstellungen und geschützte Begriffe", managed: "Von deiner Organisation verwaltet" },
  it: { on: "Protezione attiva", warn: "avvisi", mask: "mascherati", cancel: "fermati", local: "Solo contatori. Il tuo testo non viene mai salvato.", opts: "Impostazioni e termini protetti", managed: "Gestito dalla tua organizzazione" },
  fr: { on: "Protection active", warn: "alertes", mask: "masqués", cancel: "bloqués", local: "Compteurs uniquement. Votre texte n'est jamais enregistré.", opts: "Paramètres et termes protégés", managed: "Géré par votre organisation" },
  es: { on: "Protección activa", warn: "avisos", mask: "enmascarados", cancel: "detenidos", local: "Solo contadores. Tu texto nunca se guarda.", opts: "Ajustes y términos protegidos", managed: "Gestionado por tu organización" },
  nl: { on: "Bescherming aan", warn: "waarschuwingen", mask: "gemaskeerd", cancel: "gestopt", local: "Alleen tellers. Je tekst wordt nooit opgeslagen.", opts: "Instellingen en beschermde termen", managed: "Beheerd door je organisatie" },
  pl: { on: "Ochrona włączona", warn: "ostrzeżenia", mask: "zamaskowane", cancel: "zatrzymane", local: "Tylko liczniki. Twój tekst nigdy nie jest zapisywany.", opts: "Ustawienia i chronione terminy", managed: "Zarządzane przez Twoją organizację" },
  pt: { on: "Proteção ativa", warn: "avisos", mask: "mascarados", cancel: "parados", local: "Apenas contadores. O seu texto nunca é guardado.", opts: "Definições e termos protegidos", managed: "Gerido pela sua organização" },
  sv: { on: "Skydd på", warn: "varningar", mask: "maskerade", cancel: "stoppade", local: "Bara räknare. Din text sparas aldrig.", opts: "Inställningar och skyddade termer", managed: "Hanteras av din organisation" }
};
const $ = id => document.getElementById(id);

function paint(lang) {
  const t = L[ALG_I18N.pickLang(lang)];
  $("enabledLbl").textContent = t.on;
  $("l-warn").textContent = t.warn; $("l-mask").textContent = t.mask; $("l-cancel").textContent = t.cancel;
  $("local").textContent = t.local; $("opts").textContent = t.opts;
  return t;
}

// Draw immediately with defaults, then refine once stored settings arrive.
paint("auto");
$("enabled").checked = true;
chrome.storage.local.get({ stats: {} }, v => {
  const st = v.stats || {};
  $("s-warn").textContent = st.warnings || 0;
  $("s-mask").textContent = st.masked || 0;
  $("s-cancel").textContent = st.cancelled || 0;
});
chrome.storage.sync.get({ enabled: true, lang: "auto" }, v => { paint(v.lang); $("enabled").checked = v.enabled !== false; });
$("enabled").addEventListener("change", e => ALG_SETTINGS.save({ enabled: e.target.checked }));
$("opts").addEventListener("click", () => chrome.runtime.openOptionsPage());

ALG_SETTINGS.load().then(s => {
  const t = paint(s.lang);
  $("enabled").checked = s.enabled;
  if (s.managed) { $("managed").hidden = false; $("managed").textContent = t.managed; }
  if (s.managed && s.managed.forceEnabled) $("enabled").disabled = true;
});
