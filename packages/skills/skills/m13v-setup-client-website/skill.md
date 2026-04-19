---
name: setup-client-website
description: "One-time onboarding for a new consumer site: SEO audit of the existing site, Next.js 16 scaffold, @m13v/seo-components install, route-group architecture, real images/video/structured data, Cloud Run deploy, dashboard registration, and SEO infrastructure wiring (withSeoContent, guide index, optional sidebar and AI chat). This skill stops at infrastructure; day-to-day SEO guide page generation is handled by the gsc-seo-page skill and seo/generate_page.py. Use when: 'set up client website', 'onboard new client site', 'new consumer site', 'recreate website', 'rebuild website', or when spinning up a fresh site that will later receive programmatic SEO pages."
user_invocable: true
---

# Setup Client Website

One-time onboarding flow for a new (or rebuilt) client/consumer site. Produces a modern, SEO-optimized Next.js site with real content, images, video embeds, structured data, and the infrastructure needed for programmatic SEO guide pages.

**Scope boundary:** this skill leaves the repo in a state where `/t/<slug>` guide pages can be produced. It does NOT write guide pages. All guide-page content generation is handled by the `gsc-seo-page` skill, which drives `~/social-autoposter/seo/generate_page.py`. After running this skill, register the site in `~/social-autoposter/config.json` and hand off to `gsc-seo-page` for every page.

## Arguments

Provide the client name, domain (if any), and existing site URL (if any). Example: `"Paperback Expert at paperbackexpert.com"`

## Prerequisites

- **Google Cloud** project under the m13v.com org (or create a new one)
- **GitHub** org or personal account
- **PostHog** account (org: m13v) for analytics
- **Resend** account (`you@example.com`) for transactional email
- **Neon** account for Postgres (one project per client, pooled connection)
- **Google Search Console** access
- **Isolated browser MCP** for visual comparison

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (inline theme via `@theme`)
- next/image for optimized images
- Google Cloud Run for hosting (with HTTPS Load Balancer + Certificate Manager)
- PostHog for analytics (pageviews, CTA clicks, newsletter subscribes)
- Resend for transactional email (newsletter welcome, contact form, optional inbound webhook)
- Neon (`@neondatabase/serverless`) for email + contact logs

---

## Phase 1: Audit and Research

Phase 1 runs two tracks concurrently:

- **Outward track (1a):** understand the market the client sells into (competitors, search demand, industry developments, ICP).
- **Inward track (1b-1e):** audit what the client already has (SEO baseline, content crawl, assets, screenshots).

Both tracks feed **1f**, which produces a single `research-brief.md` that every downstream phase (copy, hero, CTAs, FAQ, case studies) is required to consume. Research that does not make it into the brief is decoration.

### 1a. Market Research Fan-Out

Launch these agents in parallel. They have no dependencies on each other or on the inward track, so batch them in a single message.

```
Launch 4 agents in parallel:
- competitor-analysis: identify top 3-5 rivals by SERP + brand search.
    Per rival, capture: positioning one-liner, pricing, primary CTAs,
    hero copy, testimonial themes, messaging pillars, obvious gaps or
    weaknesses.
- keyword-research + serp-analysis (single agent, both skills): head
    terms, long-tail clusters, search intent (informational /
    commercial / transactional), SERP feature mix (AI Overviews, PAA,
    video, local pack), difficulty, monthly volume.
- deep-research-pro: industry developments in the last 90 days,
    regulation, notable launches, funding, M&A, price moves, new
    entrants, platform / distribution shifts. Cite sources.
- general-purpose (ICP pass, with WebFetch): 1-2 primary personas with
    jobs-to-be-done, top 3 pains, top 3 gains, objections, triggers,
    and the language they actually use (verbatim pulls from Reddit
    threads, review sites, forum posts, NOT marketing copy).
```

**Output:** four raw reports in `research/raw/` (`competitors.md`, `keywords.md`, `industry.md`, `icp.md`). Do not edit them down here, **1f** does the compression.

**Budget guardrail:** if any single agent returns more than ~15k tokens, ask it to re-emit a tighter version capped at ~8k before moving on. Raw-output bloat is the main failure mode of this step.

### 1b. SEO Audit (if existing site)

Run parallel SEO agents to baseline the current site. This runs concurrently with 1a.

```
Launch 5 agents in parallel:
- seo-technical: crawlability, indexability, Core Web Vitals, mobile
- seo-content: E-E-A-T signals, readability, content depth
- seo-schema: existing structured data (JSON-LD, Microdata, RDFa)
- seo-performance: Lighthouse scores, LCP, CLS, TBT (desktop + mobile)
- seo-geo: AI crawler accessibility, llms.txt, citation readiness
```

Record all scores. These become the "before" baseline and the fix list for the new site.

### 1c. Crawl All Pages

Use an agent with WebFetch to discover and extract content from every page on the site:

1. Fetch the homepage, extract all navigation and footer links
2. Try common paths: /about, /services, /contact, /faq, /blog, /pricing, /testimonials, /privacy
3. For each discovered page, extract:
   - URL and page title
   - All headings (h1 through h6) with hierarchy
   - Full body text (quotes, testimonials, stats, descriptions)
   - CTA text and link targets
   - Form fields (if any)
   - Navigation links (to discover more pages)

**Output:** Complete content inventory organized by page.

### 1d. Extract Visual Assets (and Brand Identity)

Use the isolated browser to catalog images, videos, and embeds **on the original brand domain** (e.g. `piastech.com`, `cyrano.ai`), not on the new generic SEO domain. The brand identity is the property of the brand domain.

```js
// In isolated browser, navigate to each page and run:
() => {
  const imgs = Array.from(document.querySelectorAll('img')).map((img, i) => {
    const rect = img.getBoundingClientRect();
    return { idx: i, src: img.src, y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };
  }).filter(x => x.w > 50);
  const iframes = Array.from(document.querySelectorAll('iframe')).map(f => f.src);
  return { imgs, iframes };
}
```

**Key assets to identify and download:**
- **Brand wordmark / logo** (header top-left; may be SVG, PNG, or inline text — capture exact spelling, casing, and any logomark character like `π(a|s)`)
- **Favicon** (`/favicon.ico`, `/favicon.png`, or any `<link rel="icon">` href)
- Hero images or background photos
- Client/team headshot photos (circular, 100-200px)
- Product images (book covers, screenshots, etc.)
- Social proof imagery (awards, certifications, partner logos)
- Video embeds (Vimeo, YouTube URLs)
- Scheduling widgets (Calendly, Cal.com URLs)
- Book cover strips / product galleries

**Brand colors and fonts.** Dump the brand site's CSS custom properties and fonts so the new site can match the palette:

```js
// Run on the brand domain's homepage:
() => {
  const r = getComputedStyle(document.documentElement);
  const b = getComputedStyle(document.body);
  const varNames = ['--background','--foreground','--primary','--primary-foreground','--accent','--card','--secondary','--muted','--border'];
  const vars = Object.fromEntries(varNames.map(n => [n, r.getPropertyValue(n).trim()]));
  return {
    bodyBg: b.backgroundColor,
    bodyFg: b.color,
    bodyFont: b.fontFamily,
    vars,
  };
}
```

Also pull the brand site's CSS file and grep for hex/hsl color values if CSS vars aren't exposed:

```bash
curl -sL <brand-url>/assets/index.css | grep -oE '\-\-[a-z-]+:[^;]+;' | sort -u
```

Save the palette to `research/brand-identity.md` with: brand name exact spelling, logomark character (if any), primary/accent hex codes, body/heading fonts, favicon URL, and the logo image URL.

Download all identified images to `public/images/` with descriptive filenames. Copy the favicon to `public/favicon.png` and convert to `src/app/favicon.ico` (multi-size `.ico`) with:

```bash
magick <favicon>.png -define icon:auto-resize=16,32,48 src/app/favicon.ico
```

### 1e. Take Full Page Screenshots

Capture full-page screenshots of every key page on the original site for visual reference:

```
For each page:
1. browser_navigate to URL
2. browser_take_screenshot with fullPage: true
3. Save as original-{pagename}-full.png
```

### 1f. Synthesize Research Brief

Once 1a-1e are all complete, run a **single** synthesizer pass (general-purpose agent, no fan-out) that reads every file in `research/raw/` plus the crawl inventory and produces `research/research-brief.md` using exactly this schema:

```markdown
# Research Brief: <client>

## Positioning angle (one sentence)
<single crisp sentence — what the client uniquely is, for whom, against whom>

## 3 differentiators
1. <differentiator>  — proof: <citation / source / datapoint>
2. ...
3. ...

## 5 messaging pillars
1. <pillar headline> — supporting evidence: <...>
2. ...
...

## ICP (1-2 personas)
For each persona:
- Name + one-line description
- Top 3 jobs-to-be-done
- Top 3 pains (verbatim language from research)
- Top 3 gains
- Primary objection + the counter
- Trigger event that starts the buying journey

## Proof points
Verifiable stats, awards, case-study numbers, named clients, certifications, press mentions. Anything that can appear on the site as evidence — with source.

## Competitor landscape (one paragraph)
Who the client is up against, how they're positioned, and the gap the client is walking into.

## Banned clichés
Phrases pulled from competitor copy that the new site must NOT reuse (e.g. "cutting-edge", "world-class", "one-stop-shop", plus any industry-specific filler found during 1a).

## Industry signals (last 90 days)
3-5 bullets. Only items that should change hero copy, FAQ, or CTAs. Everything else is cut.
```

**Hard rules for the synthesizer:**
- Every claim must trace to a file in `research/raw/` or the crawl inventory. No invented stats.
- Hero copy, CTAs, FAQ answers, and case-study selection in Phases 3+ **must** cite lines from this brief. If a later phase wants to say something not in the brief, it returns to 1a instead of making it up.
- The brief is the artifact. The raw reports in `research/raw/` are scratch and can be deleted after 1f lands.

---

## Phase 1.5: Generic Domain Discovery and Purchase

**Goal:** secure a generic, keyword-rich domain that describes the product category rather than the brand (pattern: Cyrano → `apartment-security-cameras.com`). The brand domain (e.g. `cyrano.ai`) still exists; the generic domain is what the new Next.js site ships under for SEO.

Skip this phase only if the user explicitly opts out or the brand domain IS already the generic descriptive domain.

### 1.5a. Brainstorm candidates

Launch one subagent to generate **two tracks** of candidates, 15-25 per track. Both tracks describe the product category and never include the brand name.

**Track A: Short brandable names (priority).** These are the preferred output.

- **Length cap: under 8 characters for the stem** (TLD excluded). Total domain with TLD should stay ≤ 11 chars where possible. Examples: `s4l.ai` (stem 3, total 6), `fazm.ai` (stem 4, total 7), `mk0r.com` (stem 4, total 8), `fde10x.com` (stem 6, total 10). Shorter stems are better.
- Derive from the product category keyword by vowel drops, consonant clusters, or playful contractions (e.g. `camera` → `cam`, `cmra`, `kmr`; `security` → `sec`, `scrty`).
- **Digit substitution for availability.** Swap letters for visually or phonetically similar digits to find available domains: `o` ↔ `0`, `i/l` ↔ `1`, `e` ↔ `3`, `a` ↔ `4`, `s` ↔ `5`, `b` ↔ `6` or `8`, `t` ↔ `7`, `g/q` ↔ `9`. Pattern matches the user's own brands: `s4l.ai`, `mk0r.com`, `cl0ne.ai`, `t8r.tech`, `fde10x.com`.
- TLDs ordered by preference: `.ai` (short, premium feel), `.io`, `.com`, `.co`, short-country TLDs like `.bz`, `.me`, `.to`.
- Must still phonetically suggest the category (not random letter soup).

**Track B: Keyword-rich descriptive names (fallback).** Use when Track A returns nothing available under the price cap.

- 3-6 words max; hyphens allowed.
- Keyword-front-loaded (e.g. `apartment-security-cameras.com`, not `best.cameras.for.apartments.com`).
- Mix TLDs: `.com` (preferred), `.io`, `.ai`, plus any niche TLD that fits the category (e.g. `.cameras`, `.tech`, `.studio`).

Seed the subagent with the Phase 1 research brief (`research/brief.md`) and the product's top 3 SEO keywords.

Output: `research/domain-candidates.md` with Track A on top, Track B below. One domain per line, grouped by track.

### 1.5b. Bulk discovery via Cloud Domains search

Run Google Cloud Domains' keyword search against the top 3 SEO keywords from the research brief. This adds Google's own suggestions on top of the subagent list:

```bash
gcloud domains registrations search-domains "apartment security camera" --format=json
```

The `search-domains` response is cached and fast; use it for breadth. Append any attractive suggestions to `research/domain-candidates.md`.

### 1.5c. Check availability and up-to-date price

For every candidate, run:

```bash
gcloud domains registrations get-register-parameters <candidate> --format=json 2>&1
```

This returns live availability and price (unlike `search-domains` which is cached). Parse `availability` (must be `AVAILABLE`) and `yearlyPrice.units` + `yearlyPrice.currencyCode`.

Run candidates in parallel with `xargs -P 5` or a bash loop. Build a table of available domains and first-year price. Filter:

- Drop any domain where `availability != AVAILABLE`.
- Default price cap: **$50/yr**. Anything above goes in a separate "premium" list.
- If `get-register-parameters` returns `TLD_NOT_SUPPORTED` for a candidate, move it to the **Vercel fallback list** (see 1.5e).

### 1.5d. Present top picks to the user

Show the user a ranked short-list (5-10 entries) with columns: `domain`, `length` (chars incl. TLD), `price/yr`, `tld`, `registrar` (Cloud Domains vs Vercel fallback), `track` (A=short, B=keyword-rich), `rationale`.

**Ranking rules:**
1. Track A candidates under 8 characters rank above Track B.
2. Within Track A, ties broken by: `.ai` > `.io` > `.com` > others.
3. Within Track B, `.com` beats everything else; ties broken by shorter length.
4. Always include at least one `.com` if any `.com` is available across either track.

