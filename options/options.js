// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
const OL = {
  en: { intro: "AI Leak Guard checks text you paste or send to AI chat tools. Everything is checked on this device; nothing is uploaded.", lang: "Language", cats: "What to check", terms: "Protected terms", termsHint: "One per line: customer names, project code names, product names. Matching is case-insensitive.", orgTerms: "{n} more terms are set by your organisation.", save: "Save", saved: "Saved", managed: "Some settings are managed by your organisation.", tryIt: "Try it", tryPh: "Paste any text here to see what would be detected.", none: "Nothing detected." },
  de: { intro: "AI Leak Guard prüft Text, den du in KI-Chats einfügst oder sendest. Alles wird auf diesem Gerät geprüft; nichts wird hochgeladen.", lang: "Sprache", cats: "Was geprüft wird", terms: "Geschützte Begriffe", termsHint: "Einer pro Zeile: Kundennamen, Projektnamen, Produktnamen. Groß-/Kleinschreibung egal.", orgTerms: "{n} weitere Begriffe legt deine Organisation fest.", save: "Speichern", saved: "Gespeichert", managed: "Einige Einstellungen werden von deiner Organisation verwaltet.", tryIt: "Ausprobieren", tryPh: "Füge hier Text ein, um zu sehen, was erkannt würde.", none: "Nichts erkannt." },
  it: { intro: "AI Leak Guard controlla il testo che incolli o invii alle chat IA. Il controllo avviene su questo dispositivo; nulla viene caricato.", lang: "Lingua", cats: "Cosa controllare", terms: "Termini protetti", termsHint: "Uno per riga: nomi di clienti, progetti, prodotti. Maiuscole e minuscole non contano.", orgTerms: "Altri {n} termini sono impostati dalla tua organizzazione.", save: "Salva", saved: "Salvato", managed: "Alcune impostazioni sono gestite dalla tua organizzazione.", tryIt: "Prova", tryPh: "Incolla qui un testo per vedere cosa verrebbe rilevato.", none: "Nessun dato rilevato." },
  fr: { intro: "AI Leak Guard vérifie le texte que vous collez ou envoyez aux chats d'IA. Tout est vérifié sur cet appareil ; rien n'est envoyé.", lang: "Langue", cats: "Ce qui est vérifié", terms: "Termes protégés", termsHint: "Un par ligne : noms de clients, noms de projets, noms de produits. Majuscules et minuscules sans importance.", orgTerms: "{n} autres termes sont définis par votre organisation.", save: "Enregistrer", saved: "Enregistré", managed: "Certains paramètres sont gérés par votre organisation.", tryIt: "Essayer", tryPh: "Collez un texte ici pour voir ce qui serait détecté.", none: "Rien de détecté." },
  es: { intro: "AI Leak Guard comprueba el texto que pegas o envías a los chats de IA. Todo se comprueba en este dispositivo; no se sube nada.", lang: "Idioma", cats: "Qué se comprueba", terms: "Términos protegidos", termsHint: "Uno por línea: nombres de clientes, proyectos o productos. No distingue mayúsculas y minúsculas.", orgTerms: "Tu organización define otros {n} términos.", save: "Guardar", saved: "Guardado", managed: "Tu organización gestiona algunos ajustes.", tryIt: "Probar", tryPh: "Pega aquí un texto para ver qué se detectaría.", none: "No se ha detectado nada." },
  nl: { intro: "AI Leak Guard controleert tekst die je in AI-chats plakt of verzendt. Alles wordt op dit apparaat gecontroleerd; er wordt niets geüpload.", lang: "Taal", cats: "Wat wordt gecontroleerd", terms: "Beschermde termen", termsHint: "Eén per regel: klantnamen, projectnamen, productnamen. Hoofdletters maken niet uit.", orgTerms: "Nog {n} termen zijn ingesteld door je organisatie.", save: "Opslaan", saved: "Opgeslagen", managed: "Sommige instellingen worden beheerd door je organisatie.", tryIt: "Uitproberen", tryPh: "Plak hier tekst om te zien wat er zou worden herkend.", none: "Niets gevonden." },
  pl: { intro: "AI Leak Guard sprawdza tekst, który wklejasz lub wysyłasz do czatów AI. Wszystko jest sprawdzane na tym urządzeniu; nic nie jest przesyłane.", lang: "Język", cats: "Co jest sprawdzane", terms: "Chronione terminy", termsHint: "Jeden w wierszu: nazwy klientów, projektów, produktów. Wielkość liter nie ma znaczenia.", orgTerms: "Terminy ustawione przez Twoją organizację: {n}.", save: "Zapisz", saved: "Zapisano", managed: "Niektóre ustawienia są zarządzane przez Twoją organizację.", tryIt: "Wypróbuj", tryPh: "Wklej tutaj tekst, aby zobaczyć, co zostałoby wykryte.", none: "Nic nie wykryto." },
  pt: { intro: "O AI Leak Guard verifica o texto que cola ou envia para chats de IA. Tudo é verificado neste dispositivo; nada é carregado.", lang: "Idioma", cats: "O que é verificado", terms: "Termos protegidos", termsHint: "Um por linha: nomes de clientes, projetos, produtos. Não distingue maiúsculas de minúsculas.", orgTerms: "A sua organização definiu mais {n} termos.", save: "Guardar", saved: "Guardado", managed: "Algumas definições são geridas pela sua organização.", tryIt: "Experimentar", tryPh: "Cole aqui um texto para ver o que seria detetado.", none: "Nada detetado." },
  sv: { intro: "AI Leak Guard kontrollerar text som du klistrar in eller skickar till AI-chattar. Allt kontrolleras på den här enheten; inget laddas upp.", lang: "Språk", cats: "Vad som kontrolleras", terms: "Skyddade termer", termsHint: "En per rad: kundnamn, projektnamn, produktnamn. Skiftläget spelar ingen roll.", orgTerms: "Ytterligare {n} termer har angetts av din organisation.", save: "Spara", saved: "Sparat", managed: "Vissa inställningar hanteras av din organisation.", tryIt: "Prova", tryPh: "Klistra in text här för att se vad som skulle upptäckas.", none: "Inget upptäcktes." }
};
const $ = id => document.getElementById(id);

