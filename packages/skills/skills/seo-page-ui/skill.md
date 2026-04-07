---
name: seo-page-ui
description: "UI blueprint for building rich SEO landing pages with Next.js/TSX. Defines the exact section order, animated SVG patterns, comparison tables, FAQ accordions, CTA blocks, JSON-LD structured data, and color palette. Use when building any /use-case/ or landing page that needs to rank in search."
user_invocable: true
---

# SEO Page UI

A reusable UI blueprint for building rich, SEO-optimized landing pages in Next.js (TSX). This skill defines the visual component patterns, section order, animated SVG templates, comparison tables, and structured data that every SEO landing page should have.

This is the **UI layer only**. It does not handle keyword discovery, state files, or pipeline orchestration. It tells you *what to build* visually.

## When to Use

- Building a `/use-case/` page targeting a keyword
- Creating any SEO landing page that needs rich media
- When a pipeline skill (like `gsc-seo-page` or `underserved-seo-page`) needs to know the page structure

## File Structure

Each page is a single TSX file at `src/app/{route}/{slug}/page.tsx`:

```tsx
import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = { /* ... */ };

export default function PageName() {
  const jsonLd = [ /* ... */ ];

  return (
    <main className="noise-overlay">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-6 py-24">
        {/* All 11 sections here */}
      </div>
      <Footer />
    </main>
  );
}
```

---

## Color Palette

All SEO pages use these colors exclusively:

| Token | Hex | Usage |
|---|---|---|
| Box fill | `#1e293b` | SVG rectangles, diagram backgrounds |
| Dark background | `#0f172a` | Optional deeper background fills |
| Primary stroke | `#14b8a6` | Borders, lines, non-agent boxes |
| Agent highlight | `#2dd4bf` | Fazm agent box, animated dots, bold text |
| Dark accent | `#0d9488` | Arrow labels, connection lines |
| Text primary | `#e2e8f0` | Headings, labels inside SVG |
| Text secondary | `#94a3b8` | Sub-labels, captions |
| Warning | `#f59e0b` | Warning callouts |
| Error | `#ef4444` | Error callouts |

**Never use:** indigo (`#6366f1`), purple (`#818cf8`, `#8b5cf6`), or blue (`#3b82f6`).

CSS classes for the page body use the site's design tokens: `text-white`, `text-muted`, `text-accent`, `bg-surface-light/50`, `border-white/5`, `border-accent/20`.

---

## Required Metadata

```tsx
export const metadata: Metadata = {
  title: "AI {Topic} Automation for Mac - {Subtitle} | Fazm",
  description: "155-160 char meta description with primary keyword naturally included.",
  keywords: [
    "primary keyword",
    "primary keyword mac",
    "variation 1",
    "variation 2",
    "variation 3",
    "variation 4",
  ],
  alternates: { canonical: "https://fazm.ai/{route}/{slug}" },
  openGraph: {
    title: "AI {Topic} Automation for Mac - Fazm",
    description: "Short OG description under 200 chars.",
    type: "website",
    url: "https://fazm.ai/{route}/{slug}",
    siteName: "Fazm",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI {Topic} Automation for Mac - Fazm",
    description: "Short Twitter description.",
  },
};
```

---

## Required JSON-LD (4 blocks)

Every page must include these 4 structured data blocks in a `jsonLd` array:

### 1. WebPage

```tsx
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI {Topic} Automation for Mac",
  description: "Same as meta description.",
  url: "https://fazm.ai/{route}/{slug}",
}
```

### 2. BreadcrumbList

```tsx
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://fazm.ai" },
    { "@type": "ListItem", position: 2, name: "{Section}", item: "https://fazm.ai/{route}" },
    { "@type": "ListItem", position: 3, name: "AI {Topic} Automation", item: "https://fazm.ai/{route}/{slug}" },
  ],
}
```

### 3. HowTo

4 steps. Always follows this pattern:

```tsx
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Automate {Topic} with Fazm",
  description: "Step-by-step guide to automating {topic} on macOS.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Download Fazm", text: "Download and install Fazm on your Mac from fazm.ai/download." },
    { "@type": "HowToStep", position: 2, name: "Open {relevant app}", text: "Open {app} on your Mac..." },
    { "@type": "HowToStep", position: 3, name: "Describe the task", text: "Tell Fazm what to do..." },
    { "@type": "HowToStep", position: 4, name: "Fazm handles it", text: "Fazm navigates your app..." },
  ],
}
```

### 4. FAQPage

4 Q&A pairs. First FAQ differentiates Fazm from cloud competitors. Must match the FAQ section content exactly.

```tsx
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is Fazm different from {competitor}?",
      acceptedAnswer: { "@type": "Answer", text: "..." },
    },
    // ... 3 more
  ],
}
```

---

## The 11 Required Sections

Every SEO page must have all 11 sections in this exact order.

### Section 1: Breadcrumbs

```tsx
<nav aria-label="Breadcrumb" className="mb-8">
  <ol className="flex items-center gap-2 text-sm text-muted">
    <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
    <li>/</li>
    <li><Link href="/{route}" className="hover:text-white transition-colors">{Section}</Link></li>
    <li>/</li>
    <li className="text-white">AI {Topic} Automation</li>
  </ol>
</nav>
```

### Section 2: H1 + Lede

```tsx
<h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
  AI {Topic} Automation for macOS
</h1>
<p className="text-lg text-muted max-w-3xl mb-8">
  {2-4 sentences. Lead with a concrete stat or pain point. Explain why every
  existing tool is cloud/SaaS. Position Fazm as the desktop agent alternative.
  No filler, no marketing fluff.}
</p>
```

### Section 3: Hero Animated SVG

A flow diagram showing data moving through Fazm to target apps. Must include SMIL `<animate>` elements for moving dots.

**Layout:** Source (left) -> Fazm Agent (center) -> Target Apps (right, stacked 2-3)

```tsx
<div className="my-8 max-w-lg mx-auto">
  <svg viewBox="0 0 400 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
    {/* Source box */}
    <rect x="10" y="35" width="90" height="50" rx="10"
      fill="#1e293b" stroke="#14b8a6" strokeWidth="2" />
    <text x="55" y="58" textAnchor="middle" fill="#e2e8f0"
      fontSize="11" fontFamily="sans-serif">{Source}</text>
    <text x="55" y="73" textAnchor="middle" fill="#94a3b8"
      fontSize="9" fontFamily="sans-serif">{Subtitle}</text>

    {/* Fazm agent box - slightly larger, brighter stroke */}
    <rect x="155" y="30" width="90" height="60" rx="10"
      fill="#1e293b" stroke="#2dd4bf" strokeWidth="2.5" />
    <text x="200" y="57" textAnchor="middle" fill="#2dd4bf"
      fontSize="12" fontWeight="bold" fontFamily="sans-serif">Fazm</text>
    <text x="200" y="73" textAnchor="middle" fill="#94a3b8"
      fontSize="9" fontFamily="sans-serif">AI Agent</text>

    {/* Target boxes - 3 stacked on right */}
    <rect x="300" y="10" width="90" height="30" rx="6"
      fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="345" y="30" textAnchor="middle" fill="#e2e8f0"
      fontSize="10" fontFamily="sans-serif">{App1}</text>

    <rect x="300" y="48" width="90" height="30" rx="6"
      fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="345" y="68" textAnchor="middle" fill="#e2e8f0"
      fontSize="10" fontFamily="sans-serif">{App2}</text>

    <rect x="300" y="86" width="90" height="30" rx="6"
      fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="345" y="106" textAnchor="middle" fill="#e2e8f0"
      fontSize="10" fontFamily="sans-serif">{App3}</text>

    {/* Dashed connection lines */}
    <line x1="100" y1="60" x2="155" y2="60"
      stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    <line x1="245" y1="50" x2="300" y2="25"
      stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    <line x1="245" y1="60" x2="300" y2="63"
      stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    <line x1="245" y1="70" x2="300" y2="101"
      stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />

    {/* Animated dots - 2 dots with staggered timing */}
    <circle r="4" fill="#2dd4bf">
      <animate attributeName="cx" values="100;155;245;300" dur="2.5s" repeatCount="indefinite" />
      <animate attributeName="cy" values="60;60;50;25" dur="2.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0.8;0.6;1" dur="2.5s" repeatCount="indefinite" />
    </circle>
    <circle r="4" fill="#14b8a6">
      <animate attributeName="cx" values="100;155;245;300" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
      <animate attributeName="cy" values="60;60;60;63" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
      <animate attributeName="opacity" values="1;0.8;0.6;1" dur="2.5s" repeatCount="indefinite" begin="0.8s" />
    </circle>
  </svg>
</div>
```