Wait for the user to pick one. Never pre-select. Never auto-buy.

### 1.5e. Purchase via Cloud Domains (primary path)

**Preconditions:**

1. **Contact YAML** (one-time setup per user, reusable across purchases). If `~/.config/gcloud/domain-contacts.yaml` does not exist, create it with the user's WHOIS contact info and `chmod 600` it. Template:
   ```yaml
   allContacts:
     email: you@example.com
     phoneNumber: '+1.XXXXXXXXXX'
     postalAddress:
       regionCode: US
       postalCode: 'XXXXX'
       administrativeArea: CA
       locality: San Francisco
       addressLines: ['123 Example St']
       recipients: ['Your Name']
   ```
   Ask the user for the phone/address the first time; reuse thereafter.

2. **GCP project: REUSE the shared social-autoposter project.** Do NOT create a new project per client. The default shared project is `piastest` (confirmed via the fde10x.com purchase, 2026-04-17). All client sites, domains, DNS zones, and Cloud Run services live here. Only create a new project if the user explicitly overrides.

   Before running any `gcloud` command in this phase, verify the active project:
   ```bash
   gcloud config set project piastest
   gcloud config get-value project  # must print "piastest"
   ```

   **Known org-policy constraint on `piastest`:** `iam.disableServiceAccountKeyCreation` is enforced, which blocks `gcloud iam service-accounts keys create`. Phase 6 CI/CD must use Workload Identity Federation, not SA keys. See Phase 6 for the WIF binding pattern.

3. **Cloud DNS zone** created in the shared project. Name the zone after the domain stem so zones from different clients don't collide:
   ```bash
   gcloud dns managed-zones create <STEM>-zone --dns-name="<domain>." --project=piastest
   ```
   (Example: `fde10x.com` → `fde10x-zone`.)

**Purchase flow:**

1. **Pick the right `--contact-privacy` value per TLD.** Do NOT hardcode `private-contact-data`.
   - **`.com` (and other Squarespace-reseller TLDs): use `redacted-contact-data`.** Since Google Domains was spun off to Squarespace, new `.com` registrations reject `PRIVATE_CONTACT_DATA` with "does not support contact privacy type PRIVATE_CONTACT_DATA."
   - **`.ai`, `.io`, and many others: use `private-contact-data`.**
   - **When in doubt, run `--validate-only` first with `private-contact-data`.** If it errors, parse the allowed values from `contactSettings.privacy` in the error output and retry with the correct flag.

2. **Dry-run / preview first** with `--validate-only`:
   ```bash
   gcloud domains registrations register <domain> \
     --project=piastest \
     --contact-data-from-file=~/.config/gcloud/domain-contacts.yaml \
     --contact-privacy=<redacted-contact-data OR private-contact-data per rule above> \
     --yearly-price="<price from 1.5c>" \
     --cloud-dns-zone=<STEM>-zone \
     --validate-only
   ```
   This returns the exact price + any required `--notices` (some TLDs require HSTS preload or similar).

3. **Pause and ask the user to confirm.** Print literally: `About to register <domain> for $<price>/yr (renews at same). GCP project: piastest. Confirm?` Wait for an explicit yes.

4. On yes, re-run the same command WITHOUT `--validate-only` and with `--quiet` (since contact/price/DNS are already supplied). Add `--notices=<notices>` if step 2 flagged any.

5. Verify: `gcloud domains registrations list --project=piastest` should show the new registration in state `ACTIVE` (may take up to 5 minutes; `REGISTRATION_PENDING` is normal during that window).

Domain purchases are **irreversible**. Per the global Ethics Check rule, step 3 is mandatory.

### 1.5f. Purchase via Vercel (fallback path only)

Use this path ONLY when Cloud Domains returned `TLD_NOT_SUPPORTED` for the user's pick (e.g. niche TLDs like `.cameras`, `.studio`). In that case:

1. Use `playwright-extension` (real Chrome, attached to the user's logged-in session).
2. Navigate to `https://vercel.com/matt-mediarais-projects/~/domains`.
3. Enter the chosen domain. Wait for the dashboard's price + renewal preview.
4. **Pause and ask the user to confirm.** Print: `About to buy <domain> for $<price> via Vercel (Cloud Domains doesn't support this TLD). Confirm?` and wait for an explicit yes.
5. On yes, click "Buy" and wait for the success state.
6. Verify: `vercel domains ls | grep <domain>`.
7. DNS wire-up: in this fallback path, DNS lives in Vercel (not Cloud DNS). Phase 6 must add an A record in Vercel pointing to the Cloud Run Load Balancer's static IP instead of using `gcloud dns record-sets`.

Past incident (skl.bz, 2026-03-01): the card on file was declined and the CLI would have given no preview. Dashboard is mandatory here.

### 1.5g. Record in config.json

Add the project entry to `~/social-autoposter/config.json`. The full shape is owned by the downstream writer (with `weight`, `topics`, `twitter_topics`, `linkedin_topics`, `landing_pages`, `voice`, `icp`, `features`, `differentiator`, etc.). The two fields Phase 1.5 is responsible for:

```json
{
  "name": "<stem>",
  "website": "https://<generic-domain>",
  "brand_domain": "https://<brand-domain>",
  ...rest owned by downstream
}
```

`website` is the generic domain (the one the new site deploys to). `brand_domain` is the original brand URL (kept for reference, may redirect later).

Do NOT add `registrar`, `gcp_project`, or `dns_zone` fields. They are derivable: `gcp_project` is always `piastest`, DNS backend is Cloud DNS when the domain was bought via Cloud Domains and Vercel DNS only in the Vercel fallback path (rare). Downstream scripts don't read these fields.

If the fallback Vercel path was used, note it in the session summary; Phase 6 will branch on the registrar at deploy time by probing (`gcloud domains registrations describe` succeeds = Cloud Domains, else Vercel).

### 1.5h. Hand off to Phase 2

Phase 2 scaffolds under `~/<stem>-website/` (derive the slug from the purchased domain's stem, e.g. `fde10x.com` → `~/fde10x-website/`). Phase 5 deploy and Phase 6 DNS wire-up use the generic domain as the primary target.

### 1.5i. Brand identity persists (the generic domain is SEO-only)

**Hard rule: the generic domain is a URL, not a rebrand.** When Phase 1.5 buys a keyword-rich domain (e.g. `fde10x.com`, `apartment-security-cameras.com`), that domain exists purely to rank on SEO keywords. The client's original brand is untouched and must be carried into the new site.

| Carries over from the brand domain | Stays as the generic domain |
|---|---|
| Brand name (exact spelling, casing, any logomark character) | `metadataBase`, OpenGraph `url`, canonical URLs |
| Brand logo + favicon | Support email addresses (`hello@<generic>.com`) |
| Primary + accent colors | DB table names, internal slugs, PostHog site ID, env var names |
| Heading + body font pairing | GSC property, robots.txt, sitemap URL |
| Tagline / positioning (from the brand site hero) | Cloud Run service name, GCP project slug |

Phase 3 (copy + design system), Phase 3a (Header), Phase 3b (Footer), Phase 3c (metadata + JSON-LD), and Phase 3.5 (email copy, PostHog name) **must** render the brand name from `research/brand-identity.md`, not the generic-domain stem. Email and URL strings keep the generic domain.

Example: for Pias Tech on `fde10x.com`:
- Header wordmark: `π(a|s) PIAS AI` (brand)
- Footer copyright: `© 2026 PIAS AI. All rights reserved.` (brand)
- Organization JSON-LD: `{ "name": "PIAS AI", "legalName": "PIAS - Policy-Informed Agentic Systems" }` (brand)
- Support email: `hello@fde10x.com` (domain)
- Metadata base: `https://fde10x.com` (domain)
- Resend from: `"PIAS AI <you@your-brand.com>"` (both: brand label + domain address)

If the brand name and generic-domain stem happen to be the same (e.g. a client whose brand is literally `FDE10x`), this rule is a no-op. In every other case, use the brand name from `research/brand-identity.md` for every user-facing string and reserve the generic domain for technical identifiers.

---

## Phase 2: Scaffold Project

### 2a. Create Next.js App

```bash
cd ~
npx create-next-app@latest CLIENT-website --typescript --tailwind --eslint --app --src-dir --no-turbopack --import-alias "@/*"
cd ~/CLIENT-website
```

### 2b. Install @seo/components

```bash
npm install @m13v/seo-components@latest
npm install @seo/components@npm:@m13v/seo-components@latest
```

Both entries will appear in `package.json`:
```json
"@m13v/seo-components": "^0.8.15",
"@seo/components": "npm:@m13v/seo-components@^0.8.15"
```

### 2c. Configure Theme (globals.css)

The theme uses CSS custom properties in `:root` mapped into Tailwind 4 via `@theme inline`. Always define both the CSS variable AND the Tailwind mapping. Every client gets a primary color, a dark variant, and an accent color at minimum.

**Source the values from `research/brand-identity.md`** (written in Phase 1d). Do not pick arbitrary colors. If the brand site uses `hsl(217 91% 50%)` as its primary, use `#3b82f6` here. If the brand site has no extractable palette, default to a neutral navy-and-white scheme and flag it for the user to confirm.

```css
/* REQUIRED: pre-register cascade layers so @m13v/seo-components (>=0.14.1)
   library CSS lands in @layer seo-components (lowest priority) and can't
   beat consumer Tailwind utilities. See feedback_seo_components_layer_order
   memory. */
@layer seo-components, theme, base, components, utilities;

@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #1a1a1a;
  --primary: #073c61;       /* Main brand color (navy, blue, green, etc.) */
  --primary-dark: #052d49;  /* Darker shade for footer, dark sections */
  --cta: #e11010;            /* CTA button color (red, orange, etc.) */
  --cta-dark: #ae0c0c;      /* CTA hover state */
  --accent: #d4a843;         /* Accent/highlight color (gold, yellow, etc.) */
  --accent-light: #f0d88a;  /* Light accent for badges */
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-dark: var(--primary-dark);
  --color-cta: var(--cta);
  --color-cta-dark: var(--cta-dark);
  --color-accent: var(--accent);
  --color-accent-light: var(--accent-light);
  --font-sans: var(--font-inter);
  --font-heading: var(--font-oswald);
}

body {
  background: var(--background);
  color: var(--foreground);
}

html {
  scroll-behavior: smooth;
}
```

**Color naming convention:** Use semantic names (primary, cta, accent) in the skill templates below. When building for a specific client, you can also add client-specific names (e.g., `--color-navy`, `--color-red`, `--color-gold`) for readability.

### 2d. Configure Fonts and @seo/components (layout.tsx)

Use `next/font/google` with CSS variable mode. The body font goes on `--font-sans`, the heading font on `--font-heading`. Apply both variables to the `<html>` tag.

**IMPORTANT: Route group architecture.** The root layout must NOT include Header/Footer directly. Instead, use a `(main)` route group with its own layout for pages that need the site Header/Footer. SEO guide pages under `/t/` also go inside `(main)` so they share the same Header/Footer as the rest of the site.

**Root layout (`src/app/layout.tsx`):** fonts, metadata, Organization JSON-LD, @seo/components styles, and `{children}` only.

```tsx
import { Inter, Oswald } from "next/font/google";
import { HeadingAnchors } from "@seo/components";
import { SeoComponentsStyles } from "@seo/components/server";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"] });

// Root layout: NO Header/Footer here
<html lang="en" className={`${inter.variable} ${oswald.variable} h-full antialiased`}>
  <head>
    <SeoComponentsStyles />
  </head>
  <body className="min-h-full flex flex-col font-sans">
    <HeadingAnchors />
    {children}
    {/* Organization JSON-LD here */}
  </body>
</html>
```

- `SeoComponentsStyles` injects the package's prebuilt Tailwind CSS for all @seo/components
- `HeadingAnchors` auto-injects `id` attributes on H2 elements for sidebar linking and anchor navigation

**Main layout (`src/app/(main)/layout.tsx`):** wraps all pages with Header/Footer.

```tsx
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
```

All page routes (homepage, about, wins, faq, precall, AND `/t/` guide pages) go inside `src/app/(main)/`. The `(main)` directory is a Next.js route group: it does not affect URLs.

**Font pairing guide:**
- Professional services: Inter + Oswald (clean, authoritative)
- Creative/lifestyle: Lato + Playfair Display
- Tech/SaaS: DM Sans + Space Grotesk
- Legal/finance: Source Sans 3 + Merriweather

---

## Phase 3: Build All Pages (Design System & Component Blueprints)

This section contains the exact design patterns, Tailwind class combinations, and component structures that produce a polished, professional website. Follow these blueprints precisely for every client site.

**Before writing any page copy or metadata: re-read Phase 1.5i (brand identity persists).** Every user-facing string (Header wordmark, Footer copyright, metadata `title`/`siteName`/`template`, OpenGraph `siteName`, Organization JSON-LD `name`, WebSite JSON-LD `name`, email `from` labels, email subjects, page `title`s, `HtmlSitemap brandName` prop, page narrative copy) uses the **brand name** from `research/brand-identity.md`. The generic-domain stem only appears in URLs, email addresses, env vars, DB tables, and internal slugs. If you find yourself typing the stem into a `title` or JSON-LD `name`, you are making the rename mistake Phase 1.5i exists to prevent.

### 3a. Header Component Blueprint

Sticky nav with logo, dropdown menus, mobile hamburger, and CTA button.

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// PATTERN: Separate simple links from dropdown groups
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/wins", label: "Client Results" },
];

const dropdowns = [
  {
    label: "About",
    items: [
      { href: "/about", label: "Our Story" },
      { href: "/faq", label: "FAQ" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  // Add more dropdown groups as needed
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo: always use next/image with priority */}
          <Link href="/" className="flex items-center">
            <Image src="/images/logo.png" alt="CLIENT_NAME" width={200} height={66} priority />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-heading text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-primary transition-colors"
              />
            ))}

            {/* DROPDOWN PATTERN: group + group-hover for CSS-only dropdowns */}
            {dropdowns.map((dropdown) => (
              <div key={dropdown.label} className="relative group">
                <button className="font-heading text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-primary transition-colors flex items-center gap-1">
                  {dropdown.label}
                  <svg className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full left-0 mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-2 z-50">
                  {dropdown.items.map((item) => (
                    <Link key={item.href} href={item.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors" />
                  ))}
                </div>
              </div>
            ))}

            {/* CTA BUTTON in nav */}
            <Link
              href="/precall"
              className="rounded-md bg-cta px-5 py-2.5 font-heading text-sm font-semibold uppercase tracking-wider text-white hover:bg-cta-dark transition-colors"
            />
          </nav>

          {/* MOBILE HAMBURGER */}
          <button className="lg:hidden p-2 text-gray-700" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* MOBILE NAV: flat list with section headers */}
        {mobileOpen && (
          <nav className="lg:hidden pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block py-2 font-heading text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-primary" onClick={() => setMobileOpen(false)} />
            ))}
            {dropdowns.map((dropdown) => (
              <div key={dropdown.label}>
                <span className="block py-2 font-heading text-xs font-bold uppercase tracking-wider text-gray-400 mt-2">{dropdown.label}</span>
                {dropdown.items.map((item) => (
                  <Link key={item.href} href={item.href} className="block py-2 pl-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-700 hover:text-primary" onClick={() => setMobileOpen(false)} />
                ))}
              </div>
            ))}
            <Link href="/precall" className="block rounded-md bg-cta px-5 py-2.5 text-center font-heading text-sm font-semibold uppercase tracking-wider text-white hover:bg-cta-dark mt-3" onClick={() => setMobileOpen(false)} />
          </nav>
        )}
      </div>
    </header>
  );
}
```

**Key classes:** `sticky top-0 z-50`, `font-heading text-sm font-semibold uppercase tracking-wider`, `invisible opacity-0 group-hover:visible group-hover:opacity-100`

### 3b. Footer Component Blueprint

4-column layout: Brand + description, Company links, Resource links, CTA + contact info. Social icons row at bottom.

```tsx
import Image from "next/image";
import Link from "next/link";

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/sitemap", label: "Sitemap" },  /* REQUIRED: keeps the HTML sitemap discoverable */
];

