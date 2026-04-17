---
name: gsc-seo-page
description: "Generate SEO pages from Google Search Console queries, and onboard new products into the automated GSC/SERP pipeline. Delegates page generation to ~/social-autoposter/seo/generate_page.py and covers end-to-end product onboarding: GSC domain registration via API, config.json wiring, launchd activation, backfill, and verification."
user_invocable: true
---

# GSC SEO Page

Two modes:

1. **Generate a page** for a query that GSC is already showing impressions for (the common case).
2. **Onboard a new product** into the GSC + SERP pipelines so the crons start producing pages for a new domain automatically.

## How It Works

All page generation goes through a single canonical script:

```
~/social-autoposter/seo/generate_page.py
```

This script handles everything: SERP research, dynamic component discovery from `@seo/components`, theme detection, page writing, and build verification. Do NOT write pages manually or use inline TSX patterns; always run the generator.

## Usage

### Manual (single page)

```bash
cd ~/social-autoposter
python3 seo/generate_page.py \
  --product fazm \
  --keyword "your target query" \
  --slug "your-target-query" \
  --trigger manual
```

The generator will:
1. Research the SERP for the keyword
2. Discover available components from `@seo/components`
3. Read the target repo's theme (dark/light) from its CSS
4. Write a rich page with animated components, Magic UI elements, comparison tables, FAQ sections, etc.
5. Build and verify locally
6. Commit and push to main
7. Wait for deployment and verify HTTP 200

### Pipeline (automated, via cron)

The cron pipeline (`seo/run_gsc_pipeline.sh`) handles:
1. Fetching queries from GSC via `seo/fetch_gsc_queries.py`
2. Picking the highest-impression pending query from Postgres (`gsc_queries` table)
3. Marking it `in_progress`
4. Calling `generate_page.py --trigger gsc`
5. Updating Postgres with the result

Cron wrappers: `seo/cron_gsc.sh` (GSC queries) and `seo/cron_seo.sh` (SERP discovery).

### Supported products

All products in `~/social-autoposter/config.json`: Fazm, Assrt, PieLine, Cyrano, etc.

## Onboarding a New Product

Use this section when a new consumer site (already scaffolded with the `setup-client-website` skill and deployed at `https://DOMAIN`) needs to be plugged into the automated page-generation pipeline. Five steps: register the domain in GSC via API, add the product to `config.json`, activate the launchd jobs, backfill, verify.

**What this unlocks once wired:**

- `seo/cron_gsc.sh` (every 10 min): pulls GSC queries for the domain, picks the highest-impression pending query, writes one guide page per run
- `seo/cron_seo.sh` (every 10 min): DataForSEO SERP discovery that proposes net-new keywords before they show in GSC
- Both write TSX pages into `~/CLIENT-website/src/app/(main)/t/{slug}/page.tsx`, build locally, commit, push to `main`, and wait for deploy

**Prerequisites:**

- Site deployed at `https://DOMAIN` with `/t/` scaffolding and sitemap accessible at `https://DOMAIN/sitemap.xml` (run the `setup-client-website` skill first)
- `~/social-autoposter/.env` defines these keys (the skill reads them at runtime; set once per workstation):

  ```
  GSC_SA_KEY_PATH=~/social-autoposter/seo/credentials/<sa-key>.json
  GSC_SA_EMAIL=<service-account>@<gcp-project>.iam.gserviceaccount.com
  GSC_GCP_PROJECT=<gcp-project-id>
  GSC_ADMIN_EMAIL=<email-that-owns-GCP-project>
  CLOUD_DNS_PROJECT=<gcloud-dns-project>   # only needed for Cloud DNS path; skip for Vercel DNS
  DATABASE_URL=postgres://...              # Neon, already set by social-autoposter init
  ```

- The SA key file at `$GSC_SA_KEY_PATH` exists and has `webmasters` + `siteverification` scopes authorized
- The client repo is cloned at the path you will write into `landing_pages.repo`

Source the env before running any of the Python snippets below:

```bash
set -a && source ~/social-autoposter/.env && set +a
```

### Step 1. Register the Domain in Google Search Console (API path, no browser)

The service account can register and verify a domain property end-to-end via the Site Verification API plus the Search Console API. No browser UI, no manual clicking. Once this completes, the SA is `siteOwner` on the property and `fetch_gsc_queries.py` can pull impression data immediately.

**1a.** Enable the Site Verification API in the SA's project (once per project; skip if already enabled on `$GSC_GCP_PROJECT`):

```bash
gcloud services enable siteverification.googleapis.com \
  --project="$GSC_GCP_PROJECT" \
  --account="$GSC_ADMIN_EMAIL"
```

The `--account` must be an owner of `$GSC_GCP_PROJECT`, not any gcloud-authenticated email.

**1b.** Get the DNS TXT verification token. Set `DOMAIN` to the bare domain (e.g. `clientdomain.com`, not `https://clientdomain.com`):

