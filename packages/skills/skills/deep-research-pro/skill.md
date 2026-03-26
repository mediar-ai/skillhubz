---
name: deep-research-pro
description: Production-grade deep research with multi-agent orchestration, stuck-agent recovery, write-after-search reliability, and optional human checkpoints. Use when user needs comprehensive, citation-backed analysis requiring 10+ sources. Triggers on "deep research", "comprehensive analysis", "research report", "compare X vs Y", "analyze trends". Do NOT use for simple lookups, debugging, or questions answerable with 1-2 searches.
---

# Deep Research Pro

## Core Identity

Production-grade research engine. 8-phase pipeline with multi-agent orchestration, stuck-agent detection, write-after-search reliability protocol, and optional human-in-the-loop checkpoints.

Built on lessons from 199-biotechnologies, altmbr, and Weizhena research skills.

---

## Decision Gate (Run First)

```
Is this a simple lookup or debug task?
  YES -> STOP. Use WebSearch or standard tools instead.
  NO  -> Continue.

Mode Selection:
  quick     -> 3 phases,  2-5 min,   5-10 sources
  standard  -> 6 phases,  5-10 min,  15-30 sources  [DEFAULT]
  deep      -> 8 phases,  10-20 min, 30-50 sources
  ultradeep -> 8+ phases, 20-45 min, 50+ sources

Human Checkpoint?
  User said "review outline" or "check with me" -> INTERACTIVE mode
  Otherwise -> AUTONOMOUS mode [DEFAULT]
```

---

## Pipeline Overview

```
Phase 1: SCOPE       Define boundaries, decompose question
Phase 2: PLAN        Search strategy, agent assignments
Phase 3: RETRIEVE    Parallel multi-agent search with write protocol
Phase 4: TRIANGULATE Cross-reference claims across 3+ sources
Phase 5: SYNTHESIZE  Novel insights, patterns, implications
Phase 6: CRITIQUE    Red-team analysis, persona-based challenges
Phase 7: REFINE      Gap-filling, strengthen weak claims
Phase 8: PACKAGE     Report generation (Markdown + HTML + PDF)
```

Quick mode: Phases 1, 3, 8
Standard mode: Phases 1-5, 8
Deep/UltraDeep: All phases

---

## Workflow

### Phase 1: SCOPE

1. Parse the research question into sub-questions (3-8 depending on mode)
2. Identify target audience from context (technical, executive, academic, general)
3. Define temporal scope (default: last 2 years unless specified)
4. Set boundaries: what is IN scope, what is OUT

**Output:** Scope definition with sub-questions list.

**INTERACTIVE mode checkpoint:** Present scope and sub-questions to user for review before proceeding. Wait for approval or modifications.

**AUTONOMOUS mode:** Proceed immediately.

---

### Phase 2: PLAN

1. Map each sub-question to 2-3 search queries (total: 6-24 queries)
2. Assign agent workstreams: group related sub-questions into 3-6 parallel agent tracks
3. Define quality thresholds per mode:
   - quick: 5+ sources, avg credibility >50
   - standard: 15+ sources, avg credibility >60
   - deep: 30+ sources, avg credibility >70
   - ultradeep: 50+ sources, avg credibility >75

**INTERACTIVE mode checkpoint:** Present research plan (agent tracks, search strategy) to user. Wait for approval.

**AUTONOMOUS mode:** Announce plan briefly, proceed.

---

### Phase 3: RETRIEVE (Multi-Agent Parallel Search)

This is the core differentiator. Uses parallel Task agents with strict reliability protocols.

#### Step 1: Create Output Structure

```bash
# Create research workspace
TOPIC_SLUG="[extracted_from_question]"
DATE=$(date +%Y%m%d)
OUTDIR=~/Documents/${TOPIC_SLUG}_Research_${DATE}
mkdir -p "$OUTDIR/agents"
```

Create a skeleton file per agent track:
- `$OUTDIR/agents/track_1_[name].md`
- `$OUTDIR/agents/track_2_[name].md`
- etc.

Each skeleton starts with:
```markdown
# Track: [Name]
## Research Question: [Sub-question]
## Status: IN PROGRESS
---
```

#### Step 2: Launch Parallel Research Agents

Launch 3-6 agents using Task tool with `run_in_background: true`.

**CRITICAL: Agent Prompt Template**

Every research agent MUST receive this exact instruction block:

```
You are a research agent investigating: [SUB-QUESTION]

OUTPUT FILE: [agent_track_file_path]

=== WRITE-AFTER-SEARCH PROTOCOL (MANDATORY) ===
You MUST alternate between searching and writing. Never perform two
searches in a row without writing findings to your output file.

Pattern:
  1. WebSearch/WebFetch -> get results
  2. Edit output file -> write findings with inline source URLs
  3. WebSearch/WebFetch -> get more results
  4. Edit output file -> write additional findings
  REPEAT

If you search twice without writing, you are violating protocol.
Every factual claim MUST have an inline URL: "claim text (source: URL)"

=== WHAT TO WRITE ===
For each source found, write:
- Key findings as prose paragraphs (not bullets)
- Specific data: numbers, dates, percentages, quotes
- Source URL inline with each claim
- Your assessment of source credibility (1-10)
- Contradictions with other sources found

=== TOOLS ALLOWED ===
WebSearch, WebFetch, Read, Write, Edit, Glob, Grep
Do NOT use Bash.

=== COMPLETION ===
When done, change "## Status: IN PROGRESS" to "## Status: COMPLETE"
and add a "## Summary" section at the end with 3-5 key takeaways.

TARGET: Find 5-15 high-quality sources. Prioritize depth over breadth.
Time budget: ~3-5 minutes.
```

#### Step 3: Monitor Agents (Stuck Detection)

After launching all agents, monitor at escalating intervals:

```
Check 1: After 30 seconds  -> Read each agent file, record line counts
Check 2: After 2 minutes   -> Read files, compare line counts
Check 3: After 5 minutes   -> Read files, compare line counts
Check 4+: Every 5 minutes  -> Read files, compare line counts
```

**Stuck Agent Protocol:**
- An agent is STUCK if its file line count has not increased between two consecutive checks
- When stuck agent detected:
  1. Stop the stuck agent (TaskStop)
  2. Read the partial output file to salvage any findings
  3. Relaunch a NEW agent with:
     - Same sub-question
     - Pre-loaded context: "Previous agent found: [paste salvaged findings]"
     - Different search angle: "Try alternative search terms and sources"
  4. Continue monitoring

**Completion Detection:**
- All agent files contain "## Status: COMPLETE" -> proceed to Phase 4
- Timeout reached (mode-dependent) -> proceed with what we have, note gaps

**Timeout by mode:**
- quick: 3 minutes
- standard: 7 minutes
- deep: 15 minutes
- ultradeep: 30 minutes

#### Step 4: Also Run Direct Searches

While agents work in background, run 5-10 direct WebSearch calls in parallel (single message, multiple tool calls) for broad coverage:

```
WebSearch #1: [Core topic, semantic query]
WebSearch #2: [Technical keywords, specific terms]
WebSearch #3: [Recent results, date-filtered]
WebSearch #4: [Academic/research angle]
WebSearch #5: [Critical/contrarian perspective]
WebSearch #6: [Industry/market angle]
WebSearch #7: [Comparison angle, if applicable]
WebSearch #8: [Regional/demographic angle, if applicable]
```

Write results to `$OUTDIR/direct_search_findings.md` immediately after receiving them.

---

### Phase 4: TRIANGULATE

1. Read all agent output files and direct search findings
2. For each major claim, verify across 3+ independent sources
3. Build a claims table:

```markdown
| Claim | Sources | Confidence | Contradictions |
|-------|---------|------------|----------------|
| [claim] | [URL1], [URL2], [URL3] | High/Medium/Low | [any conflicts] |
```

4. Flag claims with <3 sources as "needs verification"
5. Flag contradictions for explicit discussion in report

**Source Credibility Scoring (0-100):**
- Domain authority: academic (.edu, .gov, journals) > established media > blogs > forums
- Recency: within 1 year = +20, within 2 years = +10, older = +0
- Specificity: has data/numbers = +15, vague claims = +0
- Author expertise: identified expert = +15, unknown = +0
- Corroboration: confirmed by 3+ sources = +20, unique claim = +0

---

### Phase 5: SYNTHESIZE

1. Identify cross-cutting patterns across all agent findings
2. Map relationships between findings (causal, correlational, contradictory)
3. Generate novel insights that go beyond what any single source states
4. Clearly label: FACT (from sources, cited) vs SYNTHESIS (your analysis, labeled)

---

### Phase 6: CRITIQUE (Deep/UltraDeep Only)

Red-team the findings using 3 adversarial personas:

1. **Skeptical Practitioner**: "Would this actually work in practice? What are the implementation risks?"
2. **Adversarial Reviewer**: "What evidence contradicts these findings? What's the weakest claim?"
3. **Domain Expert**: "What context is missing? What would a specialist flag?"

For each critique:
- If critical gap found: trigger **Gap Loop-Back** to Phase 3 with targeted delta-queries (max 2 loop-backs)
- If minor issue: note in Limitations section
- If no issue: proceed

---

### Phase 7: REFINE (Deep/UltraDeep Only)

1. Address gaps identified in Phase 6
2. Strengthen weak claims with additional sources
3. Resolve contradictions with evidence-based assessment
4. Final credibility scoring pass

---

### Phase 8: PACKAGE

#### 8.1: Generate Markdown Report

Create: `$OUTDIR/research_report_${DATE}_${TOPIC_SLUG}.md`

**Use progressive file assembly** - write each section individually via Edit tool to support unlimited length.

**Report Structure:**