**Customization per page:** Change the source label, Fazm subtitle, and target app names. Adjust the `cy` values on animated dots so each dot flows to a different target box.

### Section 4: Problem + Comparison Table

`<section className="mb-16">`

H2 naming the pain point. 2 paragraphs: first explains the manual pain, second explains why cloud tools miss the desktop angle.

Then the comparison table:

```tsx
<div className="overflow-x-auto rounded-xl border border-white/5">
  <table className="w-full text-sm text-left">
    <thead>
      <tr className="border-b border-white/10 bg-surface-light/50">
        <th className="px-4 py-3 text-muted font-medium"></th>
        <th className="px-4 py-3 text-muted font-medium">Manual</th>
        <th className="px-4 py-3 text-muted font-medium">Cloud SaaS ({competitors})</th>
        <th className="px-4 py-3 text-accent font-semibold">Fazm Desktop Agent</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      {/* Alternate rows: odd rows get bg-surface-light/30, even rows no bg */}
      <tr className="bg-surface-light/30">
        <td className="px-4 py-3 text-white font-medium">{Dimension}</td>
        <td className="px-4 py-3 text-muted">{Manual}</td>
        <td className="px-4 py-3 text-muted">{Cloud}</td>
        <td className="px-4 py-3 text-white">{Fazm}</td>
      </tr>
      <tr>
        <td className="px-4 py-3 text-white font-medium">{Dimension 2}</td>
        {/* ... */}
      </tr>
      {/* 5-6 rows total */}
    </tbody>
  </table>
</div>
```

**Standard dimensions to compare:** Setup time, Works with {specific app}, Works with legacy software, {Core capability}, Cross-app workflows, Data privacy.

### Section 5: Example Prompts (7 items)

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">
    {Topic} Commands You Can Give Fazm
  </h2>
  <div className="space-y-3">
    {[
      "First prompt with specific app names and actions...",
      "Second prompt...",
      // ... 7 total
    ].map((prompt) => (
      <div key={prompt} className="p-4 rounded-xl bg-surface-light/50 border border-white/5">
        <div className="flex items-start gap-3">
          <span className="text-accent mt-0.5">&#10003;</span>
          <span className="text-white text-sm">&quot;{prompt}&quot;</span>
        </div>
      </div>
    ))}
  </div>
