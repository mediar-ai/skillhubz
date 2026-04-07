---
name: underserved-seo-page
description: "End-to-end workflow for discovering underserved Google search keywords and shipping SEO-optimized /use-case/ pages on fazm.ai. Discovers keywords via SERP analysis, scores them for desktop-agent opportunity gaps, creates rich TSX pages with animated SVGs and comparison tables, builds, pushes, and updates state. Use when: 'next underserved keyword page', 'discover new SEO keywords', 'run underserved keyword pipeline', or when the cron triggers."
user_invocable: true
---

# Underserved SEO Page

Discover underserved Google search keywords where no desktop AI agent content exists, then ship a rich `/use-case/` page on fazm.ai targeting that gap. Unlike the GSC pipeline (which targets queries we already rank for), this pipeline finds *new* opportunities by analyzing SERPs for missing desktop-agent angles.

## Arguments

Either:
1. **Nothing** - skill picks the top pending keyword from `seo/inbox/state/underserved_keywords.json` (sorted by score descending), or discovers new keywords if none are pending.
2. **A specific keyword** - e.g. `"ai tiktok automation"` (manual mode).

## State File (source of truth)

**Path:** `seo/inbox/state/underserved_keywords.json`

Each keyword entry:

```json
{
  "keyword": "ai bookkeeping automation",
  "slug": "ai-bookkeeping-automation",
  "score": 1.65,
  "signal1_desktop_gap": 2,
  "signal2_result_quality": 2,
  "signal3_commercial_fit": 1,
  "status": "done",
  "page_url": "https://fazm.ai/use-case/ai-bookkeeping-automation",
  "scored_at": "2026-04-05T00:00:00",
  "completed_at": "2026-04-05T19:11:09",
  "notes": "Results are cloud SaaS. None control QuickBooks desktop app."
}
```

| status | meaning |
|---|---|
| `pending` | scored and eligible for next pickup |
| `in_progress` | a run has claimed this keyword |
| `done` | a page has shipped |
| `skip` | too competitive or poor fit |

---

## Phase 1: Pick or Discover Keywords

### If pending keywords exist

Take the first entry where `status == "pending"` (highest score). Skip to Phase 2.

### If no pending keywords: Discovery

Use WebSearch to find new underserved keywords for AI desktop automation use cases.

**Seed patterns:**
- `"ai [app] automation"`
- `"ai [task] automation mac"`
- `"automate [app] with ai"`
- `"ai [workflow] automation desktop"`

**For each candidate keyword:**

1. Search Google for the keyword
2. Score on 3 signals:

| Signal | Weight | 0 | 1 | 2 |
|---|---|---|---|---|
| Desktop Agent Gap | 40% | Desktop agent tools in top 5 | Desktop mentioned but not primary | Zero desktop agent results |
| Result Quality Gap | 35% | Strong, comprehensive results | Mediocre listicles or thin content | Weak, off-topic, or sparse results |
| Commercial Intent Match | 25% | No purchase/tool intent | Some tool comparison intent | Clear "find a tool" intent |

3. **Composite score** = `(S1 * 0.4) + (S2 * 0.35) + (S3 * 0.25)`
4. If >= 1.5, add as `pending`. If < 1.0, add as `skip`. Between 1.0 and 1.5, use judgment.
5. Add to state file with notes explaining what you found in the SERPs.

**Cross-check:** Before adding, verify no existing page covers it: `ls src/app/use-case/`

After discovery, pick the top new pending keyword and continue.

## Phase 2: Claim Keyword

Set the keyword to `in_progress` in the state file immediately. This prevents concurrent runs from racing.

## Phase 3: Build the Page

**Location:** `src/app/use-case/{slug}/page.tsx`

**Reference template:** `src/app/use-case/ai-data-entry-automation/page.tsx`

Read the template before writing. The page is a single TSX file with no external dependencies beyond the shared Navbar and Footer components.

