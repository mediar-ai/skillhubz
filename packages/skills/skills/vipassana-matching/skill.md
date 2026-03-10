---
name: vipassana-matching
description: Full Practice Buddy matching workflow for vipassana.cool — check submissions, research candidates, identify matches, send intro emails, and manage the waitlist
allowed-tools: Bash, Read, Edit, Write, WebSearch
---

# Vipassana Practice Buddy Matching Skill

Trigger this skill when the user asks to:
- Do matching / run matching
- Check submissions or the waitlist
- Review who to match
- Send intro emails
- Manage the Practice Buddy waitlist
- Check inbound emails or replies from matched pairs

---

## Project Context

| Item | Value |
|------|-------|
| Site | vipassana.cool |
| Feature | Practice Buddy |
| Project root | `<project-root>` |
| DB | Neon Postgres (serverless) |
| Credentials | `.env.local` (see `DATABASE_URL`, `RESEND_API_KEY`) |
| Email from | `Matt from Vipassana.cool <matt@vipassana.cool>` |
| Admin dashboard | `https://vipassana.cool/admin/matching` |

> Matching is currently **manual**: a human reviews and decides who to match. The DB and email infrastructure is fully automated once the decision is made.

---

## Database Schema

### `waitlist_entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `email` | text | Unique |
| `name` | text | Full name |
| `status` | text | `pending` or `matched` |
| `timezone` | text | e.g. `America/New_York` |
| `city` | text | |
| `frequency` | text | e.g. `Once daily`, `Twice daily` |
| `morning_time` | text | e.g. `6:00 AM` |
| `evening_time` | text | e.g. `8:00 PM` |
| `session_duration` | text | e.g. `1 hour`, `30 minutes` |
| `is_old_student` | text | `Yes` / `No` |
| `is_goenka_tradition` | text | `Yes` / `No` |
| `has_maintained_practice` | text | e.g. `Regularly`, `Inconsistently` |
| `practice_length` | text | e.g. `3 years`, `6 months` |
| `days` | text | JSON array of days |
| `requested_match_id` | uuid | If they requested a specific person |
| `research_notes` | text | Claude's research findings |
| `created_at` | text | ISO timestamp |
| `updated_at` | text | ISO timestamp |

### `matches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `person_a_id` | uuid | FK to waitlist_entries |
| `person_b_id` | uuid | FK to waitlist_entries |
| `status` | text | `pending`, `active`, or `ended` |
| `notes` | text | Optional notes |
| `created_at` | text | ISO timestamp |

### `vipassana_emails`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `resend_id` | text | Resend message ID |
| `direction` | text | `inbound` or `outbound` |
| `from_email` | text | |
| `to_email` | text | Comma-separated for outbound |
| `subject` | text | |
| `body_text` | text | Plain text body |
| `body_html` | text | HTML body |
| `status` | text | `sent`, `failed`, etc. |
| `created_at` | text | ISO timestamp |

---

## Node.js Query Patterns

Use the Neon serverless driver. Write queries to a temp script and run with `node`.

### Setup a query script

```bash
cat > /tmp/vipassana-query.mjs << 'EOF'
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Your query here
const rows = await sql`SELECT * FROM waitlist_entries WHERE status = 'pending' ORDER BY created_at DESC`;
console.log(JSON.stringify(rows, null, 2));
EOF

cd <project-root> && node --env-file=.env.local /tmp/vipassana-query.mjs
```

---

## Full Matching Workflow

### Step 1 - Check Pending Submissions

Query all pending waitlist entries and display their matching-relevant fields:

```javascript
const pending = await sql`
  SELECT
    id, name, email, timezone, city,
    frequency, session_duration,
    morning_time, evening_time,
    is_old_student, has_maintained_practice,
    practice_length, requested_match_id,
    research_notes, created_at
  FROM waitlist_entries
  WHERE status = 'pending'
  ORDER BY created_at ASC
`;
```

Display a human-readable summary: name, email, city/timezone, frequency, session duration, old student status, practice length, requested match.

---

### Step 2 - Check Existing Matches

See who is already matched to avoid double-matching:

```javascript
const matches = await sql`
  SELECT
    m.id, m.status, m.created_at,
    a.name AS person_a_name, a.email AS person_a_email,
    b.name AS person_b_name, b.email AS person_b_email
  FROM matches m
  JOIN waitlist_entries a ON a.id = m.person_a_id
  JOIN waitlist_entries b ON b.id = m.person_b_id
  ORDER BY m.created_at DESC
`;
```

---

### Step 3 - Check Inbound Emails

Look for replies from matched pairs:

```javascript
const inbound = await sql`
  SELECT id, from_email, to_email, subject, body_text, created_at
  FROM vipassana_emails
  WHERE direction = 'inbound'
  ORDER BY created_at DESC
  LIMIT 20
`;
```

If someone replied only to you (not reply-all), see Step 9 for the forward flow.

---

### Step 4 - Research Candidates

For each pending candidate, web search their name + email domain / city to find public info (LinkedIn, personal site, occupation, background). This makes the intro email more personal.

```
WebSearch: "Jane Smith" site:linkedin.com OR "Jane Smith" vipassana
```