const resourceLinks = [
  { href: "/wins", label: "Client Results" },
  { href: "/testimonials", label: "Testimonials" },
  // ...more resource links
];

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div>
            <div className="mb-4">
              <Image src="/images/logo.png" alt="CLIENT_NAME" width={200} height={66} />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Short brand description here.
            </p>
          </div>

          {/* Column 2: Company links */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resource links */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent mb-4">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-300 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: CTA + Contact */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-accent mb-4">Ready to Get Started?</h3>
            <p className="text-gray-300 text-sm mb-4">Short CTA teaser text.</p>
            <Link href="/precall" className="inline-block rounded-md bg-cta px-6 py-3 font-heading text-sm font-semibold uppercase tracking-wider text-white hover:bg-cta-dark transition-colors mb-6" />
            <div className="space-y-1 text-sm text-gray-300">
              <p><a href="mailto:EMAIL" className="hover:text-white transition-colors">EMAIL</a></p>
              <p><a href="tel:+1PHONE" className="hover:text-white transition-colors">PHONE</a></p>
              <p>CITY, STATE</p>
            </div>
          </div>
        </div>

        {/* SOCIAL ICONS ROW */}
        <div className="mt-8 flex justify-center gap-4">
          {/* Each social: circular button with SVG icon */}
          {socialLinks.map((social) => (
            <a key={social.label} href={social.href} aria-label={social.label}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white transition-colors hover:bg-accent hover:text-primary">
              {social.icon}
            </a>
          ))}
        </div>

        {/* COPYRIGHT */}
        <div className="mt-8 border-t border-gray-600 pt-8 text-center">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} CLIENT_NAME. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

**Key classes:** `bg-primary-dark text-white`, `text-accent` for section headers, `h-10 w-10 rounded-full bg-gray-700 hover:bg-accent hover:text-primary` for social icons

### 3c. Section Layout Patterns

These are the exact section patterns used throughout the site. Each section follows a consistent structure.

#### Universal Section Wrapper

```
<section className="bg-{COLOR} py-20 sm:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* content */}
  </div>
</section>
```

- Light sections: `bg-white` or `bg-gray-50`
- Dark sections: `bg-primary` with white text
- Section padding: `py-20 sm:py-28` (standard), `py-16 sm:py-24` (compact), `py-12` (stats bar)
- Content max width: `max-w-7xl` for grids, `max-w-3xl` for prose, `max-w-4xl` for CTAs

#### Section Header Pattern

```tsx
<div className="text-center max-w-2xl mx-auto mb-16">
  <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
    Section Title
  </h2>
  <p className="text-gray-600 text-lg">
    Section subtitle/description text.
  </p>
</div>
```

On dark backgrounds, use `text-white` for h2 and `text-gray-300` for description.

### 3d. Homepage Section Blueprints

The homepage follows this exact section order:

#### 1. Hero Section (White/Light Background)

```tsx
<section className="relative bg-white overflow-hidden">
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
    <div className="max-w-3xl">
      <p className="font-heading text-primary text-sm sm:text-base font-semibold uppercase tracking-[0.2em] mb-4">
        TAGLINE / CATEGORY
      </p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6">
        Main Headline <span className="text-accent">(Accent Phrase)</span>
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-4">
        Primary subheadline.
      </p>
      <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10">
        Secondary description with more detail.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* PRIMARY CTA */}
        <Link href="/wins" className="inline-flex items-center justify-center rounded-md bg-cta px-8 py-4 font-heading text-base font-semibold uppercase tracking-wider text-white hover:bg-cta-dark transition-colors">
          Primary Action
        </Link>
        {/* SECONDARY CTA (outline) */}
        <Link href="/about#contact" className="inline-flex items-center justify-center rounded-md border-2 border-primary px-8 py-4 font-heading text-base font-semibold uppercase tracking-wider text-primary hover:bg-primary hover:text-white transition-colors">
          Secondary Action
        </Link>
      </div>
    </div>
  </div>
</section>
```

**Key details:**
- Two CTA buttons side by side: solid bg + outline border
- CTA text: `font-heading text-base font-semibold uppercase tracking-wider`
- CTA padding: `px-8 py-4`
- Hero padding is larger than other sections: `py-24 sm:py-32 lg:py-40`
- Accent color used on a key phrase in the headline via `<span className="text-accent">`

#### 2. Product/Image Strip

```tsx
<section className="bg-white py-8 overflow-hidden">
  <div className="mx-auto max-w-7xl px-4">
    <Image src="/images/product-strip.png" alt="Description" width={1116} height={134} className="w-full h-auto" />
  </div>
</section>
```

#### 3. Stats Bar

```tsx
<section className="bg-white border-b border-gray-100">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="font-heading text-4xl sm:text-5xl font-bold text-primary">{stat.value}</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Data shape:** `{ value: "275+", label: "Books Published" }`

#### 4. Benefits Card Grid (3 columns)

```tsx
<section className="bg-gray-50 py-20 sm:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Section header (centered) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {benefits.map((benefit) => (
        <div key={benefit.title} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          {/* Icon in colored circle */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary mb-6">
            {benefit.icon}
          </div>
          <h3 className="font-heading text-xl font-bold text-primary mb-3">{benefit.title}</h3>
          <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Card pattern:** `bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`
**Icon container:** `w-14 h-14 rounded-lg bg-primary/10 text-primary`

#### 5. Process/How It Works (4 columns, numbered)

```tsx
<section className="bg-white py-20 sm:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    {/* Section header (centered) */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {steps.map((step) => (
        <div key={step.step} className="relative">
          <div className="text-6xl font-heading font-bold text-primary/10 mb-2">{step.step}</div>
          <h3 className="font-heading text-xl font-bold text-primary mb-3">{step.title}</h3>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>
      ))}
    </div>
    {/* Optional team/product photo below */}
    <div className="mt-12">
      <Image src="/images/team-photo.png" alt="Team" width={1024} height={768} className="w-full h-auto rounded-xl shadow-lg" />
    </div>
  </div>
</section>
```

**Step number:** `text-6xl font-heading font-bold text-primary/10` (large, faded background number)

#### 6. Testimonials Section (Dark Background, Glass Cards)

```tsx
<section className="bg-primary py-20 sm:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="text-center max-w-2xl mx-auto mb-16">
      <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">Real Results from Real Clients</h2>
      <p className="text-gray-300 text-lg">Description text.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((t) => (
        <div key={t.name} className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
          {/* Star rating */}
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          {/* Quote */}
          <blockquote className="text-white/90 leading-relaxed mb-6 italic">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          {/* Author with headshot */}
          <div className="border-t border-white/10 pt-4 flex items-start gap-4">
            <Image src={t.image} alt={t.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            <div>
              <p className="font-heading font-bold text-white">{t.name}</p>
              <p className="text-gray-400 text-sm">{t.title}</p>
              <p className="mt-2 text-accent font-heading font-semibold text-sm uppercase tracking-wider">{t.result}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
    {/* CTA button centered below */}
    <div className="text-center mt-12">
      <Link href="/wins" className="inline-flex items-center justify-center rounded-md bg-cta px-8 py-4 font-heading text-base font-semibold uppercase tracking-wider text-white hover:bg-cta-dark transition-colors">
        See All Client Results
      </Link>
    </div>
  </div>
</section>
```

**Glass card:** `bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm`
**Star SVG path:** `M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z`

#### 7. Final CTA Section (White Background)

```tsx
<section className="bg-white py-20 sm:py-28">
  <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
    <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-6">
      Ready to Get Started?
    </h2>
    <p className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto">
      Join our clients who have used [PRODUCT] to grow their business.
    </p>
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <Link href="/precall" className="inline-flex items-center justify-center rounded-md bg-cta px-8 py-4 font-heading text-base font-semibold uppercase tracking-wider text-white hover:bg-cta-dark transition-colors">
        Primary CTA
      </Link>
      <Link href="/wins" className="inline-flex items-center justify-center rounded-md border-2 border-primary px-8 py-4 font-heading text-base font-semibold uppercase tracking-wider text-primary hover:bg-primary hover:text-white transition-colors">
        Secondary CTA
      </Link>
    </div>
  </div>
</section>
```

### 3e. Inner Page Hero Pattern (Dark Background)

Used on About, Wins, FAQ, and all non-homepage pages:

```tsx
<section className="bg-primary py-16 sm:py-24">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
      Page Title
    </h1>
    <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
      Page subtitle.
    </p>
  </div>
</section>
```

Variant with gradient overlay (precall, FAQ):

```tsx
<section className="relative bg-primary overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary opacity-90" />
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
    {/* content with z-index above gradient */}
  </div>
</section>
```

Variant with accent highlight (FAQ):

```tsx
<h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
  Frequently Asked <span className="text-accent">Questions</span>
</h1>
```

### 3f. FAQ Accordion Component Blueprint

Client component with useState for expand/collapse:

```tsx
"use client";
import { useState } from "react";

export function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-heading text-lg font-bold text-primary pr-4">{question}</span>
        <svg
          className={`h-6 w-6 text-primary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 bg-white">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
```

**Usage:** Render in a `<div className="space-y-4">` container within a `bg-gray-50` section. Always include JSON-LD FAQPage schema alongside.

### 3g. Case Study / Wins Page Blueprint

Two tiers: featured case studies (detailed cards) and additional testimonials (grid).

#### Featured Case Study Card

```tsx
interface CaseStudy {
  name: string;
  location: string;
  company: string;
  industry: string;
  books: string[];      // or products, services
  quote: string;
  results: string[];
  highlight: string;    // e.g., "30 to 40x ROI"
  headshot: string;
  bookCover?: string;   // optional product image
}

{/* Card with alternating bg */}
<article className={`rounded-2xl border border-gray-100 overflow-hidden shadow-sm ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
  <div className="p-8 sm:p-12">
    <div className="flex flex-col lg:flex-row lg:items-start gap-8">
      {/* LEFT COLUMN (2/5): Info */}
      <div className="lg:w-2/5">
        {/* Industry badge */}
        <span className="inline-block bg-primary text-white text-xs font-heading font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          {cs.industry}
        </span>
        {/* Headshot + name */}
        <div className="flex items-center gap-4 mb-4">
          <Image src={cs.headshot} alt={cs.name} width={80} height={80} className="rounded-full object-cover w-20 h-20" />
          <div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-1">{cs.name}</h3>
            <p className="text-gray-500 mb-0.5">{cs.company}</p>
            <p className="text-gray-400 text-sm">{cs.location}</p>
          </div>
        </div>
        {/* Book/product tags */}
        <div className="flex flex-wrap gap-2">
          {cs.books.map((book) => (
            <span key={book} className="inline-block bg-accent/20 text-primary text-sm font-medium px-3 py-1 rounded-md italic">{book}</span>
          ))}
        </div>
        {/* Highlight metric box */}
        <div className="bg-primary rounded-lg p-4 text-center">
          <p className="text-accent font-heading font-bold text-xl">{cs.highlight}</p>
        </div>
      </div>

      {/* RIGHT COLUMN (3/5): Quote + Results */}
      <div className="lg:w-3/5">
        <blockquote className="text-lg sm:text-xl text-gray-700 italic leading-relaxed mb-8 border-l-4 border-accent pl-6">
          &ldquo;{cs.quote}&rdquo;
        </blockquote>
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Key Results</p>
        <ul className="space-y-2">
          {cs.results.map((result) => (
            <li key={result} className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700">{result}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</article>
```

#### Additional Testimonials Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {testimonials.map((t) => (
    <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
      {/* Star rating */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="h-4 w-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l..." />
          </svg>
        ))}
      </div>
      <blockquote className="text-gray-700 italic leading-relaxed mb-4 flex-1">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="border-t border-gray-100 pt-3">
        <p className="font-heading font-bold text-primary text-sm">{t.name}</p>
        <p className="text-gray-500 text-xs">{t.company}</p>
        {t.result && (
          <p className="mt-1 text-accent font-heading font-semibold text-xs uppercase tracking-wider">{t.result}</p>
        )}
      </div>
    </div>
  ))}