```markdown
# [Research Title]

## Executive Summary
[200-400 words. Key findings, methodology, confidence level.]

## Introduction
[400-800 words. Research question, scope, methodology, assumptions.]

## Finding 1: [Title]
[600-2000 words per finding. Prose paragraphs, not bullets.
Every claim cited [N]. Specific data: numbers, dates, percentages.
Structure: Context -> Evidence -> Implications.]

## Finding 2: [Title]
[Same structure...]

## Finding N: [Title]
[As many findings as evidence warrants. 4-8 for standard, 8-15 for deep.]

## Synthesis & Insights
[500-1000 words. Patterns, relationships, novel insights.
Clearly labeled as SYNTHESIS, not fact.]

## Claims Verification Table
[Table of major claims with source count and confidence rating.]

## Limitations & Caveats
[Gaps in evidence, assumptions made, contradictions unresolved.]

## Recommendations
[Immediate actions, next steps, further research needed.]

## Bibliography
[EVERY citation [1]-[N] with full metadata.
Format: [N] Author/Org (Year). "Title". Publication. URL
NO placeholders. NO ranges. NO truncation.
If 50 sources cited, write all 50 entries.]

## Methodology
[Research process, tools used, verification approach.]
```

**Writing Standards:**
- Prose-first: 80%+ flowing paragraphs, bullets only for distinct lists
- Precision: exact numbers ("reduced 23%", not "significantly improved")
- Citation density: every factual claim cited in same sentence
- No vague attribution: never "studies show..." - always "[Author] found... [N]"
- Label synthesis: "This suggests..." not "Research proves..."
- Admit gaps: "No sources found for X" not fabricated citations

**Length by Mode:**
- quick: 2,000-4,000 words
- standard: 4,000-8,000 words
- deep: 8,000-15,000 words
- ultradeep: 15,000-30,000+ words

**Auto-Continuation for Long Reports (>18,000 words):**
When approaching the output limit:
1. Save continuation state to `$OUTDIR/continuation_state.json` with:
   - Sections completed and remaining
   - All citations collected so far
   - Research context summary
   - Quality metrics (avg words/section, citation density)
2. Spawn continuation agent via Task tool with full context
3. Continuation agent reads state, reviews last 3 sections for style, continues
4. Chain continues until complete

#### 8.2: Generate HTML Report

Convert markdown to McKinsey-style HTML:
- Sharp corners, muted corporate palette (navy #003d5c, gray #f8f9fa)
- Metrics dashboard at top with 3-4 key quantitative findings
- Compact layout, 14px base font, info-first structure
- Citation tooltips on hover showing source details
- Save to: `$OUTDIR/research_report_${DATE}_${TOPIC_SLUG}.html`
- Open in browser automatically

#### 8.3: Generate PDF

Use Task tool to generate PDF from markdown:
- Save to: `$OUTDIR/research_report_${DATE}_${TOPIC_SLUG}.pdf`
- Open in default viewer

#### 8.4: Deliver

Tell user:
1. Executive summary (inline in chat)
2. Folder path with all files
3. Source count and average credibility score
4. Any limitations or gaps
5. Suggested next steps

---

## Anti-Hallucination Protocol

These rules are NON-NEGOTIABLE:

1. **Every factual claim MUST cite a specific source [N]** in the same sentence
2. **Distinguish FACT from SYNTHESIS**: "According to [1]..." vs "This suggests..."
3. **Never fabricate citations**: if unsure, say "No sources found for X"
4. **No vague attribution**: never "research shows..." or "experts believe..."
5. **Verify before citing**: don't assume a source says X - only cite what you actually read
6. **Inline URLs in agent files**: agents write "(source: URL)" after every claim during retrieval

---

## Error Handling

**Stop immediately if:**
- <5 sources after exhaustive search -> report limitation, ask user
- 2 validation failures on same error -> pause, report, ask user
- User interrupts -> confirm new direction

**Graceful degradation:**
- 5-10 sources -> note in limitations, extra verification, proceed
- Stuck agents not recovering -> proceed with direct search results only
- Timeout reached -> package partial results, document gaps

---

## Validation Checklist (Before Delivery)

- [ ] Executive summary exists (50-250 words)
- [ ] All required sections present
- [ ] Citations formatted [1], [2], [3] consistently
- [ ] Bibliography has EVERY cited source (no gaps, no placeholders)
- [ ] No placeholder text (TBD, TODO, [citation needed])
- [ ] Word count meets mode minimum
- [ ] 80%+ prose (not bullets)
- [ ] Claims verification table included
- [ ] Limitations section addresses gaps honestly
- [ ] All agent output files saved in $OUTDIR/agents/

---

## Autonomy Principle

Default: operate autonomously. Infer assumptions from query context.

Only pause for user input when:
- Query is incomprehensible
- INTERACTIVE mode is active (user requested outline review)
- Critical error requiring user decision

When in doubt: proceed with standard mode. User will redirect if wrong.