Store findings in the `research_notes` column:

```javascript
await sql`
  UPDATE waitlist_entries
  SET research_notes = ${notes}, updated_at = ${new Date().toISOString()}
  WHERE id = ${id}
`;
```

---

### Step 5 - Identify Good Matches

Evaluate pending pairs against these criteria (in priority order):

| Criterion | Rule |
|-----------|------|
| Requested match | `requested_match_id` is set - always match these first |
| Timezone | Same timezone or +-3 hours offset preferred |
| Frequency | Same (Once daily / Twice daily) required |
| Session duration | Within +-15 minutes preferred |
| Old student | Both `is_old_student = 'Yes'` preferred |
| Morning time | Within +-2 hours preferred |

Hard to match - leave as pending, wait for future signups:
- Very short sessions (15 min) with no other 15-min sitters
- Unique/exotic timezones with no nearby match
- Non-old-students when all remaining pending are old students

---

### Step 6 - Create Match in DB

Once you've decided on a pair:

```javascript
const matchId = crypto.randomUUID();
const now = new Date().toISOString();

await sql`
  INSERT INTO matches (id, person_a_id, person_b_id, status, created_at)
  VALUES (${matchId}, ${personAId}, ${personBId}, 'pending', ${now})
`;

await sql`UPDATE waitlist_entries SET status = 'matched', updated_at = ${now} WHERE id = ${personAId}`;
await sql`UPDATE waitlist_entries SET status = 'matched', updated_at = ${now} WHERE id = ${personBId}`;
```

Or use the admin API:

```bash
curl -X POST https://vipassana.cool/api/admin/matches \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"personAId": "<uuid>", "personBId": "<uuid>", "sendEmail": false}'
```

Use `"sendEmail": false` if you want to send a custom email manually (Step 7).

---

### Step 7 - Send Intro Email via Resend

**Critical**: Set `reply_to` to both email addresses so "Reply All" reaches both people.

#### Resend curl pattern

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Matt from Vipassana.cool <matt@vipassana.cool>",
    "to": ["person_a@example.com", "person_b@example.com"],
    "reply_to": ["person_a@example.com", "person_b@example.com"],
    "subject": "Your Practice Buddy match is here",
    "html": "<html>...</html>"
  }'
```

#### Email body guidelines

- Address both by first name: "Hi [Name A] and [Name B],"
- Mention shared traits (same timezone, same frequency, similar session length, both old students)
- Include city + practice history for each person (personalized from DB data)
- Use research notes to add a personal touch (occupation, mutual interest)
- Instruct: "Just reply all to this email to introduce yourselves"
- End with: "Be happy, Matt"
- Add P.S.: "I do a brief web search on name and email to write a more personal intro. Hope that's okay."

#### Rate limit

Resend allows 2 requests/sec max. When sending multiple emails back-to-back:

```bash
curl ... # pair 1
sleep 2
curl ... # pair 2
```

---

### Step 8 - Log Email to DB

After a successful Resend response, log the outbound email:

```javascript
const resendId = emailResult.data?.id || null;

await sql`
  INSERT INTO vipassana_emails (
    resend_id, direction, from_email, to_email,
    subject, body_html, status, created_at
  )
  VALUES (
    ${resendId}, 'outbound',
    'Matt from Vipassana.cool <matt@vipassana.cool>',
    ${[personA.email, personB.email].join(", ")},
    'Your Practice Buddy match is here',
    ${htmlBody}, 'sent', ${new Date().toISOString()}
  )
`;
```

---

### Step 9 - Handle Reply-All Failures

If someone replies to just you (not both), forward to bring both back into the thread:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Matt from Vipassana.cool <matt@vipassana.cool>",
    "to": ["person_a@example.com", "person_b@example.com"],
    "reply_to": ["person_a@example.com", "person_b@example.com"],
    "subject": "Re: Your Practice Buddy match is here",
    "html": "<p>Hey both - just looping you back together! Please use Reply All so you can stay in touch with each other directly.</p><p>Be happy,<br>Matt</p>"
  }'
```

---

## Admin API Reference

All endpoints require `Authorization: Bearer $ADMIN_SECRET` header.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/waitlist` | All waitlist entries |
| PATCH | `/api/admin/waitlist` | Update `research_notes` for an entry |
| GET | `/api/admin/matches` | All matches with person details |
| POST | `/api/admin/matches` | Create a match (optionally send email) |
| PATCH | `/api/admin/matches/{id}` | Update match status |
| GET | `/api/admin/emails` | All emails (inbound + outbound) |

---

## Quick Start - Full Matching Session

1. Query pending entries (Step 1)
2. Query existing matches (Step 2)
3. Check inbound emails (Step 3)
4. Research any unresearched pending candidates (Step 4)
5. Present match recommendations to user with rationale
6. **Wait for user confirmation** before creating any match
7. For each confirmed pair:
   a. Create match in DB (Step 6) - use `sendEmail: false`
   b. Compose personalized intro email using research notes
   c. Send via Resend with `reply_to` set to both (Step 7) - remember `sleep 2`
   d. Log to `vipassana_emails` (Step 8)
8. Report summary: X matches created, X pending, X inbound replies reviewed