### File structure

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
        {/* All sections here */}
      </div>
      <Footer />
    </main>
  );
}
```

### Required metadata

```tsx
export const metadata: Metadata = {
  title: "AI {Topic} Automation for Mac - {Subtitle} | Fazm",
  description: "155-160 char meta description with primary keyword naturally included.",
  keywords: ["primary keyword", "primary keyword mac", "variation 1", "variation 2", "variation 3", "variation 4"],
  alternates: { canonical: "https://fazm.ai/use-case/{slug}" },
  openGraph: {
    title: "AI {Topic} Automation for Mac - Fazm",
    description: "Short OG description.",
    type: "website",
    url: "https://fazm.ai/use-case/{slug}",
    siteName: "Fazm",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI {Topic} Automation for Mac - Fazm",
    description: "Short Twitter description.",
  },
};
```

### Required JSON-LD (4 blocks)

1. **WebPage** - name, description, url
2. **BreadcrumbList** - Home > Use Cases > {This Page}
3. **HowTo** - "How to Automate {X} with Fazm" with exactly 4 steps:
   - Step 1: Download Fazm
   - Step 2: Open the relevant app(s)
   - Step 3: Describe the task
   - Step 4: Fazm handles it
4. **FAQPage** - 4 Q&A pairs addressing common questions. First FAQ should always differentiate Fazm from cloud/SaaS competitors.

### Required sections (in order)

Every page MUST have all of these sections, in this exact order:

#### 1. Breadcrumbs

```tsx
<nav aria-label="Breadcrumb" className="mb-8">
  <ol className="flex items-center gap-2 text-sm text-muted">
    <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
    <li>/</li>
    <li><Link href="/use-case" className="hover:text-white transition-colors">Use Cases</Link></li>
    <li>/</li>
    <li className="text-white">AI {Topic} Automation</li>
  </ol>
</nav>
```

#### 2. H1 + Lede

```tsx
<h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
  AI {Topic} Automation for macOS
</h1>
<p className="text-lg text-muted max-w-3xl mb-8">
  {2-4 sentences. Open with a concrete stat or pain point. Explain why every
  existing tool is cloud/SaaS. Position Fazm as the desktop agent alternative.}
</p>
```

#### 3. Animated SVG Diagram

A flow diagram showing: Source Data -> Fazm Agent -> Target App(s). Must include animated dots using SMIL `<animate>` elements.

**Color palette (mandatory):**
- Box fill: `#1e293b`
- Primary stroke: `#14b8a6` (teal)
- Agent stroke/text: `#2dd4bf` (bright teal)
- Accent stroke: `#0d9488` (dark teal)
- Text primary: `#e2e8f0`
- Text secondary: `#94a3b8`
- Connection lines: `#0d9488` with `strokeDasharray="4 3"` and `opacity="0.5"`

**Pattern:**
```tsx
<div className="my-8 max-w-lg mx-auto">
  <svg viewBox="0 0 400 120" className="w-full" xmlns="http://www.w3.org/2000/svg">
    {/* Source box */}
    <rect x="10" y="35" width="90" height="50" rx="10" fill="#1e293b" stroke="#14b8a6" strokeWidth="2" />
    <text x="55" y="58" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="sans-serif">{Source}</text>

    {/* Fazm agent box - slightly larger, brighter stroke */}
    <rect x="155" y="30" width="90" height="60" rx="10" fill="#1e293b" stroke="#2dd4bf" strokeWidth="2.5" />
    <text x="200" y="57" textAnchor="middle" fill="#2dd4bf" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Fazm</text>
    <text x="200" y="73" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">AI Agent</text>

    {/* Target boxes (2-3 apps) */}
    <rect x="300" y="10" width="90" height="30" rx="6" fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
    <text x="345" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="sans-serif">{App1}</text>
    {/* ... more target boxes ... */}

    {/* Dashed connection lines */}
    <line x1="100" y1="60" x2="155" y2="60" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
    <line x1="245" y1="50" x2="300" y2="25" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />

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

#### 4. Problem Section with Comparison Table

H2 that names the pain point. 2 paragraphs explaining the problem and why cloud tools miss the desktop angle.

Then a comparison table with 3 columns: Manual, Cloud SaaS (name the competitors), Fazm Desktop Agent. 5-6 rows comparing key dimensions.

```tsx
<div className="overflow-x-auto rounded-xl border border-white/5">
  <table className="w-full text-sm text-left">
    <thead>
      <tr className="border-b border-white/10 bg-surface-light/50">
        <th className="px-4 py-3 text-muted font-medium"></th>
        <th className="px-4 py-3 text-muted font-medium">Manual</th>
        <th className="px-4 py-3 text-muted font-medium">Cloud SaaS ({Competitor})</th>
        <th className="px-4 py-3 text-accent font-semibold">Fazm Desktop Agent</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      <tr className="bg-surface-light/30">
        <td className="px-4 py-3 text-white font-medium">{Dimension}</td>
        <td className="px-4 py-3 text-muted">{Manual answer}</td>
        <td className="px-4 py-3 text-muted">{Cloud answer}</td>
        <td className="px-4 py-3 text-white">{Fazm answer}</td>
      </tr>
      {/* Alternate bg-surface-light/30 and no bg on rows */}
    </tbody>
  </table>
