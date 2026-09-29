# Automatic deployment

After a one-time setup, a release is three commands. GitHub Actions then tests the extension, builds the package, creates a GitHub release, and submits it to the Chrome Web Store and Microsoft Edge Add-ons. Browsers that already have the extension update themselves from the stores.

```
npm run bump -- 0.4.0
git commit -am "Release 0.4.0"
git tag v0.4.0 && git push origin main --tags
```

## What runs when

| Trigger | Workflow | What happens |
|---|---|---|
| Push to `main`, pull request | `ci.yml` | Unit tests, publish-script tests, browser tests in Chromium, build. The package is attached to the run as a download. |
| Push a tag like `v0.4.0` | `release.yml` | Checks the tag matches `manifest.json`, runs all tests, builds, creates a GitHub release with the zip, then (after your approval) submits to both stores. |

A store job skips itself with a warning if its credentials are not set yet, so you can start with GitHub releases only and add the stores later.

## One-time setup

### 1. GitHub repository

1. Create a **private** repository, for example `ai-leak-guard`, and push this folder to it.
2. In **Settings → Environments**, create an environment called `production`. Add yourself under **Required reviewers**. Every store submission then waits for your click in the Actions tab.
3. Secrets and variables below go under **Settings → Secrets and variables → Actions** (or on the `production` environment).

### 2. Chrome Web Store

The first version must be submitted by hand. Only updates can be automated.

1. Register at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) (one-time US$5 fee).
2. Run `npm run build` and upload `dist/ai-leak-guard-<version>.zip` as a new item. Fill in the listing, the privacy tab (no user data is collected; the `storage` permission keeps settings and counters), and submit.
3. Note the **extension ID** (on the item page) and your **publisher ID** (in the dashboard's account settings).
4. Set repository variables `CWS_EXTENSION_ID` and `CWS_PUBLISHER_ID`.

Then choose how GitHub Actions signs in:

**Option A: OAuth refresh token (quicker to set up)**

1. In [Google Cloud Console](https://console.cloud.google.com), create a project and enable the **Chrome Web Store API**.
2. Configure the OAuth consent screen and **publish it to "In production"**. While it stays in "Testing", refresh tokens stop working after 7 days.
3. Create an OAuth client of type **Desktop app**. Note the client ID and secret.
4. Get a refresh token with the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground): in the settings (gear icon) tick "Use your own OAuth credentials", enter the client ID and secret, authorize the scope `https://www.googleapis.com/auth/chromewebstore`, and exchange the code for tokens.
5. Set secrets `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.

**Option B: keyless sign-in with Workload Identity Federation (recommended)**

No long-lived secret is stored in GitHub. GitHub proves its identity to Google for each run, and Google issues a 30-minute token.

```bash
PROJECT_ID=your-project; PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
REPO=Mengokai/ai-leak-guard

gcloud services enable chromewebstore.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project $PROJECT_ID
gcloud iam service-accounts create cws-publisher --project $PROJECT_ID
gcloud iam workload-identity-pools create github --location=global --project $PROJECT_ID
gcloud iam workload-identity-pools providers create-oidc github-actions --location=global \
  --workload-identity-pool=github --project $PROJECT_ID \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='$REPO' && assertion.ref.startsWith('refs/tags/v')"
gcloud iam service-accounts add-iam-policy-binding cws-publisher@$PROJECT_ID.iam.gserviceaccount.com --project $PROJECT_ID \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"
```

Then add the service account's email address in the Chrome Web Store Developer Dashboard (account settings), and set repository variables:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github-actions`
- `GCP_SERVICE_ACCOUNT` = `cws-publisher@<PROJECT_ID>.iam.gserviceaccount.com`

When these are set, the workflow uses them and ignores the Option A secrets. The attribute condition means only tag pushes from this repository can publish.

**Optional rollout controls** (repository variables):

- `CWS_STAGED=true`: after approval, the update waits until you click Publish in the dashboard.
- `CWS_DEPLOY_PERCENTAGE=10`: roll out to 10% of users first (needs enough users for Chrome to allow it).

### 3. Microsoft Edge Add-ons

1. Register in [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/public/login?ref=dd) for the Microsoft Edge program (free).
2. Submit the first version by hand, with the same zip.
3. In Partner Center go to **Microsoft Edge → Publish API**, enable the new experience, and click **Create API credentials**.
4. Set variable `EDGE_PRODUCT_ID` (from the extension's overview page) and secrets `EDGE_CLIENT_ID` and `EDGE_API_KEY`.

**The Edge API key expires after 72 days.** Put a reminder in your calendar to create a new key every two months and update the `EDGE_API_KEY` secret. An expired key makes the Edge job fail with HTTP 401; the Chrome job and the GitHub release are not affected.

## Settings reference

| Name | Type | Needed for |
|---|---|---|
| `CWS_EXTENSION_ID` | variable | Chrome |
| `CWS_PUBLISHER_ID` | variable | Chrome |
| `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` | secrets | Chrome, Option A |
| `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT` | variables | Chrome, Option B |
| `CWS_STAGED`, `CWS_DEPLOY_PERCENTAGE` | variables | Chrome, optional |
| `EDGE_PRODUCT_ID` | variable | Edge |
| `EDGE_CLIENT_ID`, `EDGE_API_KEY` | secrets | Edge |

## After you tag a release

1. **Actions tab:** the `build` and `github-release` jobs run automatically. If a test fails, nothing is published.
2. **Approve:** the `chrome` and `edge` jobs wait for your approval on the `production` environment.
3. **Store review:** both stores review each update. It usually takes from a few hours to a few days, and Edge can take longer. Users receive the update automatically once it's approved.

You can test publishing without calling the stores: `DRY_RUN=true npm run publish:chrome` prints what would be sent.

## Rolling it out to company computers (Intune or Group Policy)

Once the extension is in the stores, IT can install it on every managed browser and push settings, without users doing anything. Replace `<ID>` with the store's extension ID (Edge and Chrome IDs differ).

**Force-install** (Settings catalog, or Group Policy "Control which extensions are installed silently"):

- Edge: `ExtensionInstallForcelist` = `<EDGE-ID>;https://edge.microsoft.com/extensionwebstorebase/v1/crx`
- Chrome: `ExtensionInstallForcelist` = `<CHROME-ID>;https://clients2.google.com/service/update2/crx`

**Organisation settings** for the extension go to the registry (for example with an Intune PowerShell script). Lists use numbered entries:

```powershell
$key = "HKLM:\SOFTWARE\Policies\Microsoft\Edge\3rdparty\extensions\<EDGE-ID>\policy"   # Chrome: HKLM:\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\<CHROME-ID>\policy
New-Item -Path "$key\customTerms" -Force | Out-Null
Set-ItemProperty -Path "$key\customTerms" -Name "1" -Value "Müller AG"
Set-ItemProperty -Path "$key\customTerms" -Name "2" -Value "Projekt Alpenblick"
Set-ItemProperty -Path $key -Name "allowSendAnyway" -Value 0 -Type DWord
Set-ItemProperty -Path $key -Name "forceEnabled" -Value 1 -Type DWord
```

Check the result on one test machine at `edge://policy` (or `chrome://policy`) before rolling out: the extension's settings should appear there, and the extension's popup should show "Managed by your organisation".