</section>
```

Each prompt must name real apps and describe a concrete workflow. Not generic.

### Section 6: Workflow Diagram + Steps

A wider workflow SVG (viewBox `0 0 720 120`) with arrowhead markers, then 4 numbered steps.

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">
    How Fazm Automates {Topic}
  </h2>

  <div className="my-8">
    <svg viewBox="0 0 720 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead-{unique-id}" markerWidth="10" markerHeight="7"
          refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#2dd4bf" />
        </marker>
      </defs>

      {/* Source box */}
      <rect x="20" y="30" width="160" height="60" rx="10"
        fill="#1e293b" stroke="#14b8a6" strokeWidth="2" />
      <text x="100" y="56" textAnchor="middle" fill="#e2e8f0"
        fontSize="14" fontWeight="bold" fontFamily="sans-serif">Source Data</text>
      <text x="100" y="74" textAnchor="middle" fill="#94a3b8"
        fontSize="11" fontFamily="sans-serif">{source details}</text>

      {/* Arrow with label */}
      <line x1="180" y1="60" x2="268" y2="60"
        stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#arrowhead-{unique-id})" />
      <text x="224" y="48" textAnchor="middle" fill="#0d9488"
        fontSize="10" fontFamily="sans-serif">{action verb}</text>

      {/* Agent box */}
      <rect x="280" y="25" width="160" height="70" rx="10"
        fill="#1e293b" stroke="#2dd4bf" strokeWidth="2.5" />
      <text x="360" y="55" textAnchor="middle" fill="#2dd4bf"
        fontSize="15" fontWeight="bold" fontFamily="sans-serif">Fazm Agent</text>
      <text x="360" y="75" textAnchor="middle" fill="#94a3b8"
        fontSize="11" fontFamily="sans-serif">AI on your Mac</text>

      {/* Arrow with label */}
      <line x1="440" y1="60" x2="528" y2="60"
        stroke="#2dd4bf" strokeWidth="2" markerEnd="url(#arrowhead-{unique-id})" />
      <text x="484" y="48" textAnchor="middle" fill="#0d9488"
        fontSize="10" fontFamily="sans-serif">{action verb}</text>

      {/* Target box */}
      <rect x="540" y="30" width="160" height="60" rx="10"
        fill="#1e293b" stroke="#14b8a6" strokeWidth="2" />
      <text x="620" y="56" textAnchor="middle" fill="#e2e8f0"
        fontSize="14" fontWeight="bold" fontFamily="sans-serif">{Target App}</text>
      <text x="620" y="74" textAnchor="middle" fill="#94a3b8"
        fontSize="11" fontFamily="sans-serif">{app examples}</text>
    </svg>
  </div>

  {/* 4 numbered steps */}
  <div className="space-y-6">
    {[
      { step: "1", title: "Open your app and source data", desc: "..." },
      { step: "2", title: "Tell Fazm what to do", desc: "..." },
      { step: "3", title: "Fazm navigates your app", desc: "..." },
      { step: "4", title: "Review the results", desc: "..." },
    ].map((item) => (
      <div key={item.step} className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
          {item.step}
        </div>
        <div>
          <h3 className="text-white font-semibold mb-1">{item.title}</h3>
          <p className="text-muted text-sm">{item.desc}</p>
        </div>
      </div>
    ))}
  </div>
</section>
```

**Important:** Use a unique marker ID per page (e.g., `arrowhead-bk` for bookkeeping, `arrowhead-ds` for document signing) to avoid SVG ID collisions if multiple pages are rendered.

### Section 7: Benefits (3 Cards)

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">
    Why a Desktop Agent Beats {Cloud Competitor Category}
  </h2>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[
      { title: "Works with {app} and legacy software", desc: "..." },
      { title: "Your data stays on your Mac", desc: "..." },
      { title: "Cross-app workflows without integrations", desc: "..." },
    ].map((item) => (
      <div key={item.title} className="p-5 rounded-xl bg-surface-light/50 border border-white/5">
        <h3 className="text-white font-semibold mb-2">{item.title}</h3>
        <p className="text-muted text-sm">{item.desc}</p>
      </div>
    ))}
  </div>
</section>
```

**No icons** on benefit cards. Text only.

### Section 8: Real-World Scenario

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">A Real-World Example</h2>
  <div className="p-5 rounded-xl bg-surface-light/50 border border-white/5">
    <p className="text-muted text-sm mb-3">
      {Setup: who the person is, their role, the repetitive task they face,
      with concrete numbers (e.g., "120 transactions per month", "8-12 invoices")}
    </p>
    <p className="text-white text-sm font-medium mb-3">
      &quot;{The exact prompt they gave Fazm, 2-4 sentences, specific}&quot;
    </p>
    <p className="text-muted text-sm">
      {The measurable result: "categorized 114 of 120 transactions", "took 22
      minutes instead of 3 hours". Always include before/after comparison.}
    </p>
  </div>
</section>
```