</div>
```

#### 5. Example Prompts (7 items)

Real commands a user would give Fazm. Specific, actionable, mentioning real app names.

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">
    {Topic} Commands You Can Give Fazm
  </h2>
  <div className="space-y-3">
    {[
      "Open this contract PDF in Preview, add my signature on page 3...",
      // ... 6 more
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

#### 6. Workflow Section (SVG + 4 Steps)

A wider workflow SVG diagram (viewBox `0 0 720 120`) showing the 3-stage pipeline: Source Data -> Fazm Agent -> Target App. Uses arrowhead markers.

```tsx
<defs>
  <marker id="arrowhead-{id}" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#2dd4bf" />
  </marker>
</defs>
```

Then 4 numbered steps as cards:

```tsx
{[
  { step: "1", title: "...", desc: "..." },
  { step: "2", title: "...", desc: "..." },
  { step: "3", title: "...", desc: "..." },
  { step: "4", title: "...", desc: "..." },
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
```

#### 7. Benefits Section (3 Cards)

Why a desktop agent beats the cloud competitors. 3 cards in a grid.

```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {[
    { title: "...", desc: "..." },
    { title: "...", desc: "..." },
    { title: "...", desc: "..." },
  ].map((item) => (
    <div key={item.title} className="p-5 rounded-xl bg-surface-light/50 border border-white/5">
      <h3 className="text-white font-semibold mb-2">{item.title}</h3>
      <p className="text-muted text-sm">{item.desc}</p>
    </div>
  ))}
</div>
```

No icons on these cards. Text only.

#### 8. Real-World Scenario

A concrete story: who the person is, what their workflow looks like, the exact prompt they gave Fazm, and the measurable result.

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">A Real-World Example</h2>
  <div className="p-5 rounded-xl bg-surface-light/50 border border-white/5">
    <p className="text-muted text-sm mb-3">{Setup: who, what they do, the pain}</p>
    <p className="text-white text-sm font-medium mb-3">
      &quot;{The exact Fazm prompt they used}&quot;
    </p>
    <p className="text-muted text-sm">{The result with concrete numbers}</p>
  </div>
</section>
```

#### 9. FAQ Section (4 Accordions)

```tsx
<section className="mb-16">
  <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
  <div className="space-y-4">
    {[
      { q: "How is Fazm different from {competitor}?", a: "..." },
      { q: "Can Fazm work with {specific app}?", a: "..." },
      { q: "Does Fazm handle {specific capability}?", a: "..." },
      { q: "Is my data safe?", a: "..." },
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

FAQ content must match the FAQPage JSON-LD exactly.

#### 10. CTA Section

```tsx
<section className="mb-16 text-center p-8 rounded-2xl bg-gradient-to-b from-accent/10 to-transparent border border-accent/20">
  <h2 className="text-2xl font-bold text-white mb-3">{Action-oriented headline}</h2>
  <p className="text-muted mb-6">{One sentence reinforcing the value}</p>
  <Link href="/download" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent/90 transition-colors">
    Download Fazm
  </Link>
</section>
```

#### 11. Related Automations (6 Links)

```tsx
<section className="pt-8 border-t border-white/5">
  <h2 className="text-xl font-bold text-white mb-4">Related Automations</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[
      { href: "/use-case/{related-slug}", label: "{Short Name}", desc: "{One line}" },
      // ... 5 more, last one always { href: "/download", label: "Download Fazm", desc: "Free for macOS" }
    ].map((link) => (
      <Link key={link.href} href={link.href} className="p-4 rounded-xl bg-surface-light/50 border border-white/5 hover:border-accent/20 transition-all">
        <div className="text-white font-semibold text-sm">{link.label}</div>
        <div className="text-xs text-muted mt-1">{link.desc}</div>
      </Link>
    ))}
  </div>
</section>
```

Pick 5 related `/use-case/` pages from `ls src/app/use-case/`. Choose topically related ones.

---

## Writing Rules (hard constraints)

- **No em dashes or en dashes.** Use commas, semicolons, colons, parentheses, or new sentences.
- **No AI vocabulary:** delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental.
- **Teal accent colors only:** `#14b8a6`, `#2dd4bf`, `#0d9488`. Never indigo, purple, or blue (`#6366f1`, `#818cf8`, `#8b5cf6`, `#3b82f6`).
- **No decorative icons** on feature cards, benefit cards, or section headers. The checkmark in example prompts (`&#10003;`) is the only allowed icon.
- **Concrete examples** with real app names, real numbers, real workflows. Not "various apps" or "multiple tools".
- **Second person** ("you") or **first person plural** ("we") voice.
- **Minimum 1,200 words** of visible page text (excluding code/markup).

## Phase 4: Update Registry

Add the new page entry to `seo/use-case-pages.json` in the `pages` array and increment `total_pages`.

## Phase 5: Build Verification

```bash
cd ~/fazm-website
npx next build 2>&1 | tail -30
```

Must see `Compiled successfully`. If build fails on files you didn't edit, wait 30s and retry up to 3 times (another agent may be mid-edit).

## Phase 6: Commit and Push

```bash
git add src/app/use-case/{slug}/page.tsx seo/use-case-pages.json seo/inbox/state/underserved_keywords.json
git commit -m "$(cat <<'EOF'
Add use case page: {title}

Underserved keyword pipeline. Score: {score}. Desktop agent gap
in SERPs with no existing coverage.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push origin main
```

## Phase 7: Update State

Mark the keyword as `done` with `slug`, `page_url`, and `completed_at`.

## Phase 8: Verify Live

```bash
sleep 150 && curl -s -o /dev/null -w "%{http_code}\n" https://fazm.ai/use-case/{slug}
```

Expected: `200`.

## Anti-patterns

- Batching multiple pages in one run. ONE page per invocation.
- Picking a keyword already `in_progress` (another run may own it).
- Using indigo or purple anywhere.
- Adding decorative icons to cards.
- Em dashes or en dashes.
- Thin content under 1,200 words.
- Missing any of the 11 required sections.
- Missing the animated SVG or comparison table.
- FAQ content that doesn't match the FAQPage JSON-LD.
- Referencing image/video paths that don't exist in `public/`.
- Creating the page outside `/use-case/`. This pipeline does NOT create `/blog/` posts (that's the GSC pipeline).

## Quick Reference

| What | Where |
|---|---|
| Page location | `src/app/use-case/{slug}/page.tsx` |
| State file | `seo/inbox/state/underserved_keywords.json` |
| Registry | `seo/use-case-pages.json` |
| Reference template | `src/app/use-case/ai-data-entry-automation/page.tsx` |
| Shared components | `@/components/navbar`, `@/components/footer` |
| Existing pages | `ls src/app/use-case/` |
| Sibling skill (GSC blog) | `.claude/skills/gsc-seo-page/SKILL.md` |

## Completion Checklist

- [ ] Keyword selected (highest-score `pending`, or discovered new)
- [ ] Keyword marked `in_progress` before writing
- [ ] No duplicate page covers the topic
- [ ] All 11 sections present in correct order
- [ ] Animated SVG with SMIL dots
- [ ] Comparison table (Manual vs Cloud vs Fazm)
- [ ] 7 example prompts with real app names
- [ ] Workflow SVG with arrowhead markers
- [ ] 3 benefit cards (no icons)
- [ ] Real-world scenario with concrete numbers
- [ ] 4 FAQ accordions matching FAQPage JSON-LD
- [ ] CTA with download link
- [ ] 6 related automation links
- [ ] Teal colors only, no em dashes, no AI vocabulary
- [ ] `seo/use-case-pages.json` updated
- [ ] `npx next build` passes
- [ ] Committed + pushed to `main`
- [ ] HTTP 200 at `https://fazm.ai/use-case/{slug}`
- [ ] State file updated: `status=done`, `slug`, `page_url`, `completed_at`
