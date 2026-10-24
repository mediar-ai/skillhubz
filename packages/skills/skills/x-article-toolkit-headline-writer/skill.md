---
name: headline-writer
description: >
  Write, score and improve headlines for X Articles (and other long posts) with rules measured on
  40,478 X Articles: 6,835 that passed 100k views and 33,643 that stayed under 100k. Use whenever you
  need a headline or a title, want headline options for a draft, or ask which headline is stronger.
  Model-neutral canonical edition: works in any AI system that can read these files; scripts and
  the dataset are optional accelerators, not requirements.
version: 1.0.0
source: "research and original skill by @fuckgrowth (Sep 2026); see SOURCES.md"
toolkit: x-article-toolkit
---

# HEADLINE WRITER

What this is: a headline procedure built from 40,478 X Articles: 6,835 over 100k views and 33,643 under, Jan 1 to Sep 26, 2026, research by @fuckgrowth (the X article "how to write better headlines"). Every rule compares winners with failures from same-size accounts in the same topic, so a big account or a hot topic can't make a pattern look good. The dataset (every article over 100k views, tagged with the moves, failure marks and level used below) and the research doc with every number and the method are linked in `SOURCES.md` at the repository root.

This is the canonical, model-neutral edition. It describes WHAT to do; how a given AI system loads these files is the job of `adapters/` (GrokBot, ChatGPT, Claude). Nothing here depends on a particular model, a particular folder on disk or the ability to run code.

## WHAT YOU NEED

Required (in this folder): `rules.md`, `templates.md`.
Optional accelerators:
- `scripts/headline_check.py` scores candidates mechanically (Python 3, standard library). If you cannot run code, apply THE HEADLINE CHECK and the level definitions from `rules.md` by hand; they are written so a reader can score without the script.
- The public dataset (`shared/data/`, fetched with `python3 shared/data/fetch_dataset.py`) works as a swipe file and powers "nearest winners". Without it, skip the swipe-file step and the nearest-winner column; every rule still applies.
- A state store (`state/README.md`) holding the user's approved headlines, feedback and results. Only read and write it when one is connected; never claim learning from files that aren't there.

## STEP 0: LOAD (every run, in this order)
1. `rules.md`: the seven moves, the four failure marks, the five levels and every number behind them, which you treat as fixed.
2. `templates.md`: fill-in templates by shape, each with the moves it carries and real winners with their views.
3. If the dataset is available: filter by the article's topic, sort by views, and read the top winners at level L3 and L4 in that topic, then the winners from accounts under 10k followers (column `followers_at_scan`). The `moves`, `failure_marks` and `level` columns use the same definitions as `rules.md`.
4. If a state store is connected: the headlines the user approved, their verbatim feedback and real results. When the user's recorded feedback and `rules.md` disagree, the user's feedback wins.

## STEP 1: INTAKE
Accept either a finished draft or structured notes about the article.

If you get a finished draft, take everything below from the text yourself and ask nothing unless something is genuinely unknowable from the draft (typically only the completeness question and the voice). Do not interrogate the user about things the draft already answers.

What you need, from the draft or from the user (ask once for whatever is missing):
- The article's promise in one sentence: "after reading this, you can ___."
- The named thing readers are searching for this month: the tool, company, person or event the article is about.
- Numbers that are true: results, money, counts, sample sizes.
- A timeframe: how long the result took, or how long the reader needs.
- Whether the article really is complete (a full guide, course, template or setup). Only a complete article may carry a completeness tag.
- The topic (ai, marketing, crypto and so on) and the voice: lowercase for a personal receipt, Title Case for a guide.

## STEP 2: CHOOSE THE SHAPE
Pick a shape that promises something: an announcement with "introducing" (2.16x as often), a receipt like "i built" (1.57x), a guide or course (1.54x) or a how to (1.51x). Skip the question (0.73x) and the "Label: subtitle" (0.89x). A plain statement is 53% of all headlines and reaches 100k 0.92x as often, because it names a topic and promises nothing. Use "introducing" only when you are actually launching something.

## STEP 3: GENERATE
Write 10 candidates:
- At least 6 come from `templates.md` with every slot filled truthfully.
- Aim for L3 or L4: a promise shape, the named thing and one specific (a clock, a round dollar figure or a receipt), plus the completeness tag when the article is complete.
- Keep every failure mark out: no question mark, no "why" or "from" opener and no "why" anywhere, no "Label:" colon, no "recap" or "weekly".
- Use this month's name, and when the dataset is available check the newest rows of your topic for it, since the name that wins rotates every few months. When it isn't available, say which name you assumed and why.
- Keep the case consistent inside each candidate.
- Clone a shape, never the words: find the closest winner in your topic with the same shape and swap every slot. Of 100 headlines that two or more accounts posted word for word, 50 had a copy that died under 10k views.

## STEP 4: SCORE
With code execution (from the repository root):
```
python3 skills/headline-writer/scripts/headline_check.py "headline one" "headline two"
python3 skills/headline-writer/scripts/headline_check.py --names "jev,acme" --file candidates.txt
python3 skills/headline-writer/scripts/headline_check.py --json "headline one"      # machine-readable, for adapters and state
```
Per headline it prints the level (L0 to L4) with the moves and failure marks it found, the 10-point check A to J, a weighted score and, when the dataset is present, the three nearest winners. `--names` adds the article's own searched things to check A.

Without code execution: for each candidate, count the move families and failure marks using the definitions in `rules.md` to get the level, then score the ten checks A to J listed under THE HEADLINE CHECK in `rules.md`, one point each. Report both.

Drop anything below L2 or under 5/10 on the check, then fix and re-score. The score is a floor, and a true L3 headline beats an L4 that promises more than the article delivers.

## STEP 5: PRESENT
Show the top 5 as a table with the headline, its level, its moves, the score and (when available) the nearest winner it echoes with its views. Explain the relevant rules in one or two sentences, not a lecture. Recommend one in a single sentence, then ask the user to approve it, pick another or give feedback.

## STEP 6: LOCK AND RECORD
- When the user approves a headline, it is LOCKED. Restate it verbatim and label it `Locked headline:` so a later step (hook-writer, cover-writer, the publishing package) can pick it up unchanged.
- If a state store is connected, record the date, topic, locked headline, its level and moves, the alternatives shown, and why the user chose it, following the schema in `shared/schemas/`. Record feedback verbatim with the rule you take from it. Record views at 24 hours and 7 days when the user supplies them.
- If no state store is connected, skip this step silently. Do not describe the toolkit as learning or remembering.

## AFTER THE HEADLINE IS LOCKED
Run hook-writer against the locked headline, because the first two lines of the article sit on the card right under it. Only continue automatically when the user asked for the full pipeline (see `workflows/x-article-publishing.md`); when they asked for headlines only, stop here.
