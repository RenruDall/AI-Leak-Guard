# AI Leak Guard 

A Chrome and Edge extension that warns people before they paste or send confidential data to AI chat tools. Every check runs in the browser. No text is uploaded or stored; only counters (warnings, masked, stopped) are kept locally.

## Install (developer mode)

1. Download the zip from the latest GitHub release (or build it with `npm run build`) and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and pick the `ai-leak-guard` folder.
5. Open ChatGPT, Copilot, Gemini or Claude and paste something like
   `Please pay DE89 3704 0044 0532 0130 00, contact mario.rossi@example.it`.<br>
   
   <img alt="image" src="https://github.com/user-attachments/assets/e28a6fcc-4963-47ec-9c9b-7f0776567015" />
   


## What it does

- **Paste check:** when you paste into a chat box, it checks the text first. You can paste with placeholders (`[EMAIL_1]`, `[IBAN_1]`), paste anyway, or cancel.
- **Send check:** pressing Enter or the send button checks what you typed. "Allow and send" remembers your choice for that tab; press Enter again to send.
- **Languages:** English, German, Italian, French, Spanish, Dutch, Polish, Portuguese and Swedish (follows the browser language, or set it in Settings).

Sites covered: ChatGPT, Claude, Gemini, Copilot, Microsoft 365 Copilot, Perplexity, Le Chat (Mistral), DeepSeek, Grok, Meta AI.

## What it detects

| Category | Examples | How |
|---|---|---|
| Passwords and keys | values after `password`, `Passwort`, `mot de passe`, `contraseña`, `wachtwoord`, `hasło`, `senha`, `lösenord` …, private keys, AWS, GitHub, OpenAI/Anthropic, Slack, Google and Azure keys, SAS signatures, JWTs | Patterns |
| Bank and payment data | IBAN, credit card, VAT numbers for IT, DE, AT, CH, FR, ES, NL, PL, PT, SE | Patterns plus checksum validation (IBAN mod-97, Luhn, partita IVA) |
| Personal data | Email, international phone numbers, Italian codice fiscale, Spanish DNI/NIE, French NIR, Dutch BSN, Polish PESEL, Portuguese NIF, Swedish personnummer | Patterns plus checksums for each ID. BSN, PESEL and NIF also need a keyword nearby ("BSN", "PESEL", "NIF"), because plain 9- or 11-digit numbers are common |
| Internal network | Private IP ranges, `*.local`, `*.corp`, `*.intranet` hosts | Patterns |
| Confidentiality labels | vertraulich, confidential, riservato, confidentiel, confidencial, vertrouwelijk, poufne, konfidentiell, … | Word list (warns, not masked) |
| Protected terms | Your customer names, project code names | Your own list in Settings |

Checksums keep false alarms low: a random 16-digit order number is not flagged as a card.

## For companies (Intune / Group Policy)

The extension reads an organisation policy through Chrome's managed storage (`schema.json`):

- `customTerms`: company-wide protected terms
- `allowSendAnyway`: `false` removes the "send anyway" button
- `forceEnabled`: users cannot switch it off
- `lockedCategories`: categories users cannot disable

Example policy for the extension (Chrome `3rdparty` / Edge `3rdparty` policy, set via Intune or GPO once the extension has a store ID):

```json
{
  "customTerms": ["Müller AG", "Projekt Alpenblick"],
  "allowSendAnyway": false,
  "forceEnabled": true,
  "lockedCategories": ["secrets", "finance"]
}
```

## Known limits of 0.3

- **Names of people and companies are not detected automatically** unless they are in your protected terms. The next step is a small on-device language model (for example with Transformers.js) for names and addresses.
- File uploads (PDF, Word) are not checked yet; only pasted and typed text.
- Send-button detection relies on the button's label; if a site changes its design, the Enter-key check still works.
- It is a safety net for honest mistakes, not a hard security boundary: a determined user can switch browsers.

## Development

Requires Node.js 20 or newer.

```
npm install                            # installs Playwright for the browser tests
npm test                               # detection rules and publish scripts
npx playwright install chromium        # once
npm run test:e2e                       # loads the extension in Chromium and tests paste, send, settings, 9 languages
npm run build                          # dist/ai-leak-guard-<version>.zip, contains only extension files
```

## Releases

Releases are automatic: bump the version, tag, push. GitHub Actions tests, builds, creates a GitHub release and submits to the Chrome Web Store and Edge Add-ons. One-time setup and company rollout (Intune): see [docs/DEPLOY.md](docs/DEPLOY.md).

## Project layout

```
.github/workflows/   CI on every push, release on version tags
docs/DEPLOY.md       Store setup, credentials, company rollout
scripts/             Build, version bump and store publish scripts (no dependencies)
test/                Unit, publish-script and browser tests
manifest.json        Extension manifest (MV3)
schema.json          Organisation policy schema
src/detectors.js     Detection engine and masking
src/content.js       Paste and send interception, warning dialog
src/i18n.js          Interface strings in 9 languages
src/settings.js      User settings merged with organisation policy
popup/               Toolbar popup (on/off, counters)
options/             Settings page with a live "try it" box
_locales/            Store name and description in en/de/it/fr/es/nl/pl/pt/sv
```

## Translations

The French, Spanish, Dutch, Polish, Portuguese and Swedish texts were written without a native-speaker review. Have each language checked once before publishing to the stores.