</div>
```

### 3h. Book a Call / Precall Page Blueprint

Two-column layout: left (2/3) has video + scheduling widget, right (1/3) has testimonials sidebar.

```tsx
{/* Hero with founder headshot + gradient */}
<section className="relative bg-primary overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-primary-dark to-primary opacity-90" />
  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
    <div className="max-w-3xl mx-auto text-center">
      <Image src="/images/founder.png" alt="Founder Name" width={200} height={200} className="rounded-full mx-auto mb-6" />
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
        Ready to Get Started? <span className="text-accent">Book a Call Today!</span>
      </h1>
    </div>
  </div>
</section>

{/* Main Content: 2-column */}
<section className="bg-white py-20 sm:py-28">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* LEFT (2/3): Video + Calendly */}
      <div className="lg:col-span-2 space-y-16">
        {/* Video */}
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-6">Watch This Video</h2>
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <iframe src="https://player.vimeo.com/video/VIDEO_ID?badge=0&autopause=0" width="100%" height="100%" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="w-full h-full" />
          </div>
        </div>
        {/* Scheduling */}
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-6">Select a Time Below</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ minHeight: '700px' }}>
            <iframe src="https://calendly.com/USER/MEETING?embed_type=Inline&hide_event_type_details=1" width="100%" height="700" frameBorder="0" className="w-full" />
          </div>
        </div>
      </div>

      {/* RIGHT (1/3): Testimonial Sidebar */}
      <div className="space-y-6">
        <h3 className="font-heading text-xl font-bold text-primary mb-4">What Our Clients Say</h3>
        {testimonials.map((t) => (
          <div key={t.name} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            {/* Stars */}
            <blockquote className="text-gray-700 leading-relaxed mb-3 italic text-sm">&ldquo;{t.quote}&rdquo;</blockquote>
            <div className="flex items-center gap-3">
              {t.headshot && <Image src={t.headshot} alt={t.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />}
              <p className="font-heading font-bold text-primary text-sm">{t.name}</p>
            </div>
          </div>
        ))}
        {/* Contact Info Card */}
        <div className="bg-primary rounded-xl p-6 mt-8">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Get in Touch</h3>
          <div className="space-y-3">
            <a href="mailto:EMAIL" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-sm">
              {/* Email SVG icon in text-accent */} EMAIL
            </a>
            <a href="tel:+1PHONE" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-sm">
              {/* Phone SVG icon in text-accent */} PHONE
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3i. About Page Blueprint

Section order: Dark Hero, Stats Bar, Founder Story (prose with photo), Team Photo, Values Grid (2-col), "Who We Serve" Checklist Grid (3-col), Contact CTA (dark bg with glass card).

**Values card grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {values.map((v) => (
    <div key={v.title} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
      <h3 className="font-heading text-xl font-bold text-primary mb-3">{v.title}</h3>
      <p className="text-gray-600 leading-relaxed">{v.description}</p>
    </div>
  ))}
</div>
```

**"Who We Serve" checklist grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
  {professions.map((profession) => (
    <div key={profession} className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
      <svg className="h-5 w-5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-primary font-medium">{profession}</span>
    </div>
  ))}
</div>
```

**Contact CTA glass card (dark section):**
```tsx
<div className="bg-white/10 border border-white/20 rounded-2xl p-8 sm:p-12 max-w-xl mx-auto">
  <h3 className="font-heading text-2xl font-bold text-white mb-6">Card Title</h3>
  <div className="space-y-4 text-left mb-8">
    {items.map((item) => (
      <div key={item} className="flex items-start gap-3">
        <svg className="h-5 w-5 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-gray-300">{item}</span>
      </div>
    ))}
  </div>
  <Link href="/precall" className="inline-flex items-center justify-center w-full rounded-md bg-cta px-8 py-4 font-heading text-base font-semibold uppercase tracking-wider text-white hover:bg-cta-dark transition-colors">
    CTA Text
  </Link>
</div>
```

### 3j. Reusable SVG Icons

**Checkmark (for results, features, checklists):**
```tsx
<svg className="h-5 w-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
</svg>
```

**Chevron down (for dropdowns, accordions):**
```tsx
<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
</svg>
```

**Star (for ratings):**
```tsx
<svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
</svg>
```

**Hamburger / Close (for mobile nav):**
```tsx
{/* Hamburger */}
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
{/* Close X */}
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
```

### 3k. Typography Quick Reference

| Element | Classes |
|---------|---------|
| Page h1 | `font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight` |
| Section h2 | `font-heading text-3xl sm:text-4xl font-bold text-primary mb-4` |
| Card h3 | `font-heading text-xl font-bold text-primary mb-3` |
| Body text | `text-gray-600 leading-relaxed` |
| Tagline/label | `font-heading text-sm font-semibold uppercase tracking-wider text-gray-500` |
| Accent label | `font-heading text-sm font-semibold uppercase tracking-[0.2em]` |
| Stat number | `font-heading text-4xl sm:text-5xl font-bold text-primary` |
| Stat label | `text-sm font-semibold uppercase tracking-wider text-gray-500` |
| Quote text | `text-gray-700 italic leading-relaxed` |
| Dark bg h2 | `font-heading text-3xl sm:text-4xl font-bold text-white mb-4` |
| Dark bg body | `text-gray-300 text-lg` |
| CTA button | `font-heading text-base font-semibold uppercase tracking-wider` |
| Nav link | `font-heading text-sm font-semibold uppercase tracking-wider text-gray-700` |

### 3l. Color Usage Quick Reference

| Context | Light section | Dark section |
|---------|--------------|-------------|
| Background | `bg-white` or `bg-gray-50` | `bg-primary` or `bg-primary-dark` |
| Heading | `text-primary` | `text-white` |
| Body text | `text-gray-600` | `text-gray-300` |
| Subtle text | `text-gray-500` | `text-gray-400` |
| Card | `bg-white rounded-xl p-8 shadow-sm border border-gray-100` | `bg-white/5 border border-white/10 rounded-xl p-8` |
| CTA button | `bg-cta text-white hover:bg-cta-dark` | Same |
| Outline button | `border-2 border-primary text-primary hover:bg-primary hover:text-white` | `border-2 border-white text-white hover:bg-white hover:text-primary` |
| Accent highlight | `text-accent` | `text-accent` |
| Badge | `bg-primary text-white text-xs px-3 py-1 rounded-full` | N/A |
| Divider | `border-gray-100` | `border-white/10` |

### 3m. Image Integration Checklist

For every page, verify these images are included:

- [ ] Logo in header (with `priority`) and footer (both via next/image)
- [ ] Founder/team headshots where referenced
- [ ] Client headshot photos next to testimonials (`rounded-full object-cover`)
- [ ] Product images (book covers, screenshots, etc.)
- [ ] Team/office photos in about section (`rounded-xl shadow-lg`)
- [ ] Product gallery or strip on homepage (`w-full h-auto`)
- [ ] All images have descriptive alt text

### 3n. Video and Widget Embeds

```tsx
{/* Vimeo */}
<div className="aspect-video rounded-xl overflow-hidden shadow-lg">
  <iframe
    src="https://player.vimeo.com/video/VIDEO_ID?badge=0&autopause=0"
    width="100%" height="100%" frameBorder="0"
    allow="autoplay; fullscreen; picture-in-picture"
    allowFullScreen title="Video Title" className="w-full h-full"
  />
</div>

{/* Calendly */}
<div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ minHeight: '700px' }}>
  <iframe
    src="https://calendly.com/USERNAME/MEETING_TYPE?embed_type=Inline&hide_event_type_details=1"
    width="100%" height="700" frameBorder="0"
    title="Schedule a Call" className="w-full"
  />
</div>
```

### 3o. Structured Data

Every page gets JSON-LD. Minimum set:

```tsx
// layout.tsx: Organization (site-wide)
{ "@type": "Organization", "name": "...", "url": "...", "foundingDate": "...", "numberOfEmployees": { "@type": "QuantitativeValue", "value": N }, "sameAs": [...] }

// Each page: BreadcrumbList
{ "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1, "name": "Home", "item": "https://domain.com" }, ...] }

// Wins page: Review for each case study
{ "@type": "Review", "author": { "@type": "Person", "name": "..." }, "reviewBody": "...", "itemReviewed": { "@type": "Service", "name": "...", "provider": { "@type": "Organization", "name": "..." } }, "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5 } }

// FAQ page: FAQPage
{ "@type": "FAQPage", "mainEntity": [{ "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }] }

// Homepage: WebPage
{ "@type": "WebPage", "name": "...", "url": "...", "description": "..." }
```

### 3p. SEO Infrastructure

Use the `generateSitemap` helper from `@m13v/seo-components` (v0.12.0+). It walks `src/app` for `page.tsx` files, skips route groups/dynamic segments/api, and applies the default priority tiers. Do NOT hand-roll a sitemap or hardcode URLs.

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { generateSitemap } from "@seo/components/server";

export default function sitemap(): MetadataRoute.Sitemap {
  return generateSitemap({ baseUrl: "https://DOMAIN" });
}
```

Default priority tiers (overridable via the `priorities` option):

| Priority | Pages |
|----------|-------|
| 1.0 | Homepage |
| 0.9 | Core conversion pages (how it works, wins, book, contact, pricing) |
| 0.8 | Secondary pages (about, faq, blog, podcast, testimonials, case-studies) |
| 0.6 | Resource pages (guides, trainings, tools, resources, `/t/`) |
| 0.3 | Legal pages (privacy, terms, legal, cookies) |
| 0.7 | Fallback for unmatched routes |

Also create `src/app/sitemap/page.tsx` as a human-readable HTML sitemap using the `HtmlSitemap` component (served alongside `/sitemap.xml`):

```tsx
import type { Metadata } from "next";
import { HtmlSitemap } from "@seo/components";
import { walkPages } from "@seo/components/server";

export const metadata: Metadata = {
  title: "Sitemap — BRAND",
  description: "Every page on BRAND, grouped by section.",
};

export default function SitemapPage() {
  const pages = walkPages({ includeHome: false });
  return <HtmlSitemap pages={pages} brandName="BRAND" />;
}
```

Create `src/app/robots.ts` with sitemap reference.

---

## Phase 3.5: Integrations (PostHog + Resend + Neon)

Every client site gets the same three integrations: PostHog for analytics, Resend for transactional email, and Neon for a lightweight relational store. The contract matches a prior site (use your reference repo). The pattern is fixed: port it verbatim, change only the brand strings and the `from` address.

**Why these three:**
- PostHog: required for `@seo/components` NewsletterSignup + TrackedCta. The NewsletterSignup component calls `window.posthog?.capture("newsletter_subscribed", ...)` on success, so PostHog must be globally attached before the component mounts. Use `<FullSiteAnalytics>` from `@m13v/seo-components` v0.16.0+ (see 3.5b); it initialises posthog-js, sets `window.posthog`, and installs the `SeoAnalyticsProvider` context in one component.
- Resend: `/api/newsletter` adds the subscriber to an audience and fires a welcome email. `/api/contact` replaces `mailto:` with a server-validated submission that also logs to Neon. Inbound webhook stores replies and forwards them to `you@example.com`.
- Neon: `@neondatabase/serverless` for subscriber/email logs. No pool, no lifecycle. One `DATABASE_URL`, tagged-template SQL.

### 3.5a. Install deps

```bash
npm install posthog-js posthog-node @neondatabase/serverless framer-motion
```

`framer-motion` is already required by NewsletterSignup; install it even if nothing else needs it yet.

### 3.5b. PostHog analytics wiring: use `<FullSiteAnalytics>` from `@m13v/seo-components` v0.16.0+

**Primary recommendation (NEW):** wire analytics with the canonical `<FullSiteAnalytics>` component from `@m13v/seo-components` v0.16.0+. It is an all-in-one that (a) initialises `posthog-js`, (b) sets `window.posthog` so any third-party or library component can capture events, and (c) provides the typed `SeoAnalyticsProvider` context that `@m13v/seo-components` internals (NewsletterSignup, TrackedCta, etc.) rely on. Use it unless the site already has a hand-rolled provider you cannot remove.

**Why this exists:** three of four client sites (Fazm, Cyrano, Mediar) silently dropped `@m13v/seo-components` analytics events because `posthog-js` was loaded via ESM but nobody attached it to `window.posthog`. The library components call `window.posthog?.capture(...)`, which becomes a silent no-op when `window.posthog` is `undefined`. `<FullSiteAnalytics>` eliminates that failure mode.

```tsx
// src/app/layout.tsx (the ROOT layout, not (main)/layout.tsx)
import { FullSiteAnalytics } from "@m13v/seo-components";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FullSiteAnalytics
          posthogKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
          posthogHost={process.env.NEXT_PUBLIC_POSTHOG_HOST}
        >
          {children}
        </FullSiteAnalytics>
      </body>
    </html>
  );
}
```

If you also need to tag events with a `site` group (useful when the m13v org hits the 8-project PostHog cap and multiple client sites piggyback on one project), pass the extra props supported by `<FullSiteAnalytics>` (`siteId`, `loaded`, etc., see `@m13v/seo-components` README for the current API surface).

**`NEXT_PUBLIC_POSTHOG_SITE_ID`** should still be a stable slug like `fde10x`, `assrt`, or `cyrano`, so shared projects can filter cleanly.

### 3.5b-fallback. Hand-rolled PostHog provider (only if `<FullSiteAnalytics>` is unusable)

Use this path only if the site has an existing custom provider you cannot replace, or if you need behaviour the canonical component does not yet expose. It MUST still do all three things: init posthog, attach `window.posthog`, and wrap children so library components work.

```tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { SeoAnalyticsProvider } from "@m13v/seo-components";
import { useEffect } from "react";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  "phc_REPLACE_WITH_CLIENT_KEY";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const SITE_ID = process.env.NEXT_PUBLIC_POSTHOG_SITE_ID || "BRAND_SLUG";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (POSTHOG_KEY && typeof window !== "undefined") {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: false,
        session_recording: { maskAllInputs: true, maskInputOptions: { password: true } },
        loaded: (ph) => {
          ph.group("site", SITE_ID);
          ph.register({ site: SITE_ID });
          window.dispatchEvent(new CustomEvent("posthog:loaded"));
        },
      });
      // MANDATORY: attach to window so @m13v/seo-components (NewsletterSignup,
      // TrackedCta, etc.) can fire events. Without this line the library's
      // window.posthog?.capture(...) calls become silent no-ops.
      (window as unknown as { posthog: typeof posthog }).posthog = posthog;
    }
  }, []);
  if (!POSTHOG_KEY) return <>{children}</>;
  return (
    <PHProvider client={posthog}>
      <SeoAnalyticsProvider posthog={posthog}>{children}</SeoAnalyticsProvider>
    </PHProvider>
  );
}

