---
name: claude-usage-calc
description: Calculate Claude Code token consumption, message counts, and list-price cost from local JSONL transcript logs. Use when the user asks "how many tokens / prompts / messages did I use", "what's my Claude cost", "usage in last N days", or anything about local Claude Code usage analytics.
allowed-tools: Bash, Read
---

# Claude Code Usage Calculation

Compute token usage, prompt counts, and cost from local Claude Code transcript files.

## Where the data lives

- Transcripts: `~/.claude/projects/**/*.jsonl` (one file per session, one JSON object per line)
- Each line has `timestamp` (ISO8601 UTC), `type` (`user` | `assistant` | `system`), and for assistant lines a `message.usage` block from the API response
- No transcripts older than ~90d typically exist locally (rotated/cleaned)

## CRITICAL: things to get right

### 1. Each `usage` block is per-API-call, NOT per-conversation
Verified by inspection: turn 1 has `cache_read=11k`, turn 146 has `cache_read=89k`, growing as the cached prefix grows. Summing across turns is correct for billing because each API call is independently charged. Cache reads dominating (often 90%+ of tokens) is expected and normal, not a counting bug.

### 2. DEDUPE BY `message.id` — THIS IS THE BIGGEST FOOTGUN
Claude Code logs the same assistant message multiple times across parent chains and sidechain entries. **Without dedup, totals are inflated ~2.4×.** Always keep a `seen` set of `message.id` and skip duplicates. A real measurement showed 794k raw assistant entries collapsing to 376k unique turns.

### 3. "Real human prompts" ≠ all `type:user` entries
The harness logs tool_result continuations as `type:user`. To count actual prompts the human sent, filter `type:user` entries AND exclude any whose `message.content` is a list containing a block with `type=="tool_result"`. In a real run: 564,909 raw user entries → 53,406 actual human prompts.

### 4. Filter by `timestamp`, not file mtime
File mtime is unreliable (a session touched today may include messages from weeks ago). Parse `timestamp` per line and bucket by `(now - t).days`.

### 5. List price ≠ what the user actually pays
ALWAYS state this explicitly in the report. If the user is on Max / Pro / committed-use / enterprise, real billing is dramatically lower. Tell them the authoritative number is at `console.anthropic.com` or `claude.ai` billing.

### 6. Pricing per million tokens (USD, list price)
| Family  | input | output | cache_create | cache_read |
|---------|-------|--------|--------------|------------|
| opus    | 15.00 | 75.00  | 18.75        | 1.50       |
| sonnet  |  3.00 | 15.00  |  3.75        | 0.30       |
| haiku   |  0.80 |  4.00  |  1.00        | 0.08       |

Detect family from `message.model` substring (`opus` / `sonnet` / `haiku`). Default unknown to sonnet.

## What NOT to do

- ❌ Do not sum raw assistant entries without deduping by `message.id`
- ❌ Do not count all `type:user` entries as "prompts" (most are tool_results)
- ❌ Do not filter by file mtime instead of per-line `timestamp`
- ❌ Do not present list-price cost as "what you paid" — always caveat it
- ❌ Do not exclude cache_read from totals "because it looks too big" — it IS billed (at 0.1× input)
- ❌ Do not assume `usage` is cumulative across the conversation — it is per-API-call
- ❌ Do not write throwaway scripts in the repo or home dir — use `scripts/` (gitignored) if needed

## What TO do

- ✅ Stream all JSONLs through one Python pass via `find ... -print0 | xargs -0 cat | python3 -c '...'`
- ✅ Dedupe by `message.id` with a `seen` set
- ✅ Bucket by age: `0-30d`, `30-60d`, `60-90d` for trend questions
- ✅ Break out by model family (opus / sonnet / haiku) — Opus typically dominates cost
- ✅ Report all four token buckets separately: input, output, cache_create, cache_read
- ✅ Always show: real human prompts, unique assistant turns, total tokens, list-price cost
- ✅ Caveat that list price ≠ real bill
- ✅ Point user to console.anthropic.com or claude.ai billing for ground truth

