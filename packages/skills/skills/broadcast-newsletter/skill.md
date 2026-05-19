---
name: broadcast-newsletter
description: "End-to-end newsletter pipeline: investigate recent features, draft, send via API endpoint, and track delivery/open/click metrics."
---

# Broadcast Newsletter Skill

End-to-end newsletter pipeline: investigate recent features, draft a newsletter, send it to all users via a backend API, and track delivery/open/click metrics.

## When to Use

- User says "send a newsletter", "broadcast email", "email all users", "send an update"
- User asks to check broadcast stats, open rates, or click rates for a past newsletter

## Pipeline Overview

Run stages in order, get user approval between stages.

---

## Stage 1: Investigate Recent Features

1. Run `git log --since="N days ago" --oneline --no-merges` in the product repo
2. Read `CHANGELOG.json` for user-facing descriptions
3. Group commits into top-level features, ignore refactors/CI
4. Present top 3 features ranked by "wow factor" and ask which to focus on

## Stage 2: Deep-Dive the Selected Feature

Use an Explore agent to read relevant source files. Understand how it works, what the user sees, key capabilities. Report back for alignment.

## Stage 3: Draft the Newsletter

- **Tone:** Short, casual, founder-to-user. Not marketing-speak.
- **Structure:** Lead with main feature (1-2 paragraphs), bullet list of other changes, CTA, founder sign-off
- **Length:** ~150 words max

### CTA Rules (non-negotiable)

Every newsletter MUST have at least one CLICKABLE CTA. Instructions like "open Settings > Remote Control" don't count: there's nothing to click, and the open-but-don't-click pattern will tank CTR. Use at least one of:

- **A real deep link or URL** users can tap right now (`chat.fazm.ai`, a `fazm://` URL scheme, a specific landing page). The URL must be a complete clickable thing in the email, not "go to fazm.ai then click X".
- **A 10-second starter prompt** ("try this right now: open chat.fazm.ai on your phone, type 'summarize my last 3 emails'"). Removes "what would I even ask it" paralysis.
- **Reply-as-CTA** ("hit reply with X, I'll send you Y"). Replies are the strongest engagement signal you can get; they beat clicks and start a thread.

Bold the primary action with `**...**` so the eye lands on it. Never make the only link a generic "Download here" line, existing users don't need it and it's noise.

The May 12, 2026 send (47% open / 3% CTR) failed exactly here: the only link was "Download" and the feature CTA pointed to in-app menus with nothing to click. 250 people opened, 16 clicked.

Present the draft to the user for approval before proceeding.

---

## Stage 4: Send the Newsletter

All broadcasts go through the production API endpoint. No scripts, no direct DB/Resend calls.

**Endpoint:** `POST https://<your-dashboard-domain>/api/crm/broadcast`
**Auth:** `Authorization: Bearer $CRON_SECRET`

### Dry run first (always)

```bash
curl -X POST https://<your-domain>/api/crm/broadcast \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"product":"fazm","subject":"Your subject","body":"Body text...","dry_run":true}'
```

Response includes `recipient_count`, first 10 recipients, and a **`tracking` block**:

```json
"tracking": {
  "html_body_length": 2876,
  "text_body_length": 1783,
  "will_track_opens_and_clicks": true
}
```

**Always verify `will_track_opens_and_clicks` is `true` and `html_body_length` > 50** before showing the dry run to the user. If it's false, opens and clicks will silently record as zero (this is what happened to the May 5, 2026 "ChatGPT 5.5" broadcast: 516 sends, 0 tracked opens). The route will also hard-fail a real send if HTML can't be derived.

### Test email to yourself

```bash
curl -X POST https://<your-domain>/api/crm/broadcast \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"product":"fazm","subject":"Your subject","body":"Body text...","test_email":"your@email.com"}'
```

Sends only to that address with [TEST] prefix. Bypasses unsubscribe check.

### Real send (only after user confirms)

```bash
curl -X POST https://<your-domain>/api/crm/broadcast \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"product":"fazm","subject":"Your subject","body":"Body text..."}'
```

Response: `{ success, total, sent, skipped, failed, errors }`

`skipped` = unsubscribed or dedup-blocked (normal). `failed` = actual errors.

### Embedding an image or GIF

The endpoint accepts an optional `image_url` field. The image is injected into the derived HTML between the lead paragraph and the rest of the body. Plain-text recipients see nothing (no inline image fallback), so don't put critical info in the visual.

```bash
curl -X POST https://<your-domain>/api/crm/broadcast \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"product":"fazm","subject":"...","body":"...","image_url":"https://fazm.ai/agents.gif"}'
```

**Hosting pattern:** drop the file in `~/fazm-website/public/<filename>` and push. It serves at `https://fazm.ai/<filename>` automatically via Vercel (e.g. `agents.gif` → `https://fazm.ai/agents.gif`). Verify with `curl -I` returning 200 before sending.