export { posthog };
```

**The one load-bearing line in the fallback path:**

```ts
(window as unknown as { posthog: typeof posthogLib }).posthog = posthogLib;
```

Any hand-rolled provider that initialises `posthog-js` MUST include this line after `posthog.init(...)`. It is the minimum to make `@m13v/seo-components` analytics work. `<FullSiteAnalytics>` does this for you.

**Why the `site` group matters:** the m13v org has an 8-project cap on PostHog, so new client sites usually have to piggyback on an existing project (e.g. `m13v.com`). Calling `ph.group("site", SITE_ID)` + `ph.register({ site: SITE_ID })` in `loaded` tags every event with the site slug so PostHog insights can filter cleanly across shared projects.

### 3.5c. Wrap the root layout (fallback path only)

If you used `<FullSiteAnalytics>` in 3.5b, this step is already done: `<FullSiteAnalytics>` lives directly in `src/app/layout.tsx` wrapping `{children}`.

If you used the hand-rolled `PostHogProvider` fallback, wrap `{children}` with it in `src/app/layout.tsx` (the ROOT layout, not `(main)/layout.tsx`). PostHog must initialise at the root so both marketing pages and guide pages get pageview tracking and `window.posthog` before any component that uses it.

```tsx
import { PostHogProvider } from "@/components/posthog-provider";
// ... inside <body>:
<PostHogProvider>{children}</PostHogProvider>
```

### 3.5c-verify. Verify `window.posthog` is set (MANDATORY)

After deploying (or running dev locally), open DevTools console on `/` and type:

```js
window.posthog
```

It must return an object (the PostHog client instance), **not `undefined`**. If it is `undefined`:

- `@m13v/seo-components` analytics (NewsletterSignup, TrackedCta, any library component that calls `window.posthog?.capture`) is silently broken.
- Root cause is almost always: the provider initialised posthog-js via ESM but never assigned it to `window.posthog`. Either switch to `<FullSiteAnalytics>`, or add the load-bearing line shown in 3.5b-fallback.

This is a regression guard for the exact bug that dropped analytics on three of four sites prior to `@m13v/seo-components` v0.16.0.

### 3.5d. CTA capture — canonical event names the stats pipeline queries

The stats pipeline at `~/social-autoposter/scripts/project_stats_json.py` queries PostHog for **two specific event names**, scoped by `properties.$host`:
- `cta_click` (underscore, no "d" at the end)  — fired on any marketing CTA
- `schedule_click` — fired on CTAs that route to a booking tool (Cal.com, Calendly, meetings.hubspot.com)

Every CTA on a new client site MUST fire `cta_click`. Every Book-a-Call / schedule / demo CTA MUST fire both `cta_click` AND `schedule_click`. Do not invent new event names like `cta_clicked`; they will be invisible to the dashboard.

**Canonical helper from `@m13v/seo-components` (v0.14+):**

```ts
import { trackScheduleClick } from "@seo/components";
// Fires 'schedule_click' with { destination, site, section, text, component, page }
trackScheduleClick({ destination, site: "<SLUG>", section, text, component });
```

**Standard CTA component** — `src/components/tracked-cta.tsx`:

```tsx
"use client";
import Link from "next/link";
import { posthog } from "@/components/posthog-provider";

export function TrackedCta({
  href, page, section, label, className, children,
}: {
  href: string; page: string; section: string;
  label?: string; className?: string; children: React.ReactNode;
}) {
  const text = label ?? (typeof children === "string" ? children : undefined);
  return (
    <Link href={href} className={className} onClick={() => {
      posthog?.capture("cta_click", { page, section, text, href });
    }}>
      {children}
    </Link>
  );
}
```

Swap every hand-rolled `<Link href="/contact">` for `<TrackedCta href="/contact" page="home" section="hero">`. Unique `page` + `section` per instance keeps PostHog funnels distinguishable.

**Book-a-Call helper** (required for any CTA that points at `cal.com` / `calendly.com`) — `src/lib/booking.ts` + `src/components/BookCallLink.tsx`:

```ts
// src/lib/booking.ts
"use client";
import { trackScheduleClick } from "@seo/components";
import { posthog } from "@/components/posthog-provider";

export const BOOKING_URL = "https://cal.com/team/<TEAM>/<SLUG>"; // fill at scaffold time

export function trackBookingClick(opts: { section?: string; text?: string; component?: string }) {
  const page = typeof window !== "undefined" ? window.location.pathname : undefined;
  posthog?.capture("cta_click", { page, href: BOOKING_URL, text: opts.text, section: opts.section });
  trackScheduleClick({
    destination: BOOKING_URL, site: "<SLUG>",
    section: opts.section, text: opts.text,
    component: opts.component ?? "BookCallLink",
  });
}
```

```tsx
// src/components/BookCallLink.tsx
"use client";
import Link from "next/link";
import { BOOKING_URL, trackBookingClick } from "@/lib/booking";

export function BookCallLink({ children, className, section, onClick }: {
  children: React.ReactNode; className?: string; section?: string; onClick?: () => void;
}) {
  const text = typeof children === "string" ? children : undefined;
  return (
    <Link
      href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
      className={className}
      onClick={() => { trackBookingClick({ section, text, component: "BookCallLink" }); onClick?.(); }}
    >{children}</Link>
  );
}
```

For third-party components that don't accept an `onClick` prop (e.g. `ShimmerButton`, `InlineCta` from `@seo/components`), wrap them in a client-only capture span — `src/components/BookCallTracker.tsx`:

```tsx
"use client";
import { trackBookingClick } from "@/lib/booking";
export function BookCallTracker({ children, section, component }: {
  children: React.ReactNode; section?: string; component?: string;
}) {
  return (
    <span style={{ display: "contents" }}
      onClickCapture={() => trackBookingClick({ section, component: component ?? "BookCallTracker" })}>
      {children}
    </span>
  );
}
```

Usage on SEO topic pages that embed library CTAs:

```tsx
<BookCallTracker section="topic-inline" component="InlineCta">
  <InlineCta heading="..." body="..." linkText="Book the call" href={BOOKING_URL} />
</BookCallTracker>
```

Every Book-a-Call CTA — header, hero, footer, FAQ, per-section, and any topic page — must be one of `<BookCallLink>` or wrapped in `<BookCallTracker>`. This is how the stats pipeline counts `schedule_click` per `$host`.

### 3.5e. NewsletterSignup — drop into `(main)/layout.tsx`

```tsx
import { NewsletterSignup } from "@seo/components";
// ... inside the main layout return, after Footer:
<NewsletterSignup
  description="Short pitch (~10 words). What does the reader get?"
  buttonLabel="Subscribe"
  successMessage="Subscribed. Check your inbox."
/>
```

The component POSTs to `/api/newsletter` by default. 2xx = success (shows success message); non-2xx expects JSON `{error: "..."}`. On success it calls `window.posthog.capture("newsletter_subscribed", ...)`.

### 3.5f. Resend helper — `src/lib/resend-server.ts`

Port verbatim from `~/your-prior-site/src/lib/resend-server.ts`. Change only the default `from` address to `<Brand Name> <matt@DOMAIN>`. The helper uses the REST API directly (no SDK), provides `sendEmail()` and `addToAudience()`, and fails soft when env vars are missing.

### 3.5g. Neon helper — `src/lib/db.ts`

```ts
import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  return neon(url);
}
```

Use tagged templates at call sites: `` const sql = getSql(); await sql`INSERT INTO ...` ``. No pool, no connection lifecycle.

### 3.5h. PostHog server helper — `src/lib/posthog-server.ts` (optional)

Port verbatim from your reference repo when any server route needs `captureServer()`. Not required for the minimum wiring.

### 3.5i. `/api/newsletter` route — `src/app/api/newsletter/route.ts`

Exact pattern from `~/your-prior-site/src/app/api/waitlist/route.ts`. Validates email → adds to Resend audience → sends welcome email → logs to Neon.

```ts
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@"))
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
    if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID)
      return NextResponse.json({ error: "Server config error" }, { status: 500 });

    const audRes = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );
    if (!audRes.ok)
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Your Name from BRAND <matt@DOMAIN>",
        to: [email],
        subject: "Welcome to BRAND",
        html: `<p>Hey!</p><p>Thanks for signing up. Short blurb about what to expect.</p><p>Matt</p>`,
      }),
    });

    try {
      const data = await emailRes.json().catch(() => null);
      const sql = getSql();
      await sql`
        INSERT INTO brand_emails (resend_id, direction, from_email, to_email, subject, status)
        VALUES (${data?.id || null}, 'outbound', 'matt@DOMAIN', ${email}, 'Welcome email', 'sent')
      `;
    } catch (err) { console.error("newsletter log error:", err); }

    // Server-side belt-and-suspenders: also fire newsletter_subscribed from the
    // server. NewsletterSignup fires it client-side, but a failed hydration or
    // ad blocker would swallow that. Server-side guarantees the event lands.
    try {
      const { getPostHogServer } = await import("@/lib/posthog-server");
      const ph = getPostHogServer();
      ph?.capture({
        distinctId: email,
        event: "newsletter_subscribed",
        properties: { source: "api/newsletter", site: "<SLUG>" },
      });
      await ph?.flush();
    } catch (err) { console.error("newsletter posthog server-capture error:", err); }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

Rename `brand_emails` to `<slug>_emails` (e.g. `fde10x_emails`) so multiple clients can share one Neon instance without collisions.

### 3.5j. `/api/contact` route — `src/app/api/contact/route.ts`

Replaces `mailto:hello@DOMAIN`. Validates, sends notification email to `you@example.com`, stores inquiry in Neon, returns `{ok: true}` for the client form handler to render a success state.

```ts
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend-server";
import { getSql } from "@/lib/db";

export async function POST(req: Request) {
  const { email, name, message } = await req.json();
  if (!email?.includes("@") || !message?.trim())
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const result = await sendEmail({
    to: "you@example.com",
    subject: `[BRAND] Contact form: ${name || email}`,
    text: `From: ${name || "(no name)"} <${email}>\n\n${message}`,
  });

  try {
    const sql = getSql();
    await sql`
      INSERT INTO brand_contacts (email, name, message, resend_ok)
      VALUES (${email}, ${name || null}, ${message}, ${result.ok})
    `;
  } catch (err) { console.error("contact log error:", err); }

  if (!result.ok)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

Update the contact page component to POST to this route instead of using `mailto:`.

### 3.5k. Resend inbound webhook (optional, recommended) — `src/app/api/webhooks/resend/route.ts`

Port `~/your-prior-site/src/app/api/webhooks/resend/route.ts`. Handles `email.received` events, logs to Neon, forwards to `you@example.com`. Needed only if the client uses `matt@DOMAIN` as a real inbound address.

### 3.5l. Provision external services (one-time per client)

Same pattern your reference repo's provisioning module uses for VM apps: call the REST APIs with master provisioning keys from keychain, mint per-client resources, save the resulting credentials back to keychain.

**Master keychain entries (reused for every client):**

| Service | Keychain name | Scope |
|---------|---------------|-------|
| PostHog | `PostHog mk0r-provisioning` | Personal API key (m13v org, lists/reads projects) |
| Neon | `Neon mk0r-provisioning` | Account key for `org-steep-sunset-62973058` |
| Resend | `resend-mk0r-users` | Full-access account key |

**Per-client keys saved back to keychain** (pattern `<service>-<slug>-*`):

| Entry | Holds |
|-------|-------|
| `posthog-<slug>-project-key` | Project API token (`phc_...`) going into `NEXT_PUBLIC_POSTHOG_KEY` |
| `resend-<slug>-api-key` | Scoped API key (`re_...`) |
| `resend-<slug>-audience-id` | Audience UUID |
| `neon-<slug>-pooled-url` | Pooled `DATABASE_URL` with `-pooler` |

---

**PostHog** — try to create a dedicated project, fall back to reusing an existing project with a `site` group.

```bash
PH_KEY=$(security find-generic-password -l "PostHog mk0r-provisioning" -w)
ORG_ID="019cbb4d-d40a-0000-d0b7-54e1b67bad33"  # m13v org

# Try to create a dedicated project
curl -s -X POST -H "Authorization: Bearer $PH_KEY" -H "Content-Type: application/json" \
  -d '{"name":"<SLUG>"}' \
  "https://us.posthog.com/api/organizations/$ORG_ID/projects/"
```

If the response is `{"detail":"You have reached the maximum limit of allowed projects..."}`, the m13v plan cap was hit. **Fallback:** list existing projects and reuse one of the client-site projects (usually `m13v.com`). The provider code from 3.5b already isolates events with `ph.group("site", SITE_ID)` + `ph.register({ site: SITE_ID })`, so cross-site event pollution is avoided.

```bash
# Pick the api_token of whichever project hosts this client site.
curl -s -H "Authorization: Bearer $PH_KEY" "https://us.posthog.com/api/projects/" \
  | python3 -c "import json,sys; [print(f\"{p['id']:<7} {p['name']:<20} {p['api_token']}\") for p in json.load(sys.stdin).get('results',[])]"

