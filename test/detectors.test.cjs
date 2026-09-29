const assert = require("assert");
const { detect, mask, _v } = require("../src/detectors.js");

const types = t => detect(t).map(f => f.type);
let n = 0;
function ok(name, fn) { fn(); n++; console.log("ok  " + name); }

ok("validators", () => {
  assert(_v.ibanValid("DE89 3704 0044 0532 0130 00"));
  assert(_v.ibanValid("IT60X0542811101000000123456"));
  assert(!_v.ibanValid("DE89 3704 0044 0532 0130 01"));
  assert(_v.luhnValid("4111 1111 1111 1111"));
  assert(!_v.luhnValid("4111 1111 1111 1112"));
  assert(_v.codiceFiscaleValid("RSSMRA85T10A562S"));
  assert(!_v.codiceFiscaleValid("RSSMRA85T10A562T"));
  assert(_v.partitaIvaValid("00743110157"));
});

ok("finance", () => {
  assert.deepStrictEqual(types("Bitte überweisen auf DE89 3704 0044 0532 0130 00 danke"), ["iban"]);
  assert.deepStrictEqual(types("Karte 4111 1111 1111 1111 gültig"), ["card"]);
  assert.deepStrictEqual(types("Order 4111 1111 1111 1112"), []);
  assert.deepStrictEqual(types("P.IVA IT00743110157"), ["vat_id"]);
});

ok("secrets", () => {
  assert.deepStrictEqual(types("key AKIAIOSFODNN7EXAMPLE here"), ["aws_key"]);
  assert.deepStrictEqual(types("export OPENAI=sk-proj-abcdefghijklmnopqrstuvwxyz123456"), ["ai_api_key"]);
  const pw = detect("db password: Winter2026! ok");
  assert.strictEqual(pw[0].type, "password");
  assert.strictEqual(pw[0].value, "Winter2026!");
  assert.deepStrictEqual(types("-----BEGIN RSA PRIVATE KEY-----\nMIIabc\n-----END RSA PRIVATE KEY-----"), ["private_key"]);
  assert(types("DefaultEndpointsProtocol=https;AccountName=x;AccountKey=abcdefghijklmnopqrstuvwxyzABCDEFGHIJ0123456789==").includes("azure_key"));
});

ok("personal and internal", () => {
  assert.deepStrictEqual(types("Mail an mario.rossi@example.it"), ["email"]);
  assert.deepStrictEqual(types("Tel. +39 0473 123 456"), ["phone"]);
  assert.deepStrictEqual(types("CF RSSMRA85T10A562S"), ["codice_fiscale"]);
  assert.deepStrictEqual(types("Server 192.168.10.25 und sql01.corp"), ["internal_ip", "internal_host"]);
  assert.deepStrictEqual(types("Version 10.2.3 released on 2026-09-28"), []);
});

ok("labels and custom terms", () => {
  assert.deepStrictEqual(types("STRENG VERTRAULICH – Angebot"), ["label"]);
  assert.deepStrictEqual(types("Documento riservato"), ["label"]);
  const f = detect("Projekt Alpenblick für Kunde Müller AG", { customTerms: ["Alpenblick", "Müller AG"] });
  assert.deepStrictEqual(f.map(x => x.value), ["Alpenblick", "Müller AG"]);
  assert.deepStrictEqual(detect("Alpenblicke", { customTerms: ["Alpenblick"] }), []);
});

ok("options", () => {
  assert.deepStrictEqual(detect("mario@example.com", { disabled: ["personal"] }), []);
  assert.deepStrictEqual(detect("mario@example.com", { allowValues: new Set(["mario@example.com"]) }), []);
});

ok("mask", () => {
  const t = "Mail mario@x.it und mario@x.it, IBAN DE89370400440532013000. VERTRAULICH";
  assert.strictEqual(mask(t, detect(t)), "Mail [EMAIL_1] und [EMAIL_1], IBAN [IBAN_1]. VERTRAULICH");
  const p = "password=hunter22 ok";
  assert.strictEqual(mask(p, detect(p)), "password=[PASSWORD_1] ok");
});

ok("french and spanish", () => {
  assert(_v.dniValid("12345678Z")); assert(!_v.dniValid("12345678A"));
  assert(_v.dniValid("X1234567L")); assert(!_v.dniValid("X1234567T"));
  assert(_v.nirValid("1 85 05 78 006 084 91")); assert(!_v.nirValid("1 85 05 78 006 084 92"));
  assert.deepStrictEqual(types("Mi DNI es 12345678Z, gracias"), ["dni"]);
  assert.deepStrictEqual(types("NIE X-1234567-L"), ["dni"]);
  const d = "con DNI 12345678Z, gracias";
  assert.strictEqual(mask(d, detect(d)), "con DNI [DNI_1], gracias");
  assert.deepStrictEqual(types("N° sécu 1 85 05 78 006 084 91"), ["nir"]);
  assert.deepStrictEqual(types("Référence 1 85 05 78 006 084 92"), []);
  const pw = detect("mot de passe : Soleil2026!");
  assert.strictEqual(pw[0].type, "password"); assert.strictEqual(pw[0].value, "Soleil2026!");
  assert.strictEqual(detect("contraseña=Verano2026")[0].value, "Verano2026");
  assert.deepStrictEqual(types("Document STRICTEMENT CONFIDENTIEL"), ["label"]);
  assert.deepStrictEqual(types("Informe confidencial para dirección"), ["label"]);
  assert.deepStrictEqual(types("TVA FR40 303 265 045"), ["vat_id"]);
  assert.deepStrictEqual(types("CIF ESB12345678"), ["vat_id"]);
  assert.deepStrictEqual(types("IBAN FR76 3000 6000 0112 3456 7890 189"), ["iban"]);
  assert.deepStrictEqual(types("Llama al +34 612 345 678"), ["phone"]);
});