**GIF sizing recipe** (known-good for inbox preview without hurting deliverability):
- Target file size: **1-2 MB** (3 MB is the ceiling)
- Width: ~260px for vertical/portrait source; ~480px for landscape
- Frame rate: 8 fps, loop length 5-8s
- Convert MP4 with: `ffmpeg -i input.mp4 -vf "fps=8,scale=260:-1:flags=lanczos" -loop 0 output.gif`
- Anything > 3 MB risks Gmail clipping the email and slow loads on mobile

After test send, **open the email in Gmail web** to verify the image actually loads. Gmail proxies images and occasionally blocks self-hosted GIFs on the first send to a domain.

### What the API handles automatically

- **Unsubscribe filtering**: drops recipients who unsubscribed or whose address bounced/complained (handled inside `sendEmail`, before any Resend API call)
- **Unsubscribe footer**: auto-appends clickable "Unsubscribe" link to the HTML body and raw URL to the text body (`appendUnsubscribeHtml` / `appendUnsubscribeText` in `src/lib/resend.ts`)
- **One-click unsubscribe headers**: sets `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` on every send (required by Gmail/Yahoo bulk-sender rules)
- **HTML auto-derivation**: you pass plain `text` only; the API generates the HTML version via `textToHtml()` so open/click tracking pixels get inserted. If derivation produces empty HTML, the real send is rejected with a 400
- **Dedup guard**: skips if an outbound email was sent to the same address within the last 6 hours (counted as `skipped`, not `failed`)
- **Persistence**: every send is written to `fazm_emails` / `assrt_emails` with status transitions driven by Resend webhooks
- **Rate limiting**: 600ms between sends, plus a 3s pause every 10

---

## Stage 5: Track Results

```sql
SELECT
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
FROM fazm_emails
WHERE direction = 'outbound'
  AND subject = '<SUBJECT>'
  AND created_at > NOW() - INTERVAL '7 days';
```

Stats arrive via Resend webhooks. Check after 1h, 24h, and 48h.

### Engagement Benchmarks

What "good" looks like for a Fazm-scale broadcast (~500 engaged Mac app users). Anything below the floor means something broke or the content failed.

| Metric | Floor (something is wrong) | OK | Strong |
|---|---|---|---|
| Delivery rate | < 92% | 92-97% | 97%+ |
| Open rate | < 35% | 35-50% | 50%+ |
| CTR (of delivered) | < 3% | 3-5% | 5-10%+ |
| Reply rate | n/a | any reply is a win | 5+ replies |

**The metric that actually matters: clicks per send.** Opens are vanity at this scale. 250 opens with 16 clicks (May 12, 2026 send) means you woke up 250 people and converted 16. That's the funnel leak. If clicks < 20 on a 500-person send, the CTA was structural, not vibes; revisit the Stage 3 CTA rules.

**Transactional sends have different thresholds.** The "Your Fazm download link" emails routinely hit 60%+ open and 50%+ CTR because users need that link. Don't compare a feature-update broadcast to a transactional send.

**Downstream conversion is the only real KPI.** Tie clicks to the PostHog `distinct_id` via `fazm_workflow_users.posthog_distinct_id` and check activation within 48h. A broadcast that drives 30 clicks and 0 activations is worse than one that drives 10 clicks and 5 activations.

---

## Checklist

- [ ] Draft has at least one CLICKABLE CTA (URL, deep link, or reply-ask), bold-formatted
- [ ] Dry run shows correct recipient count, shown to user
- [ ] Dry-run `tracking.will_track_opens_and_clicks` is `true` and `html_body_length` > 50
- [ ] If using `image_url`: URL returns 200 via `curl -I` before send
- [ ] Test email sent and visually verified (open in Gmail web, confirm GIF loads if used)
- [ ] After test email lands, confirm the DB row has a non-null `body_html` (sanity check that tracking is wired)
- [ ] Content reviewed and approved
- [ ] User has explicitly confirmed "send it"

## Known Failure Modes

- **Plain-text-only sends → zero tracking.** Resend's open pixel and click-rewrites only exist in HTML. If `body_html` is null or empty for the recipient row, opens and clicks will record as zero no matter what. The May 5, 2026 ChatGPT 5.5 broadcast hit this. The dry-run `tracking` block and the route's hard-fail guard exist to prevent a repeat.
- **Webhook lag.** Resend webhooks can take minutes to hours to update open/click stats. Don't panic at low open rates in the first hour after send; recheck at 1h, 24h, 48h.
- **`status` column is the latest state, not a count.** A row that moves `sent → delivered → opened → clicked` overwrites earlier statuses. For accurate rates, count via `opened_at IS NOT NULL` and `clicked_at IS NOT NULL`, not via `status = 'opened'`.