# Save the project token for later.
security add-generic-password -U -a "you@example.com" -s "posthog-<SLUG>-project-key" -w "phc_..."
```

---

**Neon** — one dedicated project per client (no shared instance; the free tier supports many projects per org).

```bash
NEON_KEY=$(security find-generic-password -l "Neon mk0r-provisioning" -w)
ORG_ID="org-steep-sunset-62973058"

# Create project
curl -s -X POST -H "Authorization: Bearer $NEON_KEY" -H "Content-Type: application/json" \
  -d "{\"project\":{\"name\":\"<SLUG>-prod\",\"region_id\":\"aws-us-east-2\",\"pg_version\":17,\"org_id\":\"$ORG_ID\"}}" \
  "https://console.neon.tech/api/v2/projects" > /tmp/neon.json

# Extract direct URI for DDL, project id for the pooled lookup
DIRECT_URI=$(python3 -c "import json; print(json.load(open('/tmp/neon.json'))['connection_uris'][0]['connection_uri'])")
PROJECT_ID=$(python3 -c "import json; print(json.load(open('/tmp/neon.json'))['project']['id'])")

# Run the schema
psql "$DIRECT_URI" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS <slug>_emails (
  id SERIAL PRIMARY KEY,
  resend_id TEXT,
  direction TEXT NOT NULL DEFAULT 'outbound',
  from_email TEXT,
  to_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_<slug>_emails_created_at ON <slug>_emails(created_at DESC);

CREATE TABLE IF NOT EXISTS <slug>_contacts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  message TEXT,
  resend_ok BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_<slug>_contacts_created_at ON <slug>_contacts(created_at DESC);
SQL

# Fetch the pooled URI (always use pooled for Cloud Run; the non-pooled one leaks connections under load)
POOLED_URL=$(curl -s -H "Authorization: Bearer $NEON_KEY" \
  "https://console.neon.tech/api/v2/projects/$PROJECT_ID/connection_uri?database_name=neondb&role_name=neondb_owner&pooled=true" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['uri'])")

security add-generic-password -U -a "you@example.com" -s "neon-<SLUG>-pooled-url" -w "$POOLED_URL"
```

**Extending the contact schema:** if the site's contact form collects extra fields (outcome, timeline, budget, role, etc.), add them as nullable columns to `<slug>_contacts` *and* extend the `/api/contact` INSERT. The baseline above is the minimum every client ships with.

---

**Resend** — one domain + one audience + one full-access API key per client. **The API key must be `full_access`.** `sending_access` alone cannot write to `/audiences/:id/contacts` and returns `401 restricted_api_key`; we verified this the hard way on fde10x.

```bash
RESEND_KEY=$(security find-generic-password -l "resend-mk0r-users" -w)

# 1. Add domain
curl -s -X POST -H "Authorization: Bearer $RESEND_KEY" -H "Content-Type: application/json" \
  -d '{"name":"<DOMAIN>","region":"us-east-1"}' \
  "https://api.resend.com/domains" > /tmp/resend_domain.json
cat /tmp/resend_domain.json | python3 -m json.tool
# Copy the DKIM value, SPF value, MX target, and the domain `id` from the response.
# The DNS records go into the client's Cloud DNS zone in Phase 6e.

# 2. Create audience
curl -s -X POST -H "Authorization: Bearer $RESEND_KEY" -H "Content-Type: application/json" \
  -d '{"name":"<SLUG> newsletter"}' \
  "https://api.resend.com/audiences"
# → {"id":"<audience-uuid>","name":"..."}

# 3. Create a full-access API key
curl -s -X POST -H "Authorization: Bearer $RESEND_KEY" -H "Content-Type: application/json" \
  -d '{"name":"<SLUG>","permission":"full_access"}' \
  "https://api.resend.com/api-keys"
# → {"id":"...","token":"re_..."}

# 4. Save both back to keychain
security add-generic-password -U -a "you@example.com" -s "resend-<SLUG>-api-key" -w "re_..."
security add-generic-password -U -a "you@example.com" -s "resend-<SLUG>-audience-id" -w "<audience-uuid>"

# 5. After DNS records from Phase 6e are in place, trigger verification
curl -s -X POST -H "Authorization: Bearer $RESEND_KEY" \
  "https://api.resend.com/domains/<DOMAIN_ID>/verify"
# Then poll status until "verified":
curl -s -H "Authorization: Bearer $RESEND_KEY" \
  "https://api.resend.com/domains/<DOMAIN_ID>" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status'))"
```

**Security note on `full_access`:** a full-access key can send from *any* domain in the account and mutate *any* audience. The blast radius is wider than a scoped key, but Resend's permission model has only `sending_access` vs `full_access`; since newsletter subscription needs audience writes, `full_access` is the only option. Keep the key in keychain and as a Cloud Run runtime env var; do not commit it to git.

### 3.5m. Env var inventory (set during Phase 6 deploy)

| Var | Build-time / Runtime | Where it goes |
|-----|---------------------|---------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Build-arg (Docker) | Baked into client bundle |
| `NEXT_PUBLIC_POSTHOG_HOST` | Build-arg (Docker) | Baked into client bundle |
| `NEXT_PUBLIC_POSTHOG_SITE_ID` | Build-arg (Docker) | Baked into client bundle; used by provider to set `site` group |
| `RESEND_API_KEY` | Runtime | Cloud Run `--set-env-vars` |
| `RESEND_AUDIENCE_ID` | Runtime | Cloud Run `--set-env-vars` |
| `DATABASE_URL` | Runtime | Cloud Run `--set-env-vars` |

Dockerfile must declare the two `NEXT_PUBLIC_*` vars as `ARG` and `ENV` in the builder stage so `next build` bakes them in. Runtime-only secrets go on the Cloud Run service, NOT the Dockerfile.

**CRITICAL — strip trailing `\n` from every env var before setting.** Follow the global rule in `~/.claude/CLAUDE.md` (use `echo -n` and verify with `gcloud run services describe`). A single `\n` on `RESEND_API_KEY` will break signing and produce silent 401s.

### 3.5n. Exit criteria

- `NewsletterSignup` renders in dev; submitting a valid email returns 2xx and the success message
- `/api/newsletter` POST (curl against local dev with real Resend creds) adds the contact to Resend audience AND writes a row to `<slug>_emails`
- `/api/contact` POST lands a notification email in `you@example.com` AND writes a row to `<slug>_contacts`
- `window.posthog` is non-undefined in the browser console on `/` (type `window.posthog` in DevTools — must return an object, not `undefined`; see 3.5c-verify)
- Clicking a `TrackedCta` fires a `cta_clicked` event visible in PostHog Live events
- Submitting the `NewsletterSignup` fires a `newsletter_subscribed` event visible in PostHog Live events (confirms `@m13v/seo-components` library analytics path works end-to-end)
- No trailing `\n` in any env var (verify with `gcloud run services describe ... --format='value(spec.template.spec.containers[0].env)'`)

---

## Phase 4: SEO Guide Pages Infrastructure

**Scope of this phase:** wire the infrastructure so the `gsc-seo-page` skill and `~/social-autoposter/seo/generate_page.py` can land `/t/<slug>` pages. Do NOT write guide pages here. Every guide page is produced by the generator, which reads the authoritative component registry from `@m13v/seo-components` and handles SERP research, theme detection, and content writing.

### 4a. Configure next.config for guide discovery

Wrap the Next.js config with `withSeoContent` to enable build-time guide discovery:

```ts
import type { NextConfig } from "next";
import { withSeoContent } from "@seo/components/next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@seo/components"],
};

export default withSeoContent(nextConfig, { contentDir: "src/app/(main)/t" });
```

At `next build`, this walks the content directory and generates `.next/seo-guides-manifest.json` so runtime code (sidebar, chat API) can read the page inventory without filesystem access on Cloud Run.

### 4b. Create guide index at `src/app/(main)/t/page.tsx`

```tsx
import { discoverGuides } from "@seo/components/server";
import { Breadcrumbs, AnimatedSection, breadcrumbListSchema } from "@seo/components";

export const metadata = { title: "Guides | CLIENT_NAME", description: "..." };