### Section 9: FAQ Accordions (4 items)

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
  <div className="space-y-4">
    {[
      {
        q: "How is Fazm different from {cloud competitor}?",
        a: "...",
      },
      {
        q: "Can Fazm work with {specific desktop app}?",
        a: "...",
      },
      {
        q: "Does Fazm handle {specific capability}?",
        a: "...",
      },
      {
        q: "Is my data safe with Fazm?",
        a: "...",
      },
    ].map((faq) => (
      <details key={faq.q} className="p-5 rounded-xl bg-surface-light/50 border border-white/5 group">
        <summary className="text-white font-semibold cursor-pointer list-none flex items-center justify-between">
          {faq.q}
          <span className="text-muted group-open:rotate-45 transition-transform text-xl">+</span>
        </summary>
        <p className="text-muted text-sm mt-3">{faq.a}</p>
      </details>
    ))}
  </div>
</section>
```

**FAQ content must match the FAQPage JSON-LD exactly** (same questions, same answers).

### Section 10: CTA

```tsx
<section className="mb-16 text-center p-8 rounded-2xl bg-gradient-to-b from-accent/10 to-transparent border border-accent/20">
  <h2 className="text-2xl font-bold text-white mb-3">
    {Action-oriented headline, e.g., "Stop Doing {Task} by Hand"}
  </h2>
  <p className="text-muted mb-6">
    {One sentence reinforcing the value prop}
  </p>
  <Link
    href="/download"
    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
  >
    Download Fazm
  </Link>
</section>
```

### Section 11: Related Links (6 items)

```tsx
<section className="pt-8 border-t border-white/5">
  <h2 className="text-xl font-bold text-white mb-4">Related Automations</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[
      { href: "/use-case/{slug1}", label: "{Name}", desc: "{One line}" },
      { href: "/use-case/{slug2}", label: "{Name}", desc: "{One line}" },
      { href: "/use-case/{slug3}", label: "{Name}", desc: "{One line}" },
      { href: "/use-case/{slug4}", label: "{Name}", desc: "{One line}" },
      { href: "/use-case/{slug5}", label: "{Name}", desc: "{One line}" },
      { href: "/download", label: "Download Fazm", desc: "Free for macOS" },
    ].map((link) => (
      <Link key={link.href} href={link.href}
        className="p-4 rounded-xl bg-surface-light/50 border border-white/5 hover:border-accent/20 transition-all">
        <div className="text-white font-semibold text-sm">{link.label}</div>
        <div className="text-xs text-muted mt-1">{link.desc}</div>
      </Link>
    ))}
  </div>
</section>
```

Last link is always Download Fazm. Pick 5 topically related pages from existing `/use-case/` pages.

---

## Writing Rules

- **No em dashes or en dashes.** Use commas, semicolons, colons, parentheses, or new sentences.
- **No AI vocabulary:** delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental.
- **Teal accent colors only.** See color palette above.
- **No decorative icons** on cards. The checkmark in example prompts (`&#10003;`) is the only icon.
- **Concrete examples** with real app names, real numbers, real workflows.
- **Second person** ("you") or **first person plural** ("we") voice.
- **Minimum 1,200 words** of visible text.

## Quality Checklist

- [ ] All 11 sections present in correct order
- [ ] Hero animated SVG with SMIL `<animate>` dots
- [ ] Workflow SVG with arrowhead `<marker>` and unique marker ID
- [ ] Comparison table: Manual vs Cloud vs Fazm (5-6 rows)
- [ ] 7 example prompts with real app names
- [ ] 3 benefit cards, no icons
- [ ] Real-world scenario with before/after numbers
- [ ] 4 FAQ accordions matching FAQPage JSON-LD word-for-word
- [ ] CTA with `/download` link
- [ ] 6 related links (5 use-cases + download)
- [ ] 4 JSON-LD blocks (WebPage, BreadcrumbList, HowTo, FAQPage)
- [ ] Metadata: title, description, keywords, canonical, OG, Twitter
- [ ] Teal colors only, no em dashes, no AI vocabulary
- [ ] No broken image/video references