```bash
export DOMAIN=clientdomain.com

python3 -c "
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
creds = service_account.Credentials.from_service_account_file(
    os.path.expanduser(os.environ['GSC_SA_KEY_PATH']),
    scopes=['https://www.googleapis.com/auth/siteverification'],
)
sv = build('siteVerification', 'v1', credentials=creds)
res = sv.webResource().getToken(body={
    'site': {'type': 'INET_DOMAIN', 'identifier': os.environ['DOMAIN']},
    'verificationMethod': 'DNS_TXT',
}).execute()
print(res['token'])
"
```

**1c.** Add the TXT record.

For domains on **Vercel DNS** (personal-account Vercel domains):

```bash
vercel dns add "$DOMAIN" @ TXT "google-site-verification=TOKEN"
```

Do not pass `--scope` for personal-account domains. Passing a personal-scope flag fails with "You cannot set your Personal Account as the scope." Use `--scope <team-slug>` only for team-owned domains.

For domains on **Google Cloud DNS** (requires `CLOUD_DNS_PROJECT` in env):

```bash
gcloud dns record-sets transaction start --zone=ZONE_NAME --project="$CLOUD_DNS_PROJECT"
gcloud dns record-sets transaction add '"google-site-verification=TOKEN"' \
  --name="${DOMAIN}." --ttl=300 --type=TXT --zone=ZONE_NAME --project="$CLOUD_DNS_PROJECT"
gcloud dns record-sets transaction execute --zone=ZONE_NAME --project="$CLOUD_DNS_PROJECT"
```

**1d.** Wait ~15 seconds for propagation, then confirm:

```bash
dig +short TXT "$DOMAIN" @8.8.8.8 | grep google-site-verification
```

If nothing shows, wait 30 seconds and retry.

**1e.** Complete verification, add to Search Console, and submit the sitemap in one shot:

```bash
python3 -c "
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
DOMAIN = os.environ['DOMAIN']
creds = service_account.Credentials.from_service_account_file(
    os.path.expanduser(os.environ['GSC_SA_KEY_PATH']),
    scopes=[
        'https://www.googleapis.com/auth/siteverification',
        'https://www.googleapis.com/auth/webmasters',
    ],
)
sv = build('siteVerification', 'v1', credentials=creds)
sv.webResource().insert(
    verificationMethod='DNS_TXT',
    body={'site': {'type': 'INET_DOMAIN', 'identifier': DOMAIN}, 'owners': []},
).execute()
sc = build('searchconsole', 'v1', credentials=creds)
sc.sites().add(siteUrl=f'sc-domain:{DOMAIN}').execute()
sc.sitemaps().submit(siteUrl=f'sc-domain:{DOMAIN}', feedpath=f'https://{DOMAIN}/sitemap.xml').execute()
print(f'OK: sc-domain:{DOMAIN} verified, added, sitemap submitted')
"
```

After this runs successfully, the SA is `siteOwner`, the sitemap is submitted, and GSC starts accumulating impression data (real data usually takes 1 to 3 days).

**Why API not browser:** no manual clicking, no browser lock contention, works from any machine that has the SA credentials. A browser flow is only needed if the domain belongs to a GCP project the SA is not enabled on, or if you have no access to the SA.

### Step 2. Add the Product to `~/social-autoposter/config.json`

Edit `~/social-autoposter/config.json` and add the client as a new entry under the `projects[]` array:

```json
{
  "name": "ClientName",
  "weight": 10,
  "landing_pages": {
    "repo": "~/CLIENT-website",
    "github_repo": "<GITHUB_ORG>/CLIENT-website",
    "base_url": "https://clientdomain.com",
    "gsc_property": "sc-domain:clientdomain.com",
    "product_source": [
      {
        "path": "~/CLIENT-website",
        "description": "1 to 2 sentence description of what this site is, who the client is, and what topics the guide pages should cover. Used in the LLM prompt when generating pages."
      }
    ]
  }
}
```

**Field semantics** (verified against `seo/select_product.py` and `seo/generate_page.py`):

| Field | Read by | Purpose |
|---|---|---|
| `name` | both crons | Product label used in logs, DB rows (`gsc_queries.product`, `seo_keywords.product`), and the dashboard |
| `weight` | both crons | Relative pick frequency in the weighted-random product selection. Default is 10. Smaller or less active products use 6. Setting to 0 disables without deleting |
| `landing_pages.repo` | `seo/select_product.py:29` eligibility gate; `seo/generate_page.py:147` | Path to the client's Next.js repo on disk. Must exist or the product is silently skipped |
| `landing_pages.github_repo` | optional, reference | Not read by the generator (git remote is read from the local `.git/config`). Keep for documentation |
| `landing_pages.base_url` | `seo/generate_page.py:148` | Prepended to `/t/{slug}` for final URL used in verification and logs |
| `landing_pages.gsc_property` | `seo/select_product.py:31` eligibility gate for `cron_gsc.sh` | Must match `sc-domain:...` exactly. Without it the product is invisible to the GSC cron |
| `landing_pages.product_source[]` | `seo/generate_page.py:119` | Grounds generated content in real product details. Each entry has `path` (a README, docs dir, or source root) and `description` |