export default function GuidesIndex() {
  const guides = discoverGuides();
  const jsonLd = breadcrumbListSchema([
    { name: "Home", url: "https://DOMAIN" },
    { name: "Guides", url: "https://DOMAIN/t" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} className="mb-8" />
        <h1 className="font-heading text-4xl font-bold text-primary mb-8">Guides</h1>
        <div className="grid gap-4">
          {guides.map((guide, i) => (
            <AnimatedSection key={guide.slug} delay={i * 0.03}>
              <a href={guide.href} className="block p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="font-heading text-xl font-semibold text-primary">{guide.title}</h2>
                {guide.description && <p className="text-gray-600 mt-2">{guide.description}</p>}
              </a>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </>
  );
}
```

This is the only `/t/*` file this skill creates. All `/t/<slug>/page.tsx` files are produced by the generator below.

### 4c. Register the site and hand off to the generator

Once 4a and 4b are in place, this skill's responsibility for SEO pages ends. For every guide page:

1. Register the new site in `~/social-autoposter/config.json` under `projects.<slug>` with its repo path, production domain, and `/t` route. The SEO pipelines read this file to know which sites exist.
2. Run the generator for the first page to verify the setup end to end:

   ```bash
   cd ~/social-autoposter
   python3 seo/generate_page.py \
     --product <slug-from-config.json> \
     --keyword "your target query" \
     --slug "your-target-query" \
     --trigger manual
   ```

3. From here on, use the `gsc-seo-page` skill for any single-page generation, or let the cron pipelines (`seo/run_gsc_pipeline.sh`, `seo/run_serp_pipeline.sh`) drive it automatically.

The generator reads `@m13v/seo-components/registry.json` from the target repo's `node_modules`, so the component palette stays in sync with the installed version of the library. Do not hardcode a list of components in this skill or in any consumer repo.

### 4d. Add sidebar navigation (optional)

```tsx
// src/components/site-sidebar.tsx (server component)
import { walkPages } from "@seo/components/server";
import { SitemapSidebarClient } from "./site-sidebar-client";

export function SiteSidebar() {
  const pages = walkPages({ excludePaths: ["api"] });
  return <SitemapSidebarClient pages={pages} />;
}

// src/components/site-sidebar-client.tsx (client component)
"use client";
import { SitemapSidebar } from "@seo/components";

export function SitemapSidebarClient({ pages }: { pages: any[] }) {
  return <SitemapSidebar items={pages} />;
}
```

### 4e. Add AI guide chat (optional)

Create `src/app/api/guide-chat/route.ts`:

```tsx
import { createGuideChatHandler } from "@seo/components/server";

export const POST = createGuideChatHandler({
  app: "CLIENT_SLUG",
  brand: "CLIENT_NAME",
  siteDescription: "Brief description of the client's business.",
  contentDir: "src/app/(main)/t",
});
```

Then add `<GuideChatPanel />` from `@seo/components` to guide pages or the layout.

### 4f. Component inventory

The authoritative list of `@seo/components` exports is `~/seo-components/registry.json` (emitted at build) and `~/seo-components/src/index.ts`. Do not maintain a duplicate list in this skill or in consumer repos. The generator reads the registry directly when it writes a page.

---

## Phase 5: Build and Verify

### 5a. Build

```bash
cd ~/CLIENT-website && npm run build
```

Fix any TypeScript or build errors. All routes must compile and generate successfully.

### 5b. Visual Comparison

Use the isolated browser to take full-page screenshots of the new site and compare side-by-side with the originals from Phase 1e.

**Check for:**
- [ ] Real logo (not text placeholder)
- [ ] All client/team photos present
- [ ] Video embeds working (not placeholder cards)
- [ ] Scheduling widget embedded (not placeholder)
- [ ] Book/product images displayed
- [ ] Social media icons in footer
- [ ] Navigation matches original site structure
- [ ] Color scheme matches client brand
- [ ] Mobile responsive (test at 375px width)

---

## Phase 6: Deploy

### 6a. Git and GitHub

```bash
cd ~/CLIENT-website
git init && git add -A
git commit -m "Initial commit: CLIENT_NAME website"
gh repo create m13v/CLIENT-website --private --source=. --push
```

### 6b. Ensure `next.config.ts` has standalone output

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

### 6c. Create Dockerfile

```dockerfile
FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be present at build time because Next.js bakes them
# into the client bundle. Runtime env vars on Cloud Run are too late.
#
# Do NOT declare `ARG NEXT_PUBLIC_* / ENV NEXT_PUBLIC_*=$ARG` here. If the ARG
# is not passed at `docker build` time (and `gcloud run deploy --source .`
# does NOT pass `--set-build-env-vars` through to Dockerfile ARGs — that flag
# is buildpacks-only), the ENV ends up as an empty string, and Next.js's env
# load order puts process.env ABOVE .env.production, so the committed key is
# silently stomped. The client bundle then ships with the variable undefined,
# dead-code-eliminates the init call, and the site is dark in PostHog.
# (This footgun bit fde10x-website on 2026-04-19.)
#
# Instead, commit a `.env.production` file at repo root (see 6c.env-production
# below for the .gitignore exception). Next.js loads it automatically during
# `npm run build` inside this image. That pattern works for the full set of
# NEXT_PUBLIC_* values we care about here (all public — phc_ PostHog keys,
# site id slugs, public API hosts). Real secrets never live in NEXT_PUBLIC_*
# at all; they go through runtime env in 6d.

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
EXPOSE 8080
CMD ["node", "server.js"]
```

### 6c.env-production. Commit `.env.production` with the public client-side vars

Allow the file into git with a targeted `.gitignore` exception:

```
# ~/.claude/skills/setup-client-website/templates/.gitignore append:
# env files (can opt-in for committing if needed)
.env*
# NEXT_PUBLIC_POSTHOG_KEY is a phc_ ingestion key: public by design,
# inlined into the client bundle anyway. Committing it lets the Docker
# build pick it up without --build-arg plumbing.
!.env.production
```

Contents of `.env.production` (single source of truth for build-time NEXT_PUBLIC_* values):

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_SITE_ID=<SLUG>
```

**Rule:** only values that are safe in a public git repo go here. `phc_` PostHog ingestion keys are by design publicly embedded in the client bundle — an attacker can scrape them off the deployed site anyway. A `phx_` personal API key, a `re_` Resend API key, or any database URL is NOT in this file. Those live in Cloud Run runtime env only (see 6d).

If the stem project (e.g. `piastest`) is shared between multiple sites, ensure each site uses its own `NEXT_PUBLIC_POSTHOG_SITE_ID` slug so shared PostHog projects can filter by `properties.site`.

### 6d. Deploy Cloud Run service

```bash
# Create GCP project (or reuse existing)
gcloud services enable run.googleapis.com dns.googleapis.com \
  compute.googleapis.com certificatemanager.googleapis.com \
  --project=GCP_PROJECT_ID

# Deploy (source-based: Cloud Build builds the Dockerfile automatically).
# Use --set-env-vars (NOT --update-env-vars) so deletions also take effect.
# CRITICAL: use --set-env-vars "KEY=value" with NO trailing newlines; every global env
# var rule from ~/.claude/CLAUDE.md applies here.
#
# Do NOT pass --set-build-env-vars for NEXT_PUBLIC_*. That flag is buildpacks-only
# and does NOT propagate to Dockerfile ARGs. NEXT_PUBLIC_* values come from the
# committed .env.production file (see 6c.env-production). This flag path was
# the root cause of the 2026-04-19 fde10x-website posthog-dark incident.
#
# --set-env-vars is for RUNTIME secrets: they never need to be baked into the
# client bundle. Anything the server reads via process.env.X at request time
# (database URL, Resend API key, anything server-side) goes here.
gcloud run deploy SERVICE_NAME \
  --source . \
  --region us-central1 \
  --project GCP_PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars "^|^RESEND_API_KEY=re_...|RESEND_AUDIENCE_ID=...|DATABASE_URL=postgresql://..." \
  --quiet

# Verify runtime env vars have no trailing \n
gcloud run services describe SERVICE_NAME --project=GCP_PROJECT_ID --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" 2>&1 | tr ';' '\n' | grep -E "RESEND|DATABASE"

# Verify NEXT_PUBLIC_POSTHOG_KEY actually got baked into the client bundle
# (not undefined, dead-code-eliminated away):
curl -sS https://DOMAIN/ -o /tmp/home.html
grep -oE '/_next/static/chunks/[^"\\]+\.js' /tmp/home.html | sort -u | while IFS= read -r url; do
  if curl -sS "https://DOMAIN$url" | grep -qE 'phc_[A-Za-z0-9]{20,}'; then
    echo "OK: phc_ baked in $url"; break
  fi
done
```

### 6e. Set up HTTPS Load Balancer with custom domain

```bash
# Reserve static IP
gcloud compute addresses create PROJECT_NAME-ip --global --project=GCP_PROJECT_ID
STATIC_IP=$(gcloud compute addresses describe PROJECT_NAME-ip --global --project=GCP_PROJECT_ID --format="value(address)")

# Create Cloud DNS zone and A record
gcloud dns managed-zones create DNS_ZONE --dns-name="DOMAIN." \
  --description="DNS zone for DOMAIN" --project=GCP_PROJECT_ID
gcloud dns record-sets create DOMAIN. --type=A --ttl=300 \
  --rrdatas="$STATIC_IP" --zone=DNS_ZONE --project=GCP_PROJECT_ID

# Certificate Manager DNS authorization + managed cert
gcloud certificate-manager dns-authorizations create PROJECT_NAME-dns-auth \
  --domain="DOMAIN" --project=GCP_PROJECT_ID
AUTH_CNAME=$(gcloud certificate-manager dns-authorizations describe PROJECT_NAME-dns-auth \
  --project=GCP_PROJECT_ID --format="value(dnsResourceRecord.name)")
AUTH_DATA=$(gcloud certificate-manager dns-authorizations describe PROJECT_NAME-dns-auth \
  --project=GCP_PROJECT_ID --format="value(dnsResourceRecord.data)")
gcloud dns record-sets create "${AUTH_CNAME}." --type=CNAME --ttl=300 \
  --rrdatas="${AUTH_DATA}." --zone=DNS_ZONE --project=GCP_PROJECT_ID
gcloud certificate-manager certificates create PROJECT_NAME-cert \
  --domains="DOMAIN" --dns-authorizations=PROJECT_NAME-dns-auth --project=GCP_PROJECT_ID
gcloud certificate-manager maps create PROJECT_NAME-cert-map --project=GCP_PROJECT_ID
gcloud certificate-manager maps entries create PROJECT_NAME-cert-entry \
  --map=PROJECT_NAME-cert-map --certificates=PROJECT_NAME-cert \
  --hostname="DOMAIN" --project=GCP_PROJECT_ID

# Serverless NEG, backend, URL map, HTTPS proxy, forwarding rule
gcloud compute network-endpoint-groups create PROJECT_NAME-neg \
  --region=us-central1 --network-endpoint-type=serverless \
  --cloud-run-service=SERVICE_NAME --project=GCP_PROJECT_ID
gcloud compute backend-services create PROJECT_NAME-backend --global --project=GCP_PROJECT_ID
gcloud compute backend-services add-backend PROJECT_NAME-backend --global \
  --network-endpoint-group=PROJECT_NAME-neg \
  --network-endpoint-group-region=us-central1 --project=GCP_PROJECT_ID
gcloud compute url-maps create PROJECT_NAME-urlmap \
  --default-service=PROJECT_NAME-backend --global --project=GCP_PROJECT_ID
gcloud compute target-https-proxies create PROJECT_NAME-https-proxy \
  --url-map=PROJECT_NAME-urlmap --certificate-map=PROJECT_NAME-cert-map \
  --global --project=GCP_PROJECT_ID
gcloud compute forwarding-rules create PROJECT_NAME-https-rule --global \
  --target-https-proxy=PROJECT_NAME-https-proxy --address=PROJECT_NAME-ip \
  --ports=443 --project=GCP_PROJECT_ID

# HTTP to HTTPS redirect
gcloud compute url-maps import PROJECT_NAME-http-redirect --global --project=GCP_PROJECT_ID <<EOF
name: PROJECT_NAME-http-redirect
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
EOF
gcloud compute target-http-proxies create PROJECT_NAME-http-proxy \
  --url-map=PROJECT_NAME-http-redirect --global --project=GCP_PROJECT_ID
gcloud compute forwarding-rules create PROJECT_NAME-http-rule --global \
  --target-http-proxy=PROJECT_NAME-http-proxy --address=PROJECT_NAME-ip \
  --ports=80 --project=GCP_PROJECT_ID

# Lock down Cloud Run to LB-only traffic
gcloud run services update SERVICE_NAME \
  --ingress=internal-and-cloud-load-balancing \
  --region=us-central1 --project=GCP_PROJECT_ID

# Resend domain DNS records (from Phase 3.5 external-service provisioning).
# Without these, the welcome email + inbound webhook won't work.
# Values come from Resend's "Add domain" dialog; paste them in.
gcloud dns record-sets create "send.DOMAIN." --type=TXT --ttl=300 \
  --rrdatas='"v=spf1 include:amazonses.com ~all"' \
  --zone=DNS_ZONE --project=GCP_PROJECT_ID
gcloud dns record-sets create "resend._domainkey.DOMAIN." --type=TXT --ttl=300 \
  --rrdatas='"<DKIM value from Resend — usually 2 quoted chunks>"' \
  --zone=DNS_ZONE --project=GCP_PROJECT_ID
gcloud dns record-sets create "send.DOMAIN." --type=MX --ttl=300 \
  --rrdatas="10 feedback-smtp.us-east-1.amazonses.com." \
  --zone=DNS_ZONE --project=GCP_PROJECT_ID

# Click "Verify" in the Resend dashboard after these propagate (~2-5 min).
```

### 6f. Create GitHub Actions workflow for CI/CD (WIF, not SA keys)

**The shared project `piastest` enforces the org policy `iam.disableServiceAccountKeyCreation`.** You cannot create a service account JSON key. All CI/CD auth must go through Workload Identity Federation.

**Pre-step: bind the deploy SA to the existing WIF pool** (one-time per new repo):

```bash
REPO="m13v/<STEM>-website"
DEPLOY_SA="<STEM>-deployer@piastest.iam.gserviceaccount.com"

# Create the deploy SA if it doesn't exist
gcloud iam service-accounts create <STEM>-deployer \
  --project=piastest \
  --display-name="<STEM> Cloud Run deployer"

# Grant the roles it needs
for role in roles/run.admin roles/cloudbuild.builds.editor roles/storage.admin roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding piastest \
    --member="serviceAccount:${DEPLOY_SA}" \
    --role="${role}"
done

# Bind the SA to the repo via WIF
gcloud iam service-accounts add-iam-policy-binding "${DEPLOY_SA}" \
  --project=piastest \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/882907665967/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

Existing WIF infrastructure in `piastest` (do not recreate):
- Pool: `projects/882907665967/locations/global/workloadIdentityPools/github-pool`
- Provider: `projects/882907665967/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- Attribute mapping: `attribute.repository=assertion.repository; google.subject=assertion.sub`

**CRITICAL: the provider has an `attributeCondition` that gates which GitHub orgs/repos may authenticate.** Binding the SA is not enough; if the repo owner isn't allowed by the condition, auth fails with `unauthorized_client: The given credential is rejected by the attribute condition` BEFORE the SA binding is ever checked. This caused the fde10x-website deploy to fail on 2026-04-17 until the condition was updated.

Check the current condition:

```bash
gcloud iam workload-identity-pools providers describe github-provider \
  --location=global --workload-identity-pool=github-pool --project=piastest \
  --format="value(attributeCondition)"
```

If your repo owner is not covered, widen the condition to include `assertion.repository.startsWith('<owner>/')`:

```bash
gcloud iam workload-identity-pools providers update-oidc github-provider \
  --location=global --workload-identity-pool=github-pool --project=piastest \
  --attribute-condition="assertion.repository=='LINQLABS/piastest' || assertion.repository=='assrt-ai/assrt-freestyle' || assertion.repository=='assrt-ai/assrt' || assertion.repository.startsWith('m13v/')"
```

Always pass the FULL existing condition plus your new clause; this flag replaces, not appends. The `startsWith('<owner>/')` form future-proofs every subsequent `<owner>/*-website` repo under that owner.

Create `.github/workflows/deploy-cloudrun.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGION: us-central1
  PROJECT_ID: piastest
  SERVICE_ACCOUNT: <STEM>-deployer@piastest.iam.gserviceaccount.com
  WIF_PROVIDER: projects/882907665967/locations/global/workloadIdentityPools/github-pool/providers/github-provider

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      id-token: write  # REQUIRED for WIF
    concurrency:
      group: deploy-production
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ env.WIF_PROVIDER }}
          service_account: ${{ env.SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy <STEM>-website \
            --source . \
            --region ${{ env.REGION }} \
            --project ${{ env.PROJECT_ID }} \
            --quiet

      - name: Verify deployment
        run: |
          PUBLIC=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "https://DOMAIN/" || echo "000")
          echo "Public health (https://DOMAIN/): HTTP $PUBLIC"
          if [ "$PUBLIC" != "200" ]; then
            echo "::warning::Public health check returned $PUBLIC"
          fi
```

**No GitHub repo secrets are needed for auth.** The `id-token: write` permission + WIF provider identity handle it. Do NOT create `GCP_SA_KEY` or `credentials_json` secrets. If the org policy is ever lifted for a new project, that alternative path is out of scope for this skill.

### 6g. Wire Cal.com bookings into the central stats pipeline

Bookings flow: `cal.com` (team webhook) → `https://social-autoposter-website.vercel.app/api/webhooks/cal` → Neon `cal_bookings` table → stats pipeline counts per `client_slug`.

Three places to touch for a new client. Skip any that already match.

**1) Add the client slug's keyword to the webhook's client_slug detection.** Edit `~/social-autoposter-website/src/app/api/webhooks/cal/route.ts`. The detection block is an ordered `if/else if`. Add the new client **above** any branch whose keyword might overlap (e.g. FD10X team calls include "mediar" in the title because they live under the Mediar team, so the `fd10x` branch must precede the `mediar` branch):

```ts
} else if (
  eventSlug.includes("<SLUG>") ||
  title.includes("<SLUG>") ||
  // add brand aliases here if the title/slug use them (e.g. "pias" for fde10x)
) {
  clientSlug = "<SLUG>";
}
```

Commit, push, and confirm the preview alias at `https://social-autoposter-website.vercel.app/api/webhooks/cal` returns `200` on `GET`.

**2) Register the webhook at the cal.com team level** (NOT on the personal account — every event type in the team, including this client's, will inherit the team webhook). In the browser, `https://app.cal.com/settings/developer/webhooks` → **New** → pick the relevant team (often `Mediar`) → Subscriber URL `https://social-autoposter-website.vercel.app/api/webhooks/cal` → leave all default event triggers checked (`BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`, `BOOKING_REJECTED`, `BOOKING_REQUESTED`, plus the rest) → Enabled → Save. A secret is optional; the current handler does not verify signatures.

**3) Add `"<SLUG>": "<SLUG>"` to `get_client_slug()`** in `~/social-autoposter/scripts/project_stats.py`:

```python
def get_client_slug(project_name):
    """Map project name to cal_bookings client_slug."""
    return {"Cyrano": "cyrano", "PieLine": "pieline", "fazm": "fazm", "S4L": "s4l",
            "<SLUG>": "<SLUG>"}.get(project_name)
```

This file is locked with `chflags uchg` — temporarily unlock with `chflags nouchg`, edit, re-lock with `chflags uchg`.

**Verification (one real booking then cancel):**

```bash
# After the webhook is registered, book any slot on https://cal.com/team/<TEAM>/<SLUG>
# Then check the Neon cal_bookings row landed with client_slug=<SLUG>:
export BOOKINGS_DATABASE_URL=$(grep '^BOOKINGS_DATABASE_URL=' ~/social-autoposter/.env | cut -d= -f2-)
python3 - <<PY
import re, psycopg2
conn = psycopg2.connect("$BOOKINGS_DATABASE_URL"); cur = conn.cursor()
cur.execute("SELECT cal_booking_id, client_slug, status FROM cal_bookings ORDER BY created_at DESC LIMIT 3")
for r in cur.fetchall(): print(r)
PY
# Should include one row with client_slug='<SLUG>'. Cancel the booking when done.
```

---

## Phase 7: Register for Tracking

### 7a. Add to SEO Pages Dashboard

Edit `~/social-autoposter-website/src/app/api/dashboard/seo-pages/route.ts` and add the new client to `CLIENT_SEO_CONFIG`:

```ts
clientname: {
  domain: "clientdomain.com",
  baseUrl: "https://clientdomain.com",
  githubRepo: "<GITHUB_ORG>/CLIENT-website",
},
```

### 7b. Google Search Console

GSC domain registration, DNS TXT verification, and sitemap submission are handled programmatically via the Site Verification + Search Console APIs. See the `gsc-seo-page` skill, "Onboarding a New Product > Step 1", for the exact commands. Do that step now if you want the domain verified before the final checklist, or defer it to the hand-off in Phase 9. Do not use the browser flow.

---

## Phase 8: Final Verification Checklist

- [ ] Site loads at production URL
- [ ] All pages render with real content (no placeholder text)
- [ ] All images load (no broken images, no "VIDEO COMING SOON" placeholders)
- [ ] Logo appears in header and footer
- [ ] Navigation dropdowns work on desktop and mobile
- [ ] Video embeds play
- [ ] Scheduling widget loads
- [ ] Social media icons present in footer
- [ ] JSON-LD structured data on every page (validate with Google Rich Results Test)
- [ ] XML sitemap accessible at /sitemap.xml
- [ ] HTML sitemap page accessible at /sitemap (rendered via `HtmlSitemap`)
- [ ] Sitemap link in Footer (under Company column) so humans can reach `/sitemap` without typing the URL
- [ ] robots.txt accessible at /robots.txt
- [ ] Lighthouse desktop score >= 85
- [ ] Lighthouse mobile score >= 70
- [ ] No console errors on any page
- [ ] All internal links work (no 404s)
- [ ] SEO guide pages at /t/{slug} load with components from @seo/components (Breadcrumbs, ProofBanner, InlineCta, StickyBottomCta, FaqSection)
- [ ] Guide index at /t lists all discovered guides
- [ ] `@seo/components` installed and `transpilePackages` + `withSeoContent` configured in `next.config.ts`
- [ ] HeadingAnchors injects `id` attributes on H2 elements (inspect DOM)
- [ ] SeoComponentsStyles loads in `<head>` (check page source)
- [ ] Build generates `.next/seo-guides-manifest.json` with correct page count
- [ ] PostHog captures `pageview`, `cta_click`, `schedule_click`, `newsletter_subscribed` — validate with: `curl -sS https://DOMAIN/ -o /tmp/h.html && grep -oE '/_next/static/chunks/[^"\\]+\.js' /tmp/h.html | while read u; do curl -sS https://DOMAIN$u | grep -m1 -oE 'phc_[A-Za-z0-9]+' && break; done` (a hit proves the phc_ is baked into the client bundle)
- [ ] `window.posthog` defined on every public page (DevTools console: `window.posthog` returns an object, not `undefined`)
- [ ] Cal.com team webhook registered → verified with one real booking landing in Neon `cal_bookings` with the client's `client_slug`, then cancelled (see Phase 6g)
- [ ] `scripts/project_stats.py` `get_client_slug()` maps the project name to the client's slug
- [ ] `config.json` entry has `links.booking`, `posthog.project_id`, `posthog.api_key_env` — and stats pipeline dry-run shows non-zero pageviews / `cta_click` / bookings counts for the slug
- [ ] Google Search Console ownership verified
- [ ] Client added to SEO pages dashboard

---

## Phase 9: Hand Off to the SEO Pipeline

Phase 8 verifies the site itself is healthy. Phase 9 is the hand-off: the pipeline that writes `/t/{slug}/` guide pages on a schedule (GSC queries + DataForSEO SERP) lives in `~/social-autoposter/` and is owned by the **`gsc-seo-page`** skill, not this one.

Invoke `gsc-seo-page` > "Onboarding a New Product" and run its five steps:

1. Register the domain in Google Search Console via the Site Verification + Search Console APIs (no browser).
2. Add the product to `~/social-autoposter/config.json` with `weight` and the five `landing_pages` fields (`repo`, `github_repo`, `base_url`, `gsc_property`, `product_source`).
3. Activate `com.m13v.social-gsc-seo` and `com.m13v.social-serp-seo` via `launchctl load`.
4. Backfill GSC queries with `seo/fetch_gsc_queries.py --product ClientName`.
5. Verify with `select_product.py --require-gsc`, inspect `gsc_queries` in Postgres, and force one `run_gsc_pipeline.sh` run.

Prerequisites that this skill is responsible for (check before handing off):

- Site deployed at `https://DOMAIN`, `/t/` scaffolding built, sitemap at `https://DOMAIN/sitemap.xml`
- `~/social-autoposter/.env` defines `GSC_SA_KEY_PATH`, `GSC_SA_EMAIL`, `GSC_GCP_PROJECT`, `GSC_ADMIN_EMAIL`, `CLOUD_DNS_PROJECT` (Cloud DNS path only), `DATABASE_URL`
- The client repo is cloned at the path you will write into `landing_pages.repo`

Everything else, including the exact commands, field semantics, and checklist, lives in `gsc-seo-page`. Do not duplicate that content here.

---

## Phase 10: Register in the Social Autoposter Pipeline

Phase 9 wired the **SEO pipeline** (`/t/{slug}` page generation from GSC + SERP). Phase 10 wires the **posting / engagement / DM pipeline** so the Reddit, Twitter, LinkedIn, GitHub, Moltbook, and Octolens jobs in `~/social-autoposter/` can mention this product, match against its topics, and respect its voice.

The canonical source is `~/social-autoposter/config.json` → `projects[]`. Each entry drives:

- Which threads/posts across all platforms are scored as relevant (matched against `topics`, `twitter_topics`, `linkedin_topics`, `github_search_topics`)
- What the engagement scripts can honestly say about the product (`description`, `features`, `differentiator`, `icp`)
- What voice and banned phrases apply (`voice.tone`, `voice.never`)
- Links inserted into replies (`website`, `github`, `links.*`, `booking_link`)

### 10a. Build the project entry from the research brief

The `research-brief.md` produced in **Phase 1f** already has every field Phase 10 needs. Map it like this:

| `projects[]` field | Source in `research-brief.md` |
|---|---|
| `name` | client name (lowercase slug, matches `landing_pages.repo` basename) |
| `description` | "Positioning angle" (one sentence) |
| `differentiator` | "3 differentiators" condensed into one sentence |
| `icp` | "ICP" section, primary persona description + JTBD |
| `topics` | "5 messaging pillars" rewritten as search-friendly keyword phrases |
| `twitter_topics` / `linkedin_topics` | same pillars re-tuned per platform (shorter for Twitter, more formal for LinkedIn) |
| `features` | "Proof points" list, converted to capability statements |
| `voice.tone` | derived from client intake (brand voice) + ICP language |
| `voice.never` | "Banned clichés" list, verbatim |
| `links.booking` | the actual cal.com URL the site's Book CTAs point at (`https://cal.com/team/<TEAM>/<SLUG>`) — not a placeholder like `/contact` |
| `posthog.project_id` | numeric PostHog project id this site writes to (usually the shared S4L project `330744` unless the site has a dedicated project) |
| `posthog.api_key_env` | name of the env var holding the PostHog **personal** API key used to *read* stats (e.g. `POSTHOG_PERSONAL_API_KEY`). Stores the variable NAME, never the value — config.json is not for secrets. |

`links.booking` and `posthog.{project_id,api_key_env}` are what `scripts/project_stats_json.py` reads to query pageviews + `cta_click` + `schedule_click` events filtered by `properties.$host`. Missing them means the client is dark on the Social Autoposter stats dashboard even if the site itself is firing events.

If a field has no good source in the brief, leave it out rather than invent. **Never fabricate features, stats, or differentiators** — every claim in `projects[]` is used verbatim in public replies across all platforms.

**Secrets reminder:** `config.json` is gitignored from the social-autoposter repo but is not a secrets store. Only put **references** to env vars there (`api_key_env`), never the key itself. Actual values live in `~/social-autoposter/.env` and in platform env (Vercel/Cloud Run).

### 10b. Inspect an existing entry as template

Before writing, read one existing entry to match the schema exactly:

```bash
jq '.projects[] | select(.name == "fazm")' ~/social-autoposter/config.json
```

Copy the shape. Do not invent fields the pipeline does not already consume.

### 10c. Idempotent append

Write the entry to a temp JSON file, then merge:

```bash
NEW="/tmp/new-project.json"   # full entry for the client
CFG="$HOME/social-autoposter/config.json"
NAME=$(jq -r '.name' "$NEW")

# 0. Validate new entry parses
jq empty "$NEW" || { echo "invalid JSON in $NEW"; exit 1; }

# 1. Backup
cp "$CFG" "$CFG.bak.$(date +%Y%m%d-%H%M%S)"

# 2. Abort if name already present (don't silently overwrite)
if jq -e --arg n "$NAME" '.projects[] | select(.name == $n)' "$CFG" >/dev/null; then
  echo "Project '$NAME' already in config.json — edit by hand or remove the existing entry first."
  exit 1
fi

# 3. Append, validate, show diff, then write
jq --argjson new "$(cat "$NEW")" '.projects += [$new]' "$CFG" > "$CFG.tmp"
jq empty "$CFG.tmp" || { echo "merge produced invalid JSON"; rm "$CFG.tmp"; exit 1; }
diff <(jq '.projects | map(.name)' "$CFG") <(jq '.projects | map(.name)' "$CFG.tmp")
mv "$CFG.tmp" "$CFG"
```

Review the diff before `mv`. If it shows anything other than a single project-name addition, abort.

### 10d. Merge with Phase 9's `landing_pages` block

If Phase 9 already ran and added a partial entry with only `landing_pages` + `weight`, do not duplicate. Instead, detect the existing entry and merge Phase 10's fields into it:

```bash
jq --arg n "$NAME" --argjson new "$(cat "$NEW")" '
  .projects |= map(if .name == $n then . + $new else . end)
' "$CFG" > "$CFG.tmp" && mv "$CFG.tmp" "$CFG"
```

Phase 9 fields (`weight`, `landing_pages`) are never overwritten by Phase 10. Phase 10 fields (`description`, `topics`, `features`, `voice`, etc.) are never touched by Phase 9.

### 10e. Smoke test

After writing, confirm the posting pipeline can see the new project:

```bash
cd ~/social-autoposter && python3 -c "
import json
d = json.load(open('config.json'))
p = next((x for x in d['projects'] if x['name'] == '$NAME'), None)
assert p, 'not found'
for k in ['description','topics','features','voice','website']:
    assert k in p, f'missing {k}'
print('ok:', p['name'], '-', p['description'][:80])
"
```

Then do a single dry-run of one engagement script to make sure the new entry does not crash the matcher (replace `engage-reddit.sh` with whichever script is least expensive to dry-run):

```bash
bash ~/.claude/skills/social-autoposter/engage.sh --project "$NAME" --dry-run 2>&1 | tail -30
```

If the dry-run surfaces a schema mismatch, fix the new entry before letting real runs fire.

### 10f. Exit criteria

Phase 10 is done when all of these are true:

- `jq '.projects[] | select(.name=="<client>")' config.json` returns a full entry (not just `landing_pages`)
- `topics`, `twitter_topics`, `linkedin_topics`, and `features` all trace to the research brief
- `voice.never` matches the brief's "Banned clichés" list verbatim
- At least one engagement script dry-run completes without a schema error
- `config.json.bak.*` backup exists in case of rollback

Only after Phase 10 passes is the client actually "in the pipeline." Until then, they have a website but no posting, no engagement, no DM outreach, and no Octolens mention tracking.

---

## Quick Reference: File Structure

```
~/CLIENT-website/
  public/
    images/
      logo.png              # Client logo
      founder.png            # Founder headshot
      team-photo.png         # Team photo
      client-1.png           # Client headshots for testimonials
      client-2.png
      product-1.png          # Product images
      book-covers-strip.png  # Product gallery (if applicable)
  src/
    app/
      globals.css            # Tailwind 4 theme with brand colors
      layout.tsx             # Root layout: fonts, metadata, JSON-LD ONLY (no Header/Footer)
      sitemap.ts             # One-liner: generateSitemap({ baseUrl })
      sitemap/page.tsx       # Human-readable HTML sitemap via HtmlSitemap
      robots.ts              # Crawl directives
      (main)/                # Route group: all pages with site Header/Footer
        layout.tsx           # Adds Header + Footer around children
        page.tsx             # Homepage
        about/page.tsx
        wins/page.tsx
        how-it-works/page.tsx
        precall/page.tsx
        faq/page.tsx
        blog/page.tsx
        testimonials/page.tsx
        privacy-policy/page.tsx
        t/                   # SEO guide pages (inside (main), so they get Header/Footer)
          guide-topic-1/page.tsx
          guide-topic-2/page.tsx
    components/
      Header.tsx
      Footer.tsx
      FAQItem.tsx             # Accordion client component
      site-sidebar.tsx        # Server component wrapping walkPages() (optional)
      site-sidebar-client.tsx # Client component wrapping SitemapSidebar (optional)
```
