---
name: new-product-website
description: End-to-end workflow for launching a new product landing page — scaffolding, theming, analytics, waitlist, domain, SEO, and deployment.
---

# New Product Website

Automates the full launch workflow for a new product landing page: scaffold Next.js app, configure theme, wire analytics + waitlist, deploy to Google Cloud Run, configure domain, and register with Google Search Console.

## Arguments

Provide the product name, domain, and a brief description. Example: `"MyApp at myapp.com — AI-powered task management"`

## Prerequisites

- **Google Cloud** project under the m13v.com org (or create a new one)
- **Domain** purchased (managed via Google Cloud DNS)
- **PostHog** account (US or EU instance)
- **Resend** account for transactional/waitlist emails (shared account across projects)
- **Neon** Postgres database for email storage
- **Google Search Console** access
- **GitHub** org or personal account

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 + Framer Motion
- PostHog for analytics
- Resend for outbound emails, inbound receiving, and waitlist
- Neon Postgres for email storage (`{product}_emails` table)
- Google Cloud Run for hosting (with HTTPS Load Balancer + Certificate Manager)
- Google Search Console for SEO

## Workflow

### 1. Scaffold Project

```bash
mkdir ~/PROJECT_NAME && cd ~/PROJECT_NAME
```

Create these files manually (don't use `create-next-app` — it hangs on interactive prompts):

| File | Purpose |
|------|---------|
| `package.json` | next 15, react 19, framer-motion, lucide-react, posthog-js, @neondatabase/serverless |
| `tsconfig.json` | Standard Next.js TS config with `@/*` path alias |
| `next.config.ts` | `output: "standalone"` for Cloud Run Docker builds |
| `postcss.config.mjs` | tailwindcss + autoprefixer |
| `tailwind.config.ts` | Custom theme (accent color, fonts, animations) |
| `src/app/globals.css` | Dark theme, gradient-text, noise-overlay, grid-bg |
| `src/app/layout.tsx` | Root layout with metadata, OG tags, PostHogProvider |
| `src/app/page.tsx` | Compose all sections |

### 2. Build Sections

Standard landing page sections (adapt content per product):

1. **Navbar** — Sticky, backdrop blur, logo + nav links + CTA button
2. **Hero** — Headline + subheadline + terminal/demo animation + waitlist CTA
3. **Stats** — Animated counters with real metrics
4. **How It Works** — 3-step flow (no decorative icons)
5. **Results/Social Proof** — Real examples styled as platform cards
6. **Features** — 6-card grid (no decorative icons)
7. **FAQ** — Accordion with AnimatePresence
8. **CTA** — Email capture form + "No spam" disclaimer
9. **Footer** — Logo + nav links

### 3. Wire PostHog

1. Log in to your PostHog instance
2. Create new project named after the product
3. Copy the project API key (starts with `phc_`)
4. Note the PostHog host URL (e.g., `https://us.i.posthog.com` or `https://eu.i.posthog.com`)
5. Create `src/components/posthog-provider.tsx`:

```tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (POSTHOG_KEY && typeof window !== "undefined") {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
      });
    }
  }, []);
  if (!POSTHOG_KEY) return <>{children}</>;
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
export { posthog };
```

6. Wrap children in `layout.tsx` with `<PostHogProvider>`

### 4. Wire Resend (Domain + Waitlist + Inbound)

#### 4a. Add & Verify Domain in Resend

1. Log in to Resend > Domains > Add domain > enter `DOMAIN`
2. Resend will show DNS records (DKIM TXT, SPF MX + TXT). Add them via Google Cloud DNS:

```bash
# Find the managed zone for your domain
gcloud dns managed-zones list --project=GCP_PROJECT_ID

# DKIM
gcloud dns record-sets create resend._domainkey.DOMAIN. --type=TXT --ttl=300 \
  --rrdatas='"DKIM_VALUE"' --zone=DNS_ZONE --project=GCP_PROJECT_ID
# SPF
gcloud dns record-sets create send.DOMAIN. --type=MX --ttl=300 \
  --rrdatas='10 feedback-smtp.us-east-1.amazonses.com.' --zone=DNS_ZONE --project=GCP_PROJECT_ID
gcloud dns record-sets create send.DOMAIN. --type=TXT --ttl=300 \
  --rrdatas='"v=spf1 include:amazonses.com ~all"' --zone=DNS_ZONE --project=GCP_PROJECT_ID
# DMARC (deliverability + anti-spoofing)
gcloud dns record-sets create _dmarc.DOMAIN. --type=TXT --ttl=300 \
  --rrdatas='"v=DMARC1; p=none;"' --zone=DNS_ZONE --project=GCP_PROJECT_ID
```

3. Wait for Resend to verify (usually < 5 min)

#### 4b. Enable Inbound Receiving

1. In Resend > Domains > click your domain > Records tab
2. Toggle **"Enable Receiving"** ON
3. Resend shows an MX record for `@`. Add it:

```bash
gcloud dns record-sets create DOMAIN. --type=MX --ttl=300 \
  --rrdatas='10 inbound-smtp.us-east-1.amazonaws.com.' --zone=DNS_ZONE --project=GCP_PROJECT_ID
```

4. Verify with `dig MX DOMAIN +short` — should show `10 inbound-smtp.us-east-1.amazonaws.com.`
5. Wait for Resend to verify the MX record

#### 4c. Create Email Storage Table

Create a `{product}_emails` table in the project's Neon database:

```sql
CREATE TABLE IF NOT EXISTS {product}_emails (
    id SERIAL PRIMARY KEY,
    resend_id TEXT,
    direction TEXT NOT NULL DEFAULT 'inbound',
    from_email TEXT,
    to_email TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    status TEXT DEFAULT 'received',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_{product}_emails_created_at ON {product}_emails(created_at DESC);
```

#### 4d. Create Inbound Webhook

Create `src/app/api/webhooks/resend/route.ts`:

```tsx
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
  };
}

async function fetchInboundContent(emailId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { text: data?.text, html: data?.html };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const payload: ResendWebhookPayload = await request.json();
    console.log("[PRODUCT Webhook]", payload.type, payload.data.email_id);

    if (payload.type !== "email.received") {
      return NextResponse.json({ success: true, message: "ignored" });
    }

    const { data } = payload;

    // IMPORTANT: Only process emails addressed to @DOMAIN (shared Resend account)
    const isForUs = data.to.some((addr) => addr.endsWith("@DOMAIN"));
    if (!isForUs) {
      return NextResponse.json({ success: true, message: "not for DOMAIN" });
    }

    const content = await fetchInboundContent(data.email_id);

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO {product}_emails (resend_id, direction, from_email, to_email, subject, body_text, body_html, status)
      VALUES (${data.email_id}, 'inbound', ${data.from}, ${data.to[0] || ""}, ${data.subject || ""}, ${content?.text || data.text || null}, ${content?.html || data.html || null}, 'received')
    `;

    // Forward to inbox
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "PRODUCT Inbound <matt@DOMAIN>",
          to: "your-email@domain.com",
          subject: `[PRODUCT Inbound] ${data.subject || "(no subject)"}`,
          text: `From: ${data.from}\nTo: ${data.to.join(", ")}\n\n${content?.text || data.text || "(no body)"}`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRODUCT Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
```

**Replace** `PRODUCT`, `DOMAIN`, and `{product}` with actual values.

#### 4e. Register Webhook with Resend

After deploying (step 5), register the webhook:

```bash
curl -X POST "https://api.resend.com/webhooks" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "https://DOMAIN/api/webhooks/resend", "events": ["email.received"]}'
```

#### 4f. Create Waitlist/Audience

1. In Resend > Audience > create "{Product} Waitlist"
2. Copy the audience ID
3. Create `src/app/api/waitlist/route.ts`:

```tsx
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@"))
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
    if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID)
      return NextResponse.json({ error: "Server config error" }, { status: 500 });

    // Add contact to audience
    const audienceRes = await fetch(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );

    if (!audienceRes.ok)
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });

    // Send welcome email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Matt <matt@DOMAIN>",
        to: [email],
        subject: "You're in — PRODUCT access request received",
        html: `<!-- Customize welcome email HTML here -->`,
      }),
    });

    // Log outbound email to DB
    try {
      const emailData = await emailRes.json().catch(() => null);
      const sql = neon(process.env.DATABASE_URL!);
      await sql`
        INSERT INTO {product}_emails (resend_id, direction, from_email, to_email, subject, status)
        VALUES (${emailData?.id || null}, 'outbound', 'matt@DOMAIN', ${email}, ${"Welcome email"}, 'sent')
      `;
    } catch (logErr) {
      console.error("Email log error:", logErr);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

4. CTA form calls `/api/waitlist` + fires `posthog?.capture("waitlist_signup", { email })`

### 5. Integrate @seo/components (SEO Guide Pages)

Install the shared SEO components package for programmatic guide pages, sidebar navigation, AI chat, and structured data helpers.

#### 5a. Install the package

```bash
npm install @m13v/seo-components@latest
# Also create the shorter alias for imports
npm install @seo/components@npm:@m13v/seo-components@latest
```

Both entries will appear in `package.json`:
```json
"@m13v/seo-components": "^0.8.15",
"@seo/components": "npm:@m13v/seo-components@^0.8.15"
```

#### 5b. Configure next.config.ts

```ts
import type { NextConfig } from "next";
import { withSeoContent } from "@seo/components/next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@seo/components"],
};

export default withSeoContent(nextConfig, { contentDir: "src/app/t" });
```

`withSeoContent` wraps your config to enable build-time guide discovery. At `next build`, it walks `src/app/t/` and generates `.next/seo-guides-manifest.json` so runtime code (sidebar, chat) can read the page inventory without filesystem access.

#### 5c. Update root layout

Add `SeoComponentsStyles` and `HeadingAnchors` to `src/app/layout.tsx`:

```tsx
import { HeadingAnchors } from "@seo/components";
import { SeoComponentsStyles } from "@seo/components/server";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <head>
        <SeoComponentsStyles />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <HeadingAnchors />
        {children}
      </body>
    </html>
  );
}
```

- `SeoComponentsStyles` injects the package's prebuilt Tailwind CSS
- `HeadingAnchors` auto-injects `id` attributes on H2 elements for sidebar linking and anchor navigation

#### 5d. Create guide pages at `src/app/t/{slug}/page.tsx`

Each guide page imports components and JSON-LD helpers from the package:

```tsx
import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  FaqSection,
  InlineCta,
  StickyBottomCta,
  ProofBand,
  AnimatedSection,
  StepTimeline,
  AnimatedChecklist,
  BentoGrid,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

export const metadata: Metadata = {
  title: "Guide Title | PRODUCT",
  description: "Guide description for search engines.",
};

export default function GuidePage() {
  const jsonLd = [
    articleSchema({ title: "...", description: "...", url: "...", datePublished: "..." }),
    breadcrumbListSchema([
      { name: "Home", url: "https://DOMAIN" },
      { name: "Guides", url: "https://DOMAIN/t" },
      { name: "Guide Title", url: "https://DOMAIN/t/guide-slug" },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/t" },
          { label: "Guide Title" },
        ]} className="mb-8" />
        <AnimatedSection>
          <h1 className="text-4xl font-bold mb-4">Guide Title</h1>
          <ArticleMeta date="2026-01-15" readTime="8 min" />
        </AnimatedSection>
        <ProofBand stats={[{ value: "10x", label: "Faster" }]} />
        <nav className="bg-gray-50 rounded-lg p-6 mb-12">
          {/* Table of contents with anchor links */}
        </nav>
        <section id="section-1">
          <AnimatedSection><h2>First Topic</h2></AnimatedSection>
          <p>2,000+ words of expert-level content...</p>
        </section>
        <InlineCta heading="Ready to try PRODUCT?" href="/waitlist" label="Join Waitlist" />
        <section id="section-2">
          <AnimatedSection><h2>Second Topic</h2></AnimatedSection>
          <StepTimeline steps={[{ title: "Step 1", description: "..." }]} />
        </section>
        <FaqSection items={[{ question: "Q?", answer: "A." }]} />
      </article>
      <StickyBottomCta heading="Try PRODUCT free" href="/waitlist" label="Join Waitlist" />
    </>
  );
}
```

#### 5e. Create guide index at `src/app/t/page.tsx`

```tsx
import { discoverGuides } from "@seo/components/server";
import { Breadcrumbs, AnimatedSection, breadcrumbListSchema } from "@seo/components";

export const metadata = { title: "Guides | PRODUCT", description: "..." };

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
        <h1 className="text-4xl font-bold mb-8">Guides</h1>
        <div className="grid gap-4">
          {guides.map((guide, i) => (
            <AnimatedSection key={guide.slug} delay={i * 0.03}>
              <a href={guide.href} className="block p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-xl font-semibold">{guide.title}</h2>
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

#### 5f. Add sidebar navigation (optional)

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

#### 5g. Add AI guide chat (optional)

Create `src/app/api/guide-chat/route.ts`:

```tsx
import { createGuideChatHandler } from "@seo/components/server";

export const POST = createGuideChatHandler({
  app: "PRODUCT_SLUG",
  brand: "PRODUCT_NAME",
  siteDescription: "Brief description of the product for AI context.",
  contentDir: "src/app/t",
});
```

Then add `<GuideChatPanel />` from `@seo/components` to guide pages or the layout.

#### 5h. Available components reference

**JSON-LD helpers:** `breadcrumbListSchema`, `faqPageSchema`, `articleSchema`, `howToSchema`

**Content components:** `Breadcrumbs`, `ArticleMeta`, `FaqSection`, `ComparisonTable`, `ProofBand`, `ProofBanner`, `InlineTestimonial`

**Animation components:** `AnimatedBeam`, `MorphingText`, `NumberTicker`, `OrbitingCircles`, `Particles`, `Marquee`, `ShimmerButton`, `GradientText`, `TextShimmer`, `TypingAnimation`, `ShineBorder`, `BackgroundGrid`

**Layout components:** `BentoGrid`, `BeforeAfter`, `AnimatedDemo`, `GlowCard`, `ParallaxSection`, `StepTimeline`, `MotionSequence`, `AnimatedSection`, `AnimatedMetric`, `MetricsRow`

**Code/technical display:** `AnimatedCodeBlock`, `CodeComparison`, `TerminalOutput`, `FlowDiagram`, `SequenceDiagram`, `AnimatedChecklist`

**CTA components:** `InlineCta`, `StickyBottomCta`

**Interactive:** `SitemapSidebar`, `HeadingAnchors`, `GuideChatPanel`

**Video/animation:** `RemotionClip`, `LottiePlayer`

### 6. Deploy to Google Cloud Run

#### 5a. Ensure `next.config.ts` has standalone output

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

#### 5b. Create Dockerfile

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
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

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

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
EXPOSE 8080

CMD ["node", "server.js"]
```

Add any additional `NEXT_PUBLIC_*` build args if the project uses them (e.g., Firebase config). Runtime-only secrets (RESEND_API_KEY, DATABASE_URL) are set on the Cloud Run service directly.

#### 5c. Init git, push to GitHub

```bash
git init && git add -A && git commit -m "Initial landing page"
gh repo create YOUR_GITHUB_ORG/PROJECT_NAME --private --source=. --push
```

#### 5d. Create GCP project and Cloud DNS zone (if needed)

```bash
# Create project (or reuse existing)
gcloud projects create GCP_PROJECT_ID --name="PROJECT_NAME" --organization=ORG_ID
gcloud billing projects link GCP_PROJECT_ID --billing-account=BILLING_ACCOUNT

# Enable required APIs
gcloud services enable run.googleapis.com \
  dns.googleapis.com \
  compute.googleapis.com \
  certificatemanager.googleapis.com \
  --project=GCP_PROJECT_ID

# Create Cloud DNS zone for the domain
gcloud dns managed-zones create DNS_ZONE \
  --dns-name="DOMAIN." \
  --description="DNS zone for DOMAIN" \
  --project=GCP_PROJECT_ID

# Get nameservers and update your domain registrar to point to them
gcloud dns managed-zones describe DNS_ZONE --project=GCP_PROJECT_ID --format="value(nameServers)"
```

#### 5e. Deploy Cloud Run service

```bash
# First deploy (source-based, Cloud Build builds the container automatically)
gcloud run deploy SERVICE_NAME \
  --source . \
  --region us-central1 \
  --project GCP_PROJECT_ID \
  --allow-unauthenticated \
  --set-env-vars "RESEND_API_KEY=KEY" \
  --set-env-vars "RESEND_AUDIENCE_ID=ID" \
  --set-env-vars "DATABASE_URL=postgresql://..." \
  --quiet
```

The `--source .` flag uses Cloud Build to build the Dockerfile and push to Artifact Registry automatically.

#### 5f. Set up HTTPS Load Balancer with custom domain

```bash
# Reserve a static IP
gcloud compute addresses create PROJECT_NAME-ip --global --project=GCP_PROJECT_ID
STATIC_IP=$(gcloud compute addresses describe PROJECT_NAME-ip --global --project=GCP_PROJECT_ID --format="value(address)")

# Create DNS A record pointing domain to the static IP
gcloud dns record-sets create DOMAIN. --type=A --ttl=300 \
  --rrdatas="$STATIC_IP" --zone=DNS_ZONE --project=GCP_PROJECT_ID

# Create Certificate Manager DNS authorization
gcloud certificate-manager dns-authorizations create PROJECT_NAME-dns-auth \
  --domain="DOMAIN" --project=GCP_PROJECT_ID

# Get the CNAME record for DNS authorization and add it
AUTH_CNAME=$(gcloud certificate-manager dns-authorizations describe PROJECT_NAME-dns-auth \
  --project=GCP_PROJECT_ID --format="value(dnsResourceRecord.name)")
AUTH_DATA=$(gcloud certificate-manager dns-authorizations describe PROJECT_NAME-dns-auth \
  --project=GCP_PROJECT_ID --format="value(dnsResourceRecord.data)")
gcloud dns record-sets create "${AUTH_CNAME}." --type=CNAME --ttl=300 \
  --rrdatas="${AUTH_DATA}." --zone=DNS_ZONE --project=GCP_PROJECT_ID

# Create managed SSL certificate
gcloud certificate-manager certificates create PROJECT_NAME-cert \
  --domains="DOMAIN" \
  --dns-authorizations=PROJECT_NAME-dns-auth \
  --project=GCP_PROJECT_ID

# Create certificate map and entry
gcloud certificate-manager maps create PROJECT_NAME-cert-map --project=GCP_PROJECT_ID
gcloud certificate-manager maps entries create PROJECT_NAME-cert-entry \
  --map=PROJECT_NAME-cert-map \
  --certificates=PROJECT_NAME-cert \
  --hostname="DOMAIN" \
  --project=GCP_PROJECT_ID

# Create serverless NEG pointing to Cloud Run
gcloud compute network-endpoint-groups create PROJECT_NAME-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=SERVICE_NAME \
  --project=GCP_PROJECT_ID

# Create backend service
gcloud compute backend-services create PROJECT_NAME-backend \
  --global --project=GCP_PROJECT_ID
gcloud compute backend-services add-backend PROJECT_NAME-backend \
  --global \
  --network-endpoint-group=PROJECT_NAME-neg \
  --network-endpoint-group-region=us-central1 \
  --project=GCP_PROJECT_ID

# Create URL map and HTTPS proxy
gcloud compute url-maps create PROJECT_NAME-urlmap \
  --default-service=PROJECT_NAME-backend \
  --global --project=GCP_PROJECT_ID
gcloud compute target-https-proxies create PROJECT_NAME-https-proxy \
  --url-map=PROJECT_NAME-urlmap \
  --certificate-map=PROJECT_NAME-cert-map \
  --global --project=GCP_PROJECT_ID

# Create forwarding rule
gcloud compute forwarding-rules create PROJECT_NAME-https-rule \
  --global \
  --target-https-proxy=PROJECT_NAME-https-proxy \
  --address=PROJECT_NAME-ip \
  --ports=443 \
  --project=GCP_PROJECT_ID

# Optional: HTTP to HTTPS redirect
gcloud compute url-maps import PROJECT_NAME-http-redirect --global --project=GCP_PROJECT_ID <<EOF
name: PROJECT_NAME-http-redirect
defaultUrlRedirect:
  httpsRedirect: true
  redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
EOF
gcloud compute target-http-proxies create PROJECT_NAME-http-proxy \
  --url-map=PROJECT_NAME-http-redirect \
  --global --project=GCP_PROJECT_ID
gcloud compute forwarding-rules create PROJECT_NAME-http-rule \
  --global \
  --target-http-proxy=PROJECT_NAME-http-proxy \
  --address=PROJECT_NAME-ip \
  --ports=80 \
  --project=GCP_PROJECT_ID

# Set Cloud Run ingress to internal + LB only (blocks direct .run.app access)
gcloud run services update SERVICE_NAME \
  --ingress=internal-and-cloud-load-balancing \
  --region=us-central1 \
  --project=GCP_PROJECT_ID
```

#### 5g. Create GitHub Actions workflow for CI/CD

Create `.github/workflows/deploy-cloudrun.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
    concurrency:
      group: deploy-production
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy SERVICE_NAME \
            --source . \
            --region ${{ env.REGION }} \
            --project ${{ secrets.GCP_PROJECT_ID }} \
            --quiet

      - name: Verify deployment
        run: |
          PUBLIC=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "https://DOMAIN/" || echo "000")
          echo "Public health (https://DOMAIN/): HTTP $PUBLIC"
          if [ "$PUBLIC" != "200" ]; then
            echo "::warning::Public health check returned $PUBLIC"
          fi
```

**GitHub repo secrets to add:**
- `GCP_SA_KEY`: service account JSON key with Cloud Run Admin, Cloud Build Editor, and Storage Admin roles
- `GCP_PROJECT_ID`: the GCP project ID

#### 5h. Manual deploy command (for quick deploys without CI)

```bash
gcloud run deploy SERVICE_NAME --source . --region us-central1 --project GCP_PROJECT_ID --quiet
```

### 7. Google Search Console

1. Navigate to https://search.google.com/search-console
2. Add property > Domain > enter domain
3. Copy the TXT verification record
4. Add via Cloud DNS: `gcloud dns record-sets create DOMAIN. --type=TXT --ttl=300 --rrdatas='"google-site-verification=..."' --zone=DNS_ZONE --project=GCP_PROJECT_ID`
5. Click Verify
6. Create `src/app/sitemap.ts` as a **dynamic filesystem walker**. Do not hardcode a URL array — that pattern drifts silently the moment anyone adds a page and forgets to register it. We learned this the hard way on assrt-website where 171 of 306 pages (56%) were missing from the sitemap because the pipeline kept forgetting to update the hardcoded array.

The walker recursively scans `src/app/` for every `page.tsx`, strips route groups (`(main)`, `(auth)`), skips `api/`, private folders (`_*`), and dynamic segments (`[slug]`, `[...slug]`). Every new static page added anywhere under `src/app/` automatically appears in the sitemap on next build. Zero registration step, zero drift.

**Copy this into `src/app/sitemap.ts` exactly:**

```tsx
import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://DOMAIN";
const APP_DIR = path.join(process.cwd(), "src/app");

type SitemapEntry = { url: string; lastModified: Date };

function walkPages(dir: string, urlSegments: string[] = []): SitemapEntry[] {
  const results: SitemapEntry[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name === "page.tsx") {
      const filePath = path.join(dir, entry.name);
      const stat = fs.statSync(filePath);
      const urlPath = urlSegments.length === 0 ? "" : "/" + urlSegments.join("/");
      results.push({
        url: `${BASE_URL}${urlPath}`,
        lastModified: stat.mtime,
      });
      continue;
    }

    if (!entry.isDirectory()) continue;

    const name = entry.name;
    // Private folders (not routable)
    if (name.startsWith("_")) continue;
    // API routes don't belong in a sitemap
    if (name === "api") continue;
    // Dynamic segments — can't be enumerated without a data source.
    // Handle them explicitly below if you have one.
    if (name.startsWith("[") && name.endsWith("]")) continue;

    // Route groups are included in the walk but do NOT contribute to the URL path
    const isRouteGroup = name.startsWith("(") && name.endsWith(")");
    const nextSegments = isRouteGroup ? urlSegments : [...urlSegments, name];

    results.push(...walkPages(path.join(dir, entry.name), nextSegments));
  }

  return results;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const filesystemPages = walkPages(APP_DIR);

  // If you have dynamic routes (e.g. [slug], [...slug]), expand them from their
  // data source here and concat onto filesystemPages. Examples:
  //
  //   // Blog posts from content/blog/*.mdx:
  //   const blogPages = fs.readdirSync(path.join(process.cwd(), "content/blog"))
  //     .filter((f) => f.endsWith(".mdx"))
  //     .map((f) => ({
  //       url: `${BASE_URL}/blog/${f.replace(/\.mdx$/, "")}`,
  //       lastModified: fs.statSync(path.join(process.cwd(), "content/blog", f)).mtime,
  //     }));
  //
  //   // Docs from a nav config:
  //   import { docsNav, slugToPath } from "./(main)/docs/nav-config";
  //   const docsPages = docsNav.flatMap((g) => g.items).map((item) => ({
  //     url: `${BASE_URL}${slugToPath(item.slug)}`,
  //     lastModified: new Date(),
  //   }));

  // Dedupe by URL so a dynamic expansion can't collide with a static page
  const seen = new Set<string>();
  const all: SitemapEntry[] = [];
  for (const entry of filesystemPages) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    all.push(entry);
  }

  return all;
}
```

**Design rules (follow these, don't re-derive them):**
- **Never hardcode a slug array.** Every slug maintained by hand is a future drift bug.
- **Walk, don't list.** `fs.readdirSync` at build time is free; the penalty is paid once per deploy, not per request.
- **Strip route groups** (`(main)`, `(marketing)`, `(auth)`, etc.) from the URL path. Include them in the walk.
- **Skip `api/`**, private folders starting with `_`, and dynamic segments `[slug]` / `[...slug]`. API routes are not pages; dynamic segments need an explicit data source.
- **Dedupe before returning**, in case a dynamic expansion overlaps a static page (e.g. `/docs/index` from the walk plus `/docs/getting-started` from a nav config).
- **Use file `mtime` for `lastModified`.** It's free, honest, and Google treats it as a hint anyway.
- **If you add a dynamic route, add one block that expands it from its data source** (see the commented examples in the template). Each new dynamic route is ~5 lines, once.

**Test the sitemap before deploying:**
```bash
npx next build
# Then count the URLs in the generated sitemap body:
grep -c '<loc>' .next/server/app/sitemap.xml.body
# Spot-check that all expected static pages are present:
grep -oE '<loc>[^<]+</loc>' .next/server/app/sitemap.xml.body | head
```

If the URL count is lower than the number of `page.tsx` files on disk (minus dynamic segments), something is wrong with the walker.

7. In Search Console > Sitemaps, submit `https://DOMAIN/sitemap.xml`

### 8. Add to Analytics Dashboard

Add the new domain to the unified analytics dashboard at `~/analytics-dashboard/`.

1. Edit `src/lib/config.ts` — add a new entry to the `DOMAINS` array:

```ts
{
  slug: "my-app",           // kebab-case domain (used in URL paths)
  domain: "myapp.com",      // bare domain
  label: "MyApp",           // display name
  posthog: { projectId: "PROJECT_ID", host: "us" },  // "us" or "eu"
  gscProperty: "sc-domain:myapp.com",
  // If the project has a waitlist with PostHog tracking, add:
  customEvents: [{ event: "waitlist_signup", label: "Waitlist Signups" }],
  // If the project uses Resend for waitlist/audience, add:
  resend: { audienceId: "AUDIENCE_ID" },  // get ID from: curl https://api.resend.com/audiences -H "Authorization: Bearer $RESEND_API_KEY"
},
```

2. Commit and push (the analytics dashboard has its own CI/CD):

```bash
cd ~/analytics-dashboard
git add src/lib/config.ts
git commit -m "Add PROJECT_NAME to analytics dashboard"
git push
```

### 9. Verify Everything

- [ ] Site loads at `https://DOMAIN`
- [ ] Waitlist form submits and shows success
- [ ] Welcome email received (check with `gmail` skill or Resend Sending tab)
- [ ] Email appears in Resend audience
- [ ] Outbound email logged in `{product}_emails` table (direction='outbound')
- [ ] PostHog captures `$pageview` and `waitlist_signup` events
- [ ] Resend domain fully verified (DKIM + SPF + DMARC + MX inbound)
- [ ] Inbound test: send email to `matt@DOMAIN`, confirm it appears in Resend Receiving tab
- [ ] Inbound webhook: confirm email stored in `{product}_emails` table (direction='inbound')
- [ ] Inbound forwarding: confirm `[PRODUCT Inbound]` email arrives at `your-email@domain.com`
- [ ] Domain filter: confirm webhook ignores emails to other domains on the shared Resend account
- [ ] Google Search Console shows "Ownership verified"
- [ ] Sitemap is submitted (may show "Couldn't fetch" initially — normal)
- [ ] `sitemap.ts` is the dynamic filesystem walker (not a hardcoded URL array)
- [ ] After a fresh build, `grep -c '<loc>' .next/server/app/sitemap.xml.body` matches the number of routable `page.tsx` files on disk
- [ ] Any dynamic routes (`[slug]`, `[...slug]`) have an explicit expansion block in `sitemap.ts`
- [ ] `@seo/components` installed and `transpilePackages` configured in `next.config.ts`
- [ ] Guide index at `/t` lists all discovered guides
- [ ] Individual guide pages at `/t/{slug}` render with Breadcrumbs, structured data, and CTA components
- [ ] HeadingAnchors injects `id` attributes on H2 elements (inspect DOM)
- [ ] SeoComponentsStyles loads in `<head>` (check page source)
- [ ] Build generates `.next/seo-guides-manifest.json` with correct page count
