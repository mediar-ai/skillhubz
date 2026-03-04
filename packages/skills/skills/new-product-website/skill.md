---
name: new-product-website
description: End-to-end workflow for launching a new product landing page — scaffolding, theming, analytics, waitlist, domain, SEO, and deployment.
---

# New Product Website

Automates the full launch workflow for a new product landing page: scaffold Next.js app, configure theme, wire analytics + waitlist, deploy to Vercel, configure domain, and register with Google Search Console.

## Arguments

Provide the product name, domain, and a brief description. Example: `"MyApp at myapp.com — AI-powered task management"`

## Prerequisites

- **Vercel account** with a configured scope/team
- **Domain** purchased (Vercel Domains or external with Vercel nameservers)
- **PostHog** account (US or EU instance)
- **Resend** account for transactional/waitlist emails
- **Google Search Console** access
- **GitHub** org or personal account

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 + Framer Motion
- PostHog for analytics
- Resend for waitlist email collection
- Vercel for hosting
- Google Search Console for SEO

## Workflow

### 1. Scaffold Project

```bash
mkdir ~/PROJECT_NAME && cd ~/PROJECT_NAME
```

Create these files manually (don't use `create-next-app` — it hangs on interactive prompts):

| File | Purpose |
|------|---------|
| `package.json` | next 15, react 19, framer-motion, lucide-react, posthog-js |
| `tsconfig.json` | Standard Next.js TS config with `@/*` path alias |
| `next.config.ts` | Empty config |
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
4. **How It Works** — 3-step flow with icons
5. **Results/Social Proof** — Real examples styled as platform cards
6. **Features** — 6-card grid with icons
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

### 4. Wire Resend Waitlist

1. Log in to Resend and navigate to Audiences
2. Create a new audience/segment named "{Product} Waitlist"
3. Copy the audience ID
4. Create a new API key named `{product}-waitlist`
5. Store the key securely (e.g., in your system keychain or password manager)
6. Create `src/app/api/waitlist/route.ts`:

```tsx
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@"))
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
    if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID)
      return NextResponse.json({ error: "Server config error" }, { status: 500 });

    const res = await fetch(
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

    if (!res.ok) return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

7. CTA form calls `/api/waitlist` + fires `posthog?.capture("waitlist_signup", { email })`

### 5. Deploy to Vercel

```bash
# Init git and push to GitHub
git init && git add -A && git commit -m "Initial landing page"
gh repo create YOUR_ORG/PROJECT_NAME --private --source=. --push

# Deploy to Vercel
npx vercel --yes --scope YOUR_VERCEL_SCOPE

# Add domain
npx vercel domains add DOMAIN --scope YOUR_VERCEL_SCOPE

# Set env vars (production)
npx vercel env add NEXT_PUBLIC_POSTHOG_KEY production --scope YOUR_VERCEL_SCOPE <<< "KEY"
npx vercel env add NEXT_PUBLIC_POSTHOG_HOST production --scope YOUR_VERCEL_SCOPE <<< "https://us.i.posthog.com"
npx vercel env add RESEND_API_KEY production --scope YOUR_VERCEL_SCOPE <<< "KEY"
npx vercel env add RESEND_AUDIENCE_ID production --scope YOUR_VERCEL_SCOPE <<< "ID"

# Production deploy
npx vercel --prod --scope YOUR_VERCEL_SCOPE
```

### 6. Google Search Console

1. Navigate to https://search.google.com/search-console
2. Add property > Domain > enter domain
3. Copy the TXT verification record
4. Add via Vercel DNS: `npx vercel dns add DOMAIN @ TXT "google-site-verification=..." --scope YOUR_VERCEL_SCOPE`
5. Click Verify
6. Submit sitemap: create `src/app/sitemap.ts`:

```tsx
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://DOMAIN",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
```

7. In Search Console > Sitemaps, submit `https://DOMAIN/sitemap.xml`

### 7. Verify Everything

- [ ] Site loads at `https://DOMAIN`
- [ ] Waitlist form submits and shows success
- [ ] Email appears in Resend audience
- [ ] PostHog captures `$pageview` and `waitlist_signup` events
- [ ] Google Search Console shows "Ownership verified"
- [ ] Sitemap is submitted (may show "Couldn't fetch" initially — normal)