ok("dutch, polish, portuguese, swedish IDs", () => {
  assert(_v.bsnValid("111222333")); assert(!_v.bsnValid("111222334"));
  assert(_v.peselValid("44051401359")); assert(!_v.peselValid("44051401358"));
  assert(_v.nifPtValid("123456789")); assert(!_v.nifPtValid("123456780"));
  assert(_v.personnummerValid("811228-9874")); assert(!_v.personnummerValid("811228-9875"));
  assert(_v.personnummerValid("19811228-9874"));
  assert.deepStrictEqual(types("Mijn BSN is 111222333."), ["bsn"]);
  assert.deepStrictEqual(types("Ordernummer 111222333"), [], "BSN needs a keyword nearby");
  assert.deepStrictEqual(types("PESEL: 44051401359"), ["pesel"]);
  assert.deepStrictEqual(types("Numer zamówienia 44051401359"), []);
  assert.deepStrictEqual(types("NIF 123 456 789"), ["nif_pt"]);
  assert.deepStrictEqual(types("Encomenda 123456789"), []);
  assert.deepStrictEqual(types("Personnummer 811228-9874"), ["personnummer"]);
  assert.deepStrictEqual(types("Kund 811228-9874 ringde"), ["personnummer"], "dash format is enough");
  assert.deepStrictEqual(types("Artikel 8112289874"), []);
});

ok("dutch, polish, portuguese, swedish words and VAT", () => {
  assert.strictEqual(detect("wachtwoord: Zomer2026!")[0].value, "Zomer2026!");
  assert.strictEqual(detect("hasło=Lato2026")[0].value, "Lato2026");
  assert.strictEqual(detect("senha: Verao2026")[0].value, "Verao2026");
  assert.strictEqual(detect("lösenord: Sommar2026")[0].value, "Sommar2026");
  assert.deepStrictEqual(types("STRIKT VERTROUWELIJK"), ["label"]);
  assert.deepStrictEqual(types("Dokument ściśle poufne"), ["label"]);
  assert.deepStrictEqual(types("Relatório estritamente confidencial"), ["label"]);
  assert.deepStrictEqual(types("Konfidentiell rapport"), ["label"]);
  assert.deepStrictEqual(types("Sekretessavtal skickat"), [], "word boundary");
  assert.deepStrictEqual(types("btw NL123456789B01"), ["vat_id"]);
  assert.deepStrictEqual(types("NIP PL1234567890"), ["vat_id"]);
  assert.deepStrictEqual(types("IBAN NL91 ABNA 0417 1643 00"), ["iban"]);
  assert.deepStrictEqual(types("IBAN PL61 1090 1014 0000 0712 1981 2874"), ["iban"]);
  assert.deepStrictEqual(types("Bel +31 6 12345678"), ["phone"]);
  assert.deepStrictEqual(types("Zadzwoń +48 601 234 567"), ["phone"]);
  assert.deepStrictEqual(types("Ligue +351 912 345 678"), ["phone"]);
});

ok("plain dutch, polish, portuguese, swedish text has no findings", () => {
  assert.deepStrictEqual(types("Kun je dit rapport samenvatten in 5 punten? Budget 12.000 EUR, levering in week 42."), []);
  assert.deepStrictEqual(types("Czy możesz napisać uprzejmego maila do klienta? Zamówienie 250 sztuk, dostawa w 3 tygodnie."), []);
  assert.deepStrictEqual(types("Pode resumir este relatório em 5 pontos? Orçamento de 12 000 EUR para 2027."), []);
  assert.deepStrictEqual(types("Kan du sammanfatta rapporten i 5 punkter? Budget 120 000 SEK, leverans vecka 42."), []);
});

ok("plain french and spanish text has no findings", () => {
  assert.deepStrictEqual(types("Peux-tu résumer ce rapport en 5 points ? Le budget est de 12 000 EUR pour 2027."), []);
  assert.deepStrictEqual(types("¿Puedes redactar un correo amable para un cliente? Entrega en 3 semanas, 450 unidades."), []);
});

ok("plain text has no findings", () => {
  const t = "Kannst du mir helfen, eine freundliche E-Mail an einen Kunden zu formulieren? Wir haben 3 Angebote, Preis 12.500 EUR, Lieferung in 4 Wochen.";
  assert.deepStrictEqual(types(t), []);
});

console.log(`\n${n} test groups passed`);
