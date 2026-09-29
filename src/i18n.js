/* UI strings in English, German and Italian. */
(function (root) {
  const S = {
    en: {
      title: "Possible confidential data",
      introPaste: "The text you are pasting into {site} contains:",
      introSend: "Your message to {site} contains:",
      maskPaste: "Paste with placeholders",
      maskSend: "Replace with placeholders",
      anywayPaste: "Paste anyway",
      anywaySend: "Allow and send",
      cancel: "Cancel",
      hintMask: "Placeholders like [EMAIL_1] keep the meaning without the real data.",
      hintSend: "After you choose, press Enter again to send.",
      localOnly: "Checked on this device. Nothing was sent anywhere.",
      policy: "Your organisation does not allow sending this data.",
      types: {
        private_key: "Private key", aws_key: "AWS access key", github_token: "GitHub token", ai_api_key: "AI service API key",
        slack_token: "Slack token", google_api_key: "Google API key", azure_key: "Azure access key", sas_signature: "Access signature (SAS)",
        jwt: "Login token (JWT)", password: "Password", iban: "IBAN", card: "Credit card number", vat_id: "VAT number",
        email: "Email address", phone: "Phone number", codice_fiscale: "Codice fiscale", internal_ip: "Internal IP address",
        internal_host: "Internal server name", label: "Confidentiality label", custom_term: "Protected term"
      },
      cats: { secrets: "Passwords and keys", finance: "Bank and payment data", personal: "Personal data", internal: "Internal network details", labels: "Confidentiality labels", custom: "Your protected terms" }
    },
    de: {
      title: "Möglicherweise vertrauliche Daten",
      introPaste: "Der Text, den du in {site} einfügst, enthält:",
      introSend: "Deine Nachricht an {site} enthält:",
      maskPaste: "Mit Platzhaltern einfügen",
      maskSend: "Durch Platzhalter ersetzen",
      anywayPaste: "Trotzdem einfügen",
      anywaySend: "Erlauben und senden",
      cancel: "Abbrechen",
      hintMask: "Platzhalter wie [EMAIL_1] erhalten den Sinn ohne die echten Daten.",
      hintSend: "Drücke danach erneut Enter zum Senden.",
      localOnly: "Auf diesem Gerät geprüft. Es wurde nichts übertragen.",
      policy: "Deine Organisation erlaubt das Senden dieser Daten nicht.",
      types: {
        private_key: "Privater Schlüssel", aws_key: "AWS-Zugangsschlüssel", github_token: "GitHub-Token", ai_api_key: "API-Schlüssel eines KI-Dienstes",
        slack_token: "Slack-Token", google_api_key: "Google-API-Schlüssel", azure_key: "Azure-Zugangsschlüssel", sas_signature: "Zugriffssignatur (SAS)",
        jwt: "Anmeldetoken (JWT)", password: "Passwort", iban: "IBAN", card: "Kreditkartennummer", vat_id: "USt-IdNr.",
        email: "E-Mail-Adresse", phone: "Telefonnummer", codice_fiscale: "Codice fiscale", internal_ip: "Interne IP-Adresse",
        internal_host: "Interner Servername", label: "Vertraulichkeitsvermerk", custom_term: "Geschützter Begriff"
      },
      cats: { secrets: "Passwörter und Schlüssel", finance: "Bank- und Zahlungsdaten", personal: "Personenbezogene Daten", internal: "Interne Netzwerkdetails", labels: "Vertraulichkeitsvermerke", custom: "Eigene geschützte Begriffe" }
    },
    it: {
      title: "Possibili dati riservati",
      introPaste: "Il testo che stai incollando in {site} contiene:",
      introSend: "Il tuo messaggio a {site} contiene:",
      maskPaste: "Incolla con segnaposto",
      maskSend: "Sostituisci con segnaposto",
      anywayPaste: "Incolla comunque",
      anywaySend: "Consenti e invia",
      cancel: "Annulla",
      hintMask: "I segnaposto come [EMAIL_1] mantengono il senso senza i dati reali.",
      hintSend: "Dopo la scelta, premi di nuovo Invio per inviare.",
      localOnly: "Controllato su questo dispositivo. Nulla è stato inviato.",
      policy: "La tua organizzazione non consente di inviare questi dati.",
      types: {
        private_key: "Chiave privata", aws_key: "Chiave di accesso AWS", github_token: "Token GitHub", ai_api_key: "Chiave API di un servizio IA",
        slack_token: "Token Slack", google_api_key: "Chiave API Google", azure_key: "Chiave di accesso Azure", sas_signature: "Firma di accesso (SAS)",
        jwt: "Token di accesso (JWT)", password: "Password", iban: "IBAN", card: "Numero di carta di credito", vat_id: "Partita IVA",
        email: "Indirizzo e-mail", phone: "Numero di telefono", codice_fiscale: "Codice fiscale", internal_ip: "Indirizzo IP interno",
        internal_host: "Nome server interno", label: "Dicitura di riservatezza", custom_term: "Termine protetto"
      },
      cats: { secrets: "Password e chiavi", finance: "Dati bancari e di pagamento", personal: "Dati personali", internal: "Dettagli della rete interna", labels: "Diciture di riservatezza", custom: "Termini protetti" }
    },
    fr: {
      title: "Données confidentielles possibles",
      introPaste: "Le texte que vous collez dans {site} contient :",
      introSend: "Votre message à {site} contient :",
      maskPaste: "Coller avec des substituts",
      maskSend: "Remplacer par des substituts",
      anywayPaste: "Coller quand même",
      anywaySend: "Autoriser et envoyer",
      cancel: "Annuler",
      hintMask: "Les substituts comme [EMAIL_1] gardent le sens sans les vraies données.",
      hintSend: "Après votre choix, appuyez de nouveau sur Entrée pour envoyer.",
      localOnly: "Vérifié sur cet appareil. Rien n'a été envoyé.",
      policy: "Votre organisation n'autorise pas l'envoi de ces données.",
      types: {
        private_key: "Clé privée", aws_key: "Clé d'accès AWS", github_token: "Jeton GitHub", ai_api_key: "Clé API d'un service d'IA",
        slack_token: "Jeton Slack", google_api_key: "Clé API Google", azure_key: "Clé d'accès Azure", sas_signature: "Signature d'accès (SAS)",
        jwt: "Jeton de connexion (JWT)", password: "Mot de passe", iban: "IBAN", card: "Numéro de carte bancaire", vat_id: "Numéro de TVA",
        email: "Adresse e-mail", phone: "Numéro de téléphone", codice_fiscale: "Codice fiscale", dni: "DNI / NIE", nir: "Numéro de sécurité sociale",
        internal_ip: "Adresse IP interne", internal_host: "Nom de serveur interne", label: "Mention de confidentialité", custom_term: "Terme protégé"
      },
      cats: { secrets: "Mots de passe et clés", finance: "Données bancaires et de paiement", personal: "Données personnelles", internal: "Détails du réseau interne", labels: "Mentions de confidentialité", custom: "Vos termes protégés" }
    },
    es: {
      title: "Posibles datos confidenciales",
      introPaste: "El texto que estás pegando en {site} contiene:",
      introSend: "Tu mensaje a {site} contiene:",
      maskPaste: "Pegar con marcadores",
      maskSend: "Reemplazar con marcadores",
      anywayPaste: "Pegar de todos modos",
      anywaySend: "Permitir y enviar",
      cancel: "Cancelar",
      hintMask: "Los marcadores como [EMAIL_1] conservan el sentido sin los datos reales.",
      hintSend: "Después de elegir, pulsa Intro de nuevo para enviar.",
      localOnly: "Comprobado en este dispositivo. No se ha enviado nada.",
      policy: "Tu organización no permite enviar estos datos.",
      types: {
        private_key: "Clave privada", aws_key: "Clave de acceso de AWS", github_token: "Token de GitHub", ai_api_key: "Clave API de un servicio de IA",
        slack_token: "Token de Slack", google_api_key: "Clave API de Google", azure_key: "Clave de acceso de Azure", sas_signature: "Firma de acceso (SAS)",
        jwt: "Token de sesión (JWT)", password: "Contraseña", iban: "IBAN", card: "Número de tarjeta", vat_id: "NIF-IVA",
        email: "Dirección de correo", phone: "Número de teléfono", codice_fiscale: "Codice fiscale", dni: "DNI / NIE", nir: "Número de la seguridad social francesa",
        internal_ip: "Dirección IP interna", internal_host: "Nombre de servidor interno", label: "Marca de confidencialidad", custom_term: "Término protegido"
      },
      cats: { secrets: "Contraseñas y claves", finance: "Datos bancarios y de pago", personal: "Datos personales", internal: "Detalles de la red interna", labels: "Marcas de confidencialidad", custom: "Tus términos protegidos" }
    },
    nl: {
      title: "Mogelijk vertrouwelijke gegevens",
      introPaste: "De tekst die je in {site} plakt, bevat:",
      introSend: "Je bericht aan {site} bevat:",
      maskPaste: "Plakken met plaatsaanduidingen",
      maskSend: "Vervangen door plaatsaanduidingen",
      anywayPaste: "Toch plakken",
      anywaySend: "Toestaan en verzenden",
      cancel: "Annuleren",
      hintMask: "Plaatsaanduidingen zoals [EMAIL_1] behouden de betekenis zonder de echte gegevens.",
      hintSend: "Druk na je keuze opnieuw op Enter om te verzenden.",
      localOnly: "Gecontroleerd op dit apparaat. Er is niets verzonden.",
      policy: "Je organisatie staat het verzenden van deze gegevens niet toe.",
      types: {
        private_key: "Privésleutel", aws_key: "AWS-toegangssleutel", github_token: "GitHub-token", ai_api_key: "API-sleutel van een AI-dienst",
        slack_token: "Slack-token", google_api_key: "Google-API-sleutel", azure_key: "Azure-toegangssleutel", sas_signature: "Toegangshandtekening (SAS)",
        jwt: "Inlogtoken (JWT)", password: "Wachtwoord", iban: "IBAN", card: "Creditcardnummer", vat_id: "Btw-nummer",
        email: "E-mailadres", phone: "Telefoonnummer", codice_fiscale: "Codice fiscale (Italië)", dni: "DNI / NIE (Spanje)", nir: "Frans socialezekerheidsnummer",
        bsn: "BSN", pesel: "PESEL-nummer (Polen)", nif_pt: "Portugees fiscaal nummer (NIF)", personnummer: "Zweeds persoonsnummer",
        internal_ip: "Intern IP-adres", internal_host: "Interne servernaam", label: "Vertrouwelijkheidsmarkering", custom_term: "Beschermde term"
      },
      cats: { secrets: "Wachtwoorden en sleutels", finance: "Bank- en betaalgegevens", personal: "Persoonsgegevens", internal: "Details van het interne netwerk", labels: "Vertrouwelijkheidsmarkeringen", custom: "Je beschermde termen" }
    },
    pl: {
      title: "Możliwe dane poufne",
      introPaste: "Tekst, który wklejasz do {site}, zawiera:",
      introSend: "Twoja wiadomość do {site} zawiera:",
      maskPaste: "Wklej z symbolami zastępczymi",
      maskSend: "Zastąp symbolami zastępczymi",
      anywayPaste: "Wklej mimo to",
      anywaySend: "Zezwól i wyślij",
      cancel: "Anuluj",
      hintMask: "Symbole zastępcze, np. [EMAIL_1], zachowują sens bez prawdziwych danych.",
      hintSend: "Po wyborze naciśnij ponownie Enter, aby wysłać.",
      localOnly: "Sprawdzono na tym urządzeniu. Nic nie zostało wysłane.",
      policy: "Twoja organizacja nie pozwala na wysyłanie tych danych.",
      types: {
        private_key: "Klucz prywatny", aws_key: "Klucz dostępu AWS", github_token: "Token GitHub", ai_api_key: "Klucz API usługi AI",
        slack_token: "Token Slack", google_api_key: "Klucz API Google", azure_key: "Klucz dostępu Azure", sas_signature: "Podpis dostępu (SAS)",
        jwt: "Token logowania (JWT)", password: "Hasło", iban: "IBAN", card: "Numer karty płatniczej", vat_id: "Numer VAT",
        email: "Adres e-mail", phone: "Numer telefonu", codice_fiscale: "Codice fiscale (Włochy)", dni: "DNI / NIE (Hiszpania)", nir: "Francuski numer ubezpieczenia społecznego",
        bsn: "BSN (Holandia)", pesel: "Numer PESEL", nif_pt: "Portugalski numer podatkowy (NIF)", personnummer: "Szwedzki numer osobowy",
        internal_ip: "Wewnętrzny adres IP", internal_host: "Nazwa serwera wewnętrznego", label: "Oznaczenie poufności", custom_term: "Chroniony termin"
      },
      cats: { secrets: "Hasła i klucze", finance: "Dane bankowe i płatnicze", personal: "Dane osobowe", internal: "Szczegóły sieci wewnętrznej", labels: "Oznaczenia poufności", custom: "Twoje chronione terminy" }
    },
    pt: {
      title: "Possíveis dados confidenciais",
      introPaste: "O texto que está a colar em {site} contém:",
      introSend: "A sua mensagem para {site} contém:",
      maskPaste: "Colar com marcadores",
      maskSend: "Substituir por marcadores",
      anywayPaste: "Colar mesmo assim",
      anywaySend: "Permitir e enviar",
      cancel: "Cancelar",
      hintMask: "Marcadores como [EMAIL_1] mantêm o sentido sem os dados reais.",
      hintSend: "Depois de escolher, prima Enter novamente para enviar.",
      localOnly: "Verificado neste dispositivo. Nada foi enviado.",
      policy: "A sua organização não permite enviar estes dados.",
      types: {
        private_key: "Chave privada", aws_key: "Chave de acesso AWS", github_token: "Token do GitHub", ai_api_key: "Chave de API de um serviço de IA",
        slack_token: "Token do Slack", google_api_key: "Chave de API da Google", azure_key: "Chave de acesso do Azure", sas_signature: "Assinatura de acesso (SAS)",
        jwt: "Token de sessão (JWT)", password: "Palavra-passe", iban: "IBAN", card: "Número de cartão", vat_id: "Número de IVA",
        email: "Endereço de e-mail", phone: "Número de telefone", codice_fiscale: "Codice fiscale (Itália)", dni: "DNI / NIE (Espanha)", nir: "Número de segurança social francês",
        bsn: "BSN (Países Baixos)", pesel: "Número PESEL (Polónia)", nif_pt: "NIF", personnummer: "Número pessoal sueco",
        internal_ip: "Endereço IP interno", internal_host: "Nome de servidor interno", label: "Menção de confidencialidade", custom_term: "Termo protegido"
      },
      cats: { secrets: "Palavras-passe e chaves", finance: "Dados bancários e de pagamento", personal: "Dados pessoais", internal: "Detalhes da rede interna", labels: "Menções de confidencialidade", custom: "Os seus termos protegidos" }
    },
    sv: {
      title: "Möjligen konfidentiella uppgifter",
      introPaste: "Texten du klistrar in i {site} innehåller:",
      introSend: "Ditt meddelande till {site} innehåller:",
      maskPaste: "Klistra in med platshållare",
      maskSend: "Ersätt med platshållare",
      anywayPaste: "Klistra in ändå",
      anywaySend: "Tillåt och skicka",
      cancel: "Avbryt",
      hintMask: "Platshållare som [EMAIL_1] behåller innebörden utan de riktiga uppgifterna.",
      hintSend: "Tryck på Enter igen efter ditt val för att skicka.",
      localOnly: "Kontrollerat på den här enheten. Inget har skickats.",
      policy: "Din organisation tillåter inte att de här uppgifterna skickas.",
      types: {
        private_key: "Privat nyckel", aws_key: "AWS-åtkomstnyckel", github_token: "GitHub-token", ai_api_key: "API-nyckel för en AI-tjänst",
        slack_token: "Slack-token", google_api_key: "Google API-nyckel", azure_key: "Azure-åtkomstnyckel", sas_signature: "Åtkomstsignatur (SAS)",
        jwt: "Inloggningstoken (JWT)", password: "Lösenord", iban: "IBAN", card: "Kortnummer", vat_id: "Momsregistreringsnummer",
        email: "E-postadress", phone: "Telefonnummer", codice_fiscale: "Codice fiscale (Italien)", dni: "DNI / NIE (Spanien)", nir: "Franskt socialförsäkringsnummer",
        bsn: "BSN (Nederländerna)", pesel: "PESEL-nummer (Polen)", nif_pt: "Portugisiskt skattenummer (NIF)", personnummer: "Personnummer",
        internal_ip: "Intern IP-adress", internal_host: "Internt servernamn", label: "Sekretessmärkning", custom_term: "Skyddad term"
      },
      cats: { secrets: "Lösenord och nycklar", finance: "Bank- och betaluppgifter", personal: "Personuppgifter", internal: "Detaljer om internt nätverk", labels: "Sekretessmärkningar", custom: "Dina skyddade termer" }
    }
  };
  // Newer ID types in the earlier languages
  Object.assign(S.en.types, { dni: "Spanish DNI / NIE", nir: "French social security number", bsn: "Dutch citizen service number (BSN)", pesel: "Polish PESEL number", nif_pt: "Portuguese tax number (NIF)", personnummer: "Swedish personal identity number" });
  Object.assign(S.de.types, { dni: "Spanische DNI / NIE", nir: "Französische Sozialversicherungsnummer", bsn: "Niederländische Bürgerservicenummer (BSN)", pesel: "Polnische PESEL-Nummer", nif_pt: "Portugiesische Steuernummer (NIF)", personnummer: "Schwedische Personennummer" });
  Object.assign(S.it.types, { dni: "DNI / NIE spagnolo", nir: "Numero di previdenza sociale francese", bsn: "Numero BSN olandese", pesel: "Numero PESEL polacco", nif_pt: "Codice fiscale portoghese (NIF)", personnummer: "Numero personale svedese" });
  Object.assign(S.fr.types, { bsn: "Numéro BSN néerlandais", pesel: "Numéro PESEL polonais", nif_pt: "Numéro fiscal portugais (NIF)", personnummer: "Numéro personnel suédois" });
  Object.assign(S.es.types, { bsn: "BSN neerlandés", pesel: "Número PESEL polaco", nif_pt: "NIF portugués", personnummer: "Número personal sueco" });
  function pickLang(pref) {
    const l = (pref && pref !== "auto" ? pref : (navigator.language || "en")).slice(0, 2).toLowerCase();
    return S[l] ? l : "en";
  }
  root.ALG_I18N = { S, pickLang, t: (pref) => S[pickLang(pref)] };
})(typeof self !== "undefined" ? self : this);
