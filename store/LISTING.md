# Store listing: Chrome Web Store and Edge Add-ons

Everything the store forms ask for, ready to copy. The package to upload is the zip from the [latest GitHub release](https://github.com/RenruDall/AI-Leak-Guard/releases/latest).

## Basics

| Field | Value |
|---|---|
| Name | AI Leak Guard (taken from `_locales`, 9 languages) |
| Short description | Taken from `_locales/*/messages.json` (`extDesc`) |
| Category | Chrome: **Privacy & Security** (if not offered: Productivity › Tools). Edge: **Productivity** |
| Language | English as default; the store also shows the translated name and short description |
| Icon | `icons/icon128.png` |
| Screenshots (1280×800) | `store/images/1-warning-*.png`, `2-masked-*.png`, `3-settings-*.png`, `4-popup-*.png` (en, de, it) |
| Small promo tile (440×280) | `store/images/promo-440x280.png` |
| Privacy policy URL | https://github.com/RenruDall/AI-Leak-Guard/blob/main/docs/PRIVACY.md |
| Support | support@panea.io, or the GitHub issues page |
| Homepage | https://github.com/RenruDall/AI-Leak-Guard |

## Detailed description

### English

AI Leak Guard is a quiet safety net for everyday AI use. Before you paste or send a message to an AI chat, it checks the text for things that shouldn't leave your company: passwords and API keys, IBANs and card numbers, email addresses and phone numbers, national ID numbers, internal server names, and words like "confidential".

If it finds something, you choose what happens:
• Paste with placeholders: [EMAIL_1] and [IBAN_1] keep the meaning without the real data
• Paste anyway
• Cancel

What makes it different:
• Everything is checked on your device. No text is uploaded, stored or shared.
• Checksums keep false alarms low: a random order number is not flagged as a card.
• Add your own protected terms, such as customer names or project code names.
• Works on ChatGPT, Claude, Gemini, Copilot, Microsoft 365 Copilot, Perplexity, Le Chat, DeepSeek, Grok and Meta AI.
• In English, German, Italian, French, Spanish, Dutch, Polish, Portuguese and Swedish.

For companies: IT can install it on every managed browser through Intune or Group Policy, set company-wide protected terms, and decide whether people may send anyway.

AI Leak Guard is a safety net for honest mistakes, not a replacement for your company's security policies.

### Deutsch

AI Leak Guard ist ein unaufdringliches Sicherheitsnetz für die tägliche Arbeit mit KI. Bevor du Text in einen KI-Chat einfügst oder sendest, prüft es ihn auf Dinge, die das Unternehmen nicht verlassen sollten: Passwörter und API-Schlüssel, IBANs und Kartennummern, E-Mail-Adressen und Telefonnummern, Ausweis- und Steuernummern, interne Servernamen und Wörter wie „vertraulich".

Findet es etwas, entscheidest du:
• Mit Platzhaltern einfügen: [EMAIL_1] und [IBAN_1] behalten den Sinn ohne die echten Daten
• Trotzdem einfügen
• Abbrechen

Was es auszeichnet:
• Alles wird auf deinem Gerät geprüft. Kein Text wird hochgeladen, gespeichert oder weitergegeben.
• Prüfsummen halten Fehlalarme gering: Eine zufällige Bestellnummer gilt nicht als Kartennummer.
• Eigene geschützte Begriffe wie Kundennamen oder Projektnamen.
• Funktioniert mit ChatGPT, Claude, Gemini, Copilot, Microsoft 365 Copilot, Perplexity, Le Chat, DeepSeek, Grok und Meta AI.
• Auf Deutsch, Englisch, Italienisch, Französisch, Spanisch, Niederländisch, Polnisch, Portugiesisch und Schwedisch.

Für Unternehmen: Die IT kann die Erweiterung über Intune oder Gruppenrichtlinien auf allen verwalteten Browsern installieren, unternehmensweite Begriffe festlegen und bestimmen, ob trotzdem gesendet werden darf.

AI Leak Guard ist ein Sicherheitsnetz für ehrliche Fehler, kein Ersatz für die Sicherheitsrichtlinien deines Unternehmens.

### Italiano

AI Leak Guard è una rete di sicurezza discreta per l'uso quotidiano dell'IA. Prima che tu incolli o invii un testo a una chat IA, controlla se contiene dati che non dovrebbero uscire dall'azienda: password e chiavi API, IBAN e numeri di carta, indirizzi email e numeri di telefono, codici fiscali e documenti, nomi di server interni e parole come "riservato".

Se trova qualcosa, decidi tu:
• Incolla con segnaposto: [EMAIL_1] e [IBAN_1] mantengono il senso senza i dati reali
• Incolla comunque
• Annulla

Cosa lo rende diverso:
• Tutto viene controllato sul tuo dispositivo. Nessun testo viene caricato, salvato o condiviso.
• I controlli di validità riducono i falsi allarmi: un numero d'ordine qualsiasi non viene scambiato per una carta.
• Puoi aggiungere i tuoi termini protetti, come nomi di clienti o di progetti.
• Funziona con ChatGPT, Claude, Gemini, Copilot, Microsoft 365 Copilot, Perplexity, Le Chat, DeepSeek, Grok e Meta AI.
• In italiano, inglese, tedesco, francese, spagnolo, olandese, polacco, portoghese e svedese.

Per le aziende: l'IT può installarlo su tutti i browser gestiti tramite Intune o Criteri di gruppo, definire termini protetti aziendali e decidere se consentire l'invio comunque.

AI Leak Guard è una rete di sicurezza contro gli errori in buona fede, non un sostituto delle policy di sicurezza aziendali.

## Privacy tab (Chrome Web Store)

**Single purpose**
> Warns the user before confidential information is pasted or sent to AI chat websites, and offers to replace it with placeholders.

**Permission justification**
- `storage`: keeps the user's settings (enabled checks, language, protected terms) and local counters of warnings shown.
- Host access (content scripts on the listed AI chat sites only): needed to check text when it is pasted or sent on those sites. The extension runs nowhere else.

**Remote code:** No. All code is included in the package.

**Data usage:** tick **none** of the data categories. The extension processes the text locally to check it, but does not collect or transmit it. Then confirm all three statements:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Edge Add-ons extras

- **Search terms:** AI privacy, data loss prevention, DLP, ChatGPT, Copilot, IBAN, password, GDPR
- **Notes for certification:** "Open https://chatgpt.com (or the test page in `test/fixtures/chat.html`) and paste: `Please pay DE89 3704 0044 0532 0130 00, contact mario.rossi@example.it`. A warning dialog appears with options to paste with placeholders, paste anyway or cancel. No account is needed."

## Before submitting

- [ ] Have the French, Spanish, Dutch, Polish, Portuguese and Swedish texts checked once by a native speaker (see README).
- [ ] Chrome Web Store developer account (one-time US$5) and Partner Center account for Edge (free).
- [ ] First upload by hand; after that, releases go out automatically (see [docs/DEPLOY.md](../docs/DEPLOY.md)).

Regenerate the screenshots after interface changes: `node store/screenshots.mjs en-US` (and `de-DE`, `it-IT`).
