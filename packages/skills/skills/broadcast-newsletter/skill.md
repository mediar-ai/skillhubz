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
- **Structure:** Lead with main feature (1-2 paragraphs), bullet list of other changes, download CTA, founder sign-off
- **Length:** ~150 words max

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

Response includes `recipient_count` and first 10 recipients. Show this to the user before sending.

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

### What the API handles automatically

- Filters unsubscribed and bounced/complained users
- Dedup guard: skips if outbound email sent to same address within 6 hours
- Appends unsubscribe footer + List-Unsubscribe headers
- Records every send in the DB
- Rate limiting: 600ms between sends, 3s pause every 10

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

---

## Checklist

- [ ] Dry run shows correct recipient count, shown to user
- [ ] Test email sent and visually verified
- [ ] Content reviewed and approved
- [ ] User has explicitly confirmed "send it"
