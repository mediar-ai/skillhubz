---
name: influencer-hiring
description: Use when the user mentions "influencer candidates", "social media operator", "check proposals on Upwork/Fiverr", "review influencer applications", "qualify candidates", or "reach out to operators". Manages the IG/TikTok account operator hiring pipeline — review applicants, check replies, qualify, and do proactive outreach.
allowed-tools: Bash, Read, mcp__playwright__browser_navigate, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_snapshot, mcp__playwright__browser_run_code_unsafe
---

# Influencer / Social Media Operator Hiring Skill

Manages the end-to-end pipeline for hiring social media account operators (IG + TikTok at $500/month per account). Candidates are tracked in a PostgreSQL table and sourced from Upwork and Fiverr.

---

## Database

Store candidates in a `influencer_candidates` table (Postgres/Neon). Get connection string from your keychain or env.

### Table schema

```sql
CREATE TABLE IF NOT EXISTS influencer_candidates (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50),          -- 'upwork' | 'fiverr'
  name VARCHAR(255),
  username VARCHAR(255),
  profile_url TEXT,
  location VARCHAR(100),
  rating DECIMAL(3,2),
  review_count INTEGER,
  level VARCHAR(50),
  bid_amount DECIMAL(10,2),
  skills TEXT[],
  cover_letter TEXT,
  status VARCHAR(50) DEFAULT 'applied',
  qualifying_questions_sent_at TIMESTAMPTZ,
  reply_received_at TIMESTAMPTZ,
  reply_text TEXT,
  notes TEXT,
  job_posting VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status lifecycle**: `applied -> messaged -> replied -> qualified -> hired | rejected`

---

## Upwork Workflows

### Key URLs

| Page | URL |
|------|-----|
| Review proposals | `/ab/applicants/{JOB_ID}/applicants` |
| Invite freelancers | `/ab/applicants/{JOB_ID}/suggested` |
| Invited / pending | `/ab/applicants/{JOB_ID}/pending` |
| Messages | `/ab/messages/rooms/` |
| Talent search | `/nx/search/talent/?q=social+media+manager+instagram+tiktok&sort=recency` |

### Review proposals

1. Navigate to the applicants page
2. Snapshot the table to see all proposals
3. For each new applicant: open profile, check cover letter, JSS, rate, location
4. Score: EU/NA location, JSS >90%, relevant tools, rate fits budget
5. If promising: send qualifying questions, update DB status to `messaged`

### Proactive outreach (invite non-applicants)

1. Search talent, filter by location in URL params
2. Extract `[data-test="FreelancerTile"]` elements via `browser_run_code_unsafe`
3. Filter results by EU/NA location
4. For each candidate, use this JS pattern to open invite modal and send:

```js
// Open invite modal (button has 0 bounding box when collapsed, use evaluate)
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === 'Invite');
  btn?.click();
});
await page.waitForTimeout(2000);

// Fill message using React native setter
await page.evaluate((msg) => {
  const ta = document.querySelector('.air3-fullscreen-container textarea');
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  ).set;
  setter.call(ta, msg);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}, messageText);

// Send
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('.air3-fullscreen-container button'))
    .find(b => b.textContent.trim() === 'Send Invitation');
  btn?.click();
});
```

### Check replies

1. Navigate to `/ab/messages/rooms/`
2. Find conversations with known candidates
3. Extract reply text, update DB: `status='replied', reply_received_at=NOW(), reply_text='...'`

---

## Fiverr Workflows

- Access the brief management page at `/briefs/manage/{BRIEF_ID}/offers`
- **Bot detection**: Fiverr uses Cloudflare "PRESS & HOLD" challenge. Use the real Chrome playwright-extension agent. If challenge appears, user must manually clear it first.
- Candidates appear under "Offers" in the brief view
- To message: open the offer, use the chat input at the bottom

---

## Qualifying Questions Template

Send to every candidate at initial contact:

```
1. Do you currently manage any IG or TikTok accounts? If yes, can you share examples (handles or a brief description)?
2. Are you available to manage accounts 7 days a week, including weekends?
3. What tools do you use to schedule and post content (e.g. Buffer, Later, Meta Business Suite)?
4. How many accounts could you comfortably handle at once?
5. What is your experience engaging a North American or European audience specifically?
```

---

## Evaluating Replies

**Green flags**: has active managed accounts with examples, available 7 days, uses professional scheduling tools, can handle 3+ accounts, has EU/NA audience experience

**Yellow flags**: no examples but claims experience, limited tool knowledge, only available weekdays

**Red flags**: no managed accounts, unavailable weekends, unfamiliar with target audience

If qualified: negotiate rate (target $500/account/month, ask for minimum account commitment).

---

## Add Candidate to DB (Python snippet)

```python
import psycopg2
from datetime import datetime, timezone

conn_str = "YOUR_NEON_CONNECTION_STRING"
now = datetime.now(timezone.utc)

with psycopg2.connect(conn_str) as conn:
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO influencer_candidates
              (platform, name, profile_url, location, level, bid_amount, skills,
               status, qualifying_questions_sent_at, notes, job_posting, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            'upwork', 'Name Here', 'https://upwork.com/freelancers/~xxx',
            'United Kingdom', 'Top Rated', 20.0,
            ['Instagram', 'TikTok', 'Social Media Management'],
            'messaged', now, 'notes here',
            'Social Media Account Operator', now, now
        ))
    conn.commit()
```