async function render() {
  const s = await ALG_SETTINGS.load();
  const T = ALG_I18N.t(s.lang);
  const t = OL[ALG_I18N.pickLang(s.lang)];
  const locked = (s.managed && s.managed.lockedCategories) || [];
  $("intro").textContent = t.intro;
  $("h-lang").textContent = t.lang; $("h-cats").textContent = t.cats; $("h-terms").textContent = t.terms;
  $("termsHint").textContent = t.termsHint; $("save").textContent = t.save; $("h-try").textContent = t.tryIt;
  $("try").placeholder = t.tryPh;
  $("lang").value = s.user.lang || "auto";
  if (s.managed) { $("managed").hidden = false; $("managed").textContent = t.managed; }
  const orgN = ((s.managed && s.managed.customTerms) || []).length;
  $("orgTerms").hidden = !orgN; $("orgTerms").textContent = t.orgTerms.replace("{n}", orgN);
  $("terms").value = (s.user.customTerms || []).join("\n");
  $("cats").innerHTML = "";
  for (const c of ALG.CATEGORIES) {
    const id = "cat-" + c;
    const lab = document.createElement("label");
    lab.innerHTML = `<input type="checkbox" id="${id}" data-cat="${c}"> <span></span>`;
    lab.querySelector("span").textContent = T.cats[c];
    const box = lab.querySelector("input");
    box.checked = !(s.user.disabled || []).includes(c) || locked.includes(c);
    box.disabled = locked.includes(c);
    $("cats").appendChild(lab);
  }
  runTry();
}

async function runTry() {
  const s = await ALG_SETTINGS.load();
  const T = ALG_I18N.t(s.lang);
  const t = OL[ALG_I18N.pickLang(s.lang)];
  const text = $("try").value;
  const out = $("tryOut");
  out.innerHTML = "";
  if (!text.trim()) return;
  const f = ALG.detect(text, { disabled: s.disabled, customTerms: s.customTerms });
  if (!f.length) { const li = document.createElement("li"); li.textContent = t.none; out.appendChild(li); return; }
  for (const x of f) {
    const li = document.createElement("li");
    li.className = x.severity;
    const b = document.createElement("b"); b.textContent = T.types[x.type] || x.type;
    const c = document.createElement("code"); c.textContent = ALG.preview(x.value);
    li.append(b, c); out.appendChild(li);
  }
  const m = document.createElement("li"); m.className = "masked";
  m.textContent = ALG.mask(text, f); out.appendChild(m);
}

$("save").addEventListener("click", async () => {
  const disabled = [...document.querySelectorAll("[data-cat]")].filter(b => !b.checked && !b.disabled).map(b => b.dataset.cat);
  const customTerms = [...new Set($("terms").value.split("\n").map(x => x.trim()).filter(x => x.length >= 2))].slice(0, 500);
  await ALG_SETTINGS.save({ lang: $("lang").value, disabled, customTerms });
  const s = await ALG_SETTINGS.load();
  $("saved").textContent = OL[ALG_I18N.pickLang(s.lang)].saved;
  setTimeout(() => ($("saved").textContent = ""), 1800);
  render();
});
let tm;
$("try").addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(runTry, 200); });
render();

try { document.getElementById("ver").textContent = "AI Leak Guard " + chrome.runtime.getManifest().version; } catch (e) {}