## Reference script

Run this to compute last-30d usage. Adjust the day window as needed.

```bash
find ~/.claude/projects -name "*.jsonl" -print0 2>/dev/null | xargs -0 cat 2>/dev/null | python3 -c "
import sys, json
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
WINDOW_DAYS = 30

PRICES = {
  'opus':   {'in':15.00,'out':75.00,'cc':18.75,'cr':1.50},
  'sonnet': {'in': 3.00,'out':15.00,'cc': 3.75,'cr':0.30},
  'haiku':  {'in': 0.80,'out': 4.00,'cc': 1.00,'cr':0.08},
}
def fam(m):
    if not m: return 'sonnet'
    m = m.lower()
    if 'opus' in m: return 'opus'
    if 'haiku' in m: return 'haiku'
    return 'sonnet'

seen = set()
agg = {}
real_user_msgs = 0
dup_skipped = 0

for line in sys.stdin:
    try:
        d = json.loads(line)
        ts = d.get('timestamp')
        if not ts: continue
        t = datetime.fromisoformat(ts.replace('Z','+00:00'))
        if (now - t).days >= WINDOW_DAYS: continue

        if d.get('type') == 'user':
            msg = d.get('message',{})
            c = msg.get('content') if isinstance(msg,dict) else None
            tool_result = isinstance(c,list) and any(isinstance(x,dict) and x.get('type')=='tool_result' for x in c)
            if not tool_result:
                real_user_msgs += 1
            continue

        if d.get('type') != 'assistant': continue
        msg = d.get('message') if isinstance(d.get('message'),dict) else None
        if not msg: continue
        mid = msg.get('id')
        if mid:
            if mid in seen:
                dup_skipped += 1
                continue
            seen.add(mid)
        u = msg.get('usage') or {}
        f = fam(msg.get('model'))
        a = agg.setdefault(f, {'in':0,'out':0,'cc':0,'cr':0,'turns':0})
        a['in']  += u.get('input_tokens',0) or 0
        a['out'] += u.get('output_tokens',0) or 0
        a['cc']  += u.get('cache_creation_input_tokens',0) or 0
        a['cr']  += u.get('cache_read_input_tokens',0) or 0
        a['turns'] += 1
    except: pass

grand_cost = 0.0
grand_tok  = 0
print(f'{\"model\":<8} {\"turns\":>9} {\"in\":>14} {\"out\":>14} {\"cc\":>16} {\"cr\":>16}   {\"cost\":>11}')
for f,a in sorted(agg.items()):
    p = PRICES[f]
    cost = (a['in']*p['in']+a['out']*p['out']+a['cc']*p['cc']+a['cr']*p['cr'])/1_000_000
    grand_cost += cost
    grand_tok += a['in']+a['out']+a['cc']+a['cr']
    print(f\"{f:<8} {a['turns']:>9,} {a['in']:>14,} {a['out']:>14,} {a['cc']:>16,} {a['cr']:>16,}   \${cost:>10,.2f}\")
print()
print(f'real human prompts:    {real_user_msgs:,}')
print(f'unique assistant turns: {sum(a[\"turns\"] for a in agg.values()):,}  (deduped {dup_skipped:,} duplicates)')
print(f'TOTAL tokens:           {grand_tok:,}')
print(f'TOTAL cost (LIST price): \${grand_cost:,.2f}')
print()
print('NOTE: list price; real bill is lower if on Max/Pro/committed-use.')
print('Authoritative usage: console.anthropic.com or claude.ai billing.')
"
```

## Reporting format

Always report (in this order):
1. **Real human prompts** sent in window
2. **Unique assistant API calls** (with dedup count noted)
3. Per-model breakdown table (turns / input / output / cache_create / cache_read / cost)
4. **TOTAL tokens** and **TOTAL list-price cost**
5. **Caveat**: list price ≠ real bill, point to console for ground truth
6. If asked about trends, also bucket `30-60d` and `60-90d` and explain growth drivers (cache_read inflation from longer sessions / parallel agents is normal)