Without `gsc_property` set, `cron_gsc.sh` silently skips the product forever. Without `repo` on disk, both crons skip it.

### Step 3. Activate the SEO launchd Jobs

Both SEO crons ship as plists in `~/social-autoposter/launchd/` but `npx social-autoposter init` does NOT auto-load them (only the social posting plists are auto-loaded). Link and load them once, on the machine that will run the pipelines:

```bash
ln -sf ~/social-autoposter/launchd/com.m13v.social-gsc-seo.plist ~/Library/LaunchAgents/
ln -sf ~/social-autoposter/launchd/com.m13v.social-serp-seo.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.m13v.social-gsc-seo.plist
launchctl load ~/Library/LaunchAgents/com.m13v.social-serp-seo.plist
```

Verify both are registered:

```bash
launchctl list | grep -E "social-(gsc|serp)-seo"
```

Expect two lines, each with a PID (when a run is currently executing) or `-` plus the last exit code. Both jobs fire every 600 seconds (10 min). Skip this entire step if `launchctl list` already shows both.

### Step 4. Backfill GSC Queries (optional but recommended)

`cron_gsc.sh` does not fetch queries eagerly; the fetch happens lazily inside each run. If the domain was just registered and has zero rows in the `gsc_queries` table, the first cron picks will do nothing. To kickstart, run the fetch manually:

```bash
cd ~/social-autoposter
python3 seo/fetch_gsc_queries.py --product ClientName
```

Expect 0 queries for brand-new properties (GSC impression data takes 1 to 3 days to accumulate). Re-run the fetch after a few days to populate the table. Once pending queries with `impressions >= 5` exist, the cron will start generating pages automatically without further action.

### Step 5. Verify End-to-End

```bash
# 1. Confirm the product is eligible for both pipelines.
python3 ~/social-autoposter/seo/select_product.py --require-gsc
# Run it 20 times; the product's name should appear proportional to its weight.

# 2. Inspect pending queries after a fetch.
source ~/social-autoposter/.env
psql "$DATABASE_URL" -c "SELECT status, COUNT(*) FROM gsc_queries WHERE product = 'ClientName' GROUP BY status;"

# 3. Force one GSC run without waiting for the cron.
~/social-autoposter/seo/run_gsc_pipeline.sh ClientName
# Writes to ~/social-autoposter/seo/logs/gsc_ClientName.log
# Either creates a new page at ~/CLIENT-website/src/app/(main)/t/{slug}/page.tsx,
# or exits with "No pending queries with >= 5 impressions. Done."

# 4. Watch the cron pick the product organically.
tail -f ~/social-autoposter/skill/logs/cron_gsc-*.log
```

**Onboarding checklist:**

- [ ] `sc-domain:DOMAIN` appears in the SA's site list (`sc.sites().list()` includes it with `permissionLevel: "siteOwner"`)
- [ ] Sitemap submitted (appears in GSC UI under Indexing > Sitemaps within minutes)
- [ ] New product entry exists in `~/social-autoposter/config.json` with all five required `landing_pages` fields
- [ ] `select_product.py --require-gsc` includes the product in its rotation
- [ ] Both `com.m13v.social-gsc-seo` and `com.m13v.social-serp-seo` appear in `launchctl list`
- [ ] At least one run of `run_gsc_pipeline.sh ClientName` completes without error (an exit of "no pending queries" is acceptable on day one)
- [ ] Within 3 days, `gsc_queries` table shows rows with `status='pending'` and `impressions >= 5` for the new product

## What NOT to do

- Do NOT write page TSX manually with inline SVGs and raw HTML tables
- Do NOT use the old `seo-page-ui` blueprint (deleted; it produced plain pages without components)
- Do NOT create local guide component files in product repos; use `@seo/components`
- Do NOT use the old `underserved-seo-page` skill (deleted; replaced by `run_serp_pipeline.sh`)
- Do NOT register GSC properties through the browser UI when the SA can do it via API (Step 1 above)

## Writing rules (apply to all generated content)

- No em dashes or en dashes anywhere
- No AI vocabulary: delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental
- Real code only, not pseudocode
- Concrete numbers, not vague claims
- First-person plural or second person voice

## Quick reference

| What | Where |
|---|---|
| Generator | `~/social-autoposter/seo/generate_page.py` |
| GSC pipeline | `~/social-autoposter/seo/run_gsc_pipeline.sh` |
| SERP pipeline | `~/social-autoposter/seo/run_serp_pipeline.sh` |
| GSC cron wrapper | `~/social-autoposter/seo/cron_gsc.sh` |
| SERP cron wrapper | `~/social-autoposter/seo/cron_seo.sh` |
| Product selector | `~/social-autoposter/seo/select_product.py` |
| GSC fetch | `~/social-autoposter/seo/fetch_gsc_queries.py` |
| Postgres state | `gsc_queries` and `seo_keywords` tables |
| Component library | `~/seo-components/src/index.ts` (`@seo/components`) |
| Product config | `~/social-autoposter/config.json` |
| launchd plists | `~/social-autoposter/launchd/com.m13v.social-{gsc,serp}-seo.plist` |
