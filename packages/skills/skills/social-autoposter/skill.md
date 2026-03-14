---
name: social-autoposter
description: "Automate social media posting across Reddit, X/Twitter, LinkedIn, Moltbook, and GitHub Issues. Find threads, post comments, track engagement stats, edit high-performing posts with project links. Use when: 'post to social', 'social autoposter', 'find threads', 'audit social posts', 'update post stats', 'engage replies'."
user_invocable: true
---

# Social Autoposter

Automates finding, posting, and tracking social media comments and original posts across Reddit, X/Twitter, LinkedIn, Moltbook, and GitHub Issues.

## Quick Start

| Command | What it does |
|---------|-------------|
| `/social-autoposter` | Comment run — find threads + post comment + log (cron-safe) |
| `/social-autoposter github` | Find relevant GitHub issues + post helpful comments + log |
| `/social-autoposter post` | Create an original post/thread (manual only, never cron) |
| `/social-autoposter stats` | Update engagement stats via API |
| `/social-autoposter engage` | Scan and reply to responses on our posts |
| `/social-autoposter audit` | Full browser audit of all posts |

---

## Browser Automation: MCP Playwright ONLY

All browser interactions (posting, scraping views, auditing, replying) MUST use **MCP Playwright** (`browser_navigate`, `browser_run_code`, `browser_snapshot`, `browser_click`, etc.).

---

## FIRST: Read config

Before doing anything, read `~/social-autoposter/config.json`. Everything — accounts, projects, subreddits, content angle — comes from there.

```bash
cat ~/social-autoposter/config.json
```

Key fields:
- `accounts.reddit.username` — Reddit handle to post as
- `accounts.twitter.handle` — X/Twitter handle
- `accounts.linkedin.name` — LinkedIn display name
- `accounts.moltbook.username` — Moltbook username
- `subreddits` — list of subreddits to monitor and post in
- `content_angle` — the user's unique perspective for writing authentic comments
- `projects` — products/repos to mention naturally when relevant (each has `name`, `description`, `website`, `github`, `topics`)
- `DATABASE_URL` in `~/social-autoposter/.env` — the live Neon Postgres database used by the helper scripts

---

## Helper Scripts

Standalone Python scripts — no LLM needed.

```bash
python3 ~/social-autoposter/scripts/find_threads.py --include-moltbook
python3 ~/social-autoposter/scripts/scan_replies.py
python3 ~/social-autoposter/scripts/update_stats.py --quiet
```

---

## Workflow: Post (`/social-autoposter`)

### 1. Rate limit check

Skip this step — the find_threads.py script handles rate limiting automatically.

### 2. Find candidate threads

**Option A — Script (preferred):**
```bash
python3 ~/social-autoposter/scripts/find_threads.py --include-moltbook
```

**Option B — Browse manually:**
Browse `/new` and `/hot` on the subreddits from `config.json`. Also check Moltbook via API.

### 3. Pick the best thread

- You have a genuine angle from `content_angle` in config.json
- Not already posted in: `SELECT thread_url FROM posts`
- Last 5 comments don't repeat the same talking points:
  ```sql
  SELECT our_content FROM posts ORDER BY id DESC LIMIT 5
  ```
- If nothing fits naturally, **stop**. Better to skip than force a bad comment.

### 4. Read the thread + top comments

Check tone, length cues, thread age. Find best comment to reply to (high-upvote comments get more visibility).

### 5. Draft the comment

Follow Content Rules below. 2-3 sentences, first person, specific details from `content_angle`. No product links in top-level comments.

### 6. Post it

**Reddit** (browser automation):
- Navigate to `old.reddit.com` thread URL
- Reply box → type comment → submit → wait 2-3s → verify comment appeared → capture permalink → close tab
- Post as the username in `config.json → accounts.reddit.username`

**X/Twitter** (browser automation):
- Navigate to tweet → reply box → type → Reply → verify → capture URL
- Post as the handle in `config.json → accounts.twitter.handle`
- Use platform value `'twitter'` (not `'x'`) when logging to DB

**LinkedIn** (browser automation):
- Navigate to post → comment box → type → Post → close tab
- Post as the name in `config.json → accounts.linkedin.name`

**Moltbook** (API — no browser needed):
```bash
source ~/social-autoposter/.env
curl -s -X POST -H "Authorization: Bearer $MOLTBOOK_API_KEY" -H "Content-Type: application/json" \
  -d '{"title": "...", "content": "...", "type": "text", "submolt_name": "general"}' \
  "https://www.moltbook.com/api/v1/posts"
```
On Moltbook: write as agent ("my human" not "I"). Max 1 post per 30 min.
Verify: fetch post by UUID, check `verification_status` is `"verified"`.

### 7. Log to database

```sql
INSERT INTO posts (platform, thread_url, thread_author, thread_author_handle,
  thread_title, thread_content, our_url, our_content, our_account,
  source_summary, status, posted_at)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', NOW());
```

---

## Workflow: Create Post (`/social-autoposter post`)

**Manual only — never run from cron.**

### 1. Rate limit check

Max 1 original post per 24 hours. Max 3 per week.

### 2. Cross-posting check

```sql
SELECT platform, thread_title, posted_at FROM posts
WHERE source_summary LIKE '%' || %s || '%' AND posted_at >= NOW() - INTERVAL '30 days'
ORDER BY posted_at DESC;
```

**NEVER post the same or similar content to multiple subreddits.**

### 3. Pick one target community

Choose the single best subreddit from `config.json → subreddits` for this topic.

### 4. Draft the post

**Anti-AI-detection checklist** (must pass ALL before posting):

- [ ] No em dashes (—). Use regular dashes (-) or commas instead
- [ ] No markdown headers (##) or bold (**) in Reddit posts
- [ ] No numbered/bulleted lists — write in paragraphs
- [ ] No "Hi everyone" or "Hey r/subreddit" openings
- [ ] Title doesn't use clickbait patterns
- [ ] Contains at least one imperfection: incomplete thought, casual aside, informality
- [ ] Reads like a real person writing on their phone, not an essay
- [ ] Does NOT link to any project in the post body
- [ ] Not too long — 2-4 short paragraphs max for Reddit

### 5. Post it

**Reddit**: old.reddit.com → Submit new text post → paste title + body → submit → verify → capture permalink.

### 6. Log it

```sql
INSERT INTO posts (platform, thread_url, thread_author, thread_author_handle,
  thread_title, thread_content, our_url, our_content, our_account,
  source_summary, status, posted_at)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', NOW());
```

### 7. Mandatory engagement plan

After posting: reply to every substantive comment within 24 hours. Casual, conversational, not polished paragraphs.

---

## Workflow: GitHub Issues (`/social-autoposter github`)

### 1. Rate limit check

```sql
SELECT COUNT(*) FROM posts WHERE platform='github_issues' AND posted_at >= NOW() - INTERVAL '24 hours'
```
Max 6 GitHub issue comments per 24 hours. Stop if at limit.

### 2. Search for relevant issues

```bash
gh search issues "TOPIC" --limit 10 --state open --sort updated
```

Run 3-5 searches with different topic keywords from `content_angle` and `accounts.github.search_topics`.

### 3. Read the issue

```bash
gh api repos/OWNER/REPO/issues/NUMBER --jq '.title,.body'
gh api repos/OWNER/REPO/issues/NUMBER/comments --jq '.[].body' | head -200
```

### 4. Draft + post the comment

3-6 sentences. Genuine technical help. First person, casual. No project links in the main comment.

```bash
gh issue comment NUMBER -R OWNER/REPO --body "YOUR COMMENT"
```

### 5. Log it

```sql
INSERT INTO posts (platform, thread_url, thread_author, thread_title, our_url,
  our_content, our_account, source_summary, status, posted_at)
VALUES ('github_issues', %s, %s, %s, %s, %s, %s, %s, 'active', NOW());
```

### 6. Pick next issue

Repeat for up to 3 issues per run.

---

## Workflow: Stats (`/social-autoposter stats`)

### Step 1: API stats

```bash
python3 ~/social-autoposter/scripts/update_stats.py
```

Updates upvotes, comments_count, thread_engagement, detects deleted/removed for Reddit + Moltbook.

### Step 2: Reddit view counts (browser required)

Use MCP Playwright to scrape the Reddit user profile page with virtualized scroll collection.
Navigate to `https://www.reddit.com/user/{username}/`, scroll to collect all view counts, save to `/tmp/reddit_views.json`, then run:
```bash
python3 ~/social-autoposter/scripts/scrape_reddit_views.py --from-json /tmp/reddit_views.json
```

### Step 3: X/Twitter stats (browser required)

Scrape individual tweet pages. Use 8-second delays between pages. Target tweets by status ID to avoid reading parent thread stats instead of our reply's stats.

---

## Workflow: Engage (`/social-autoposter engage`)

### Phase A: Scan for replies (no browser)
```bash
python3 ~/social-autoposter/scripts/scan_replies.py
```

### Phase B: Respond to pending replies

```sql
SELECT r.id, r.platform, r.their_author, r.their_content, r.their_comment_url,
       r.depth, p.thread_title, p.our_content
FROM replies r JOIN posts p ON r.post_id = p.id
WHERE r.status='pending' ORDER BY r.discovered_at ASC LIMIT 10
```

Draft replies: 2-4 sentences, casual, expand the topic. Apply Tiered Reply Strategy. Max 5 replies per run.

Post via browser (Reddit/X), API (Moltbook), or `gh issue comment` (GitHub Issues). Update:
```sql
UPDATE replies SET status='replied', our_reply_content=%s, our_reply_url=%s,
  replied_at=NOW() WHERE id=%s
```

### Phase C: X/Twitter replies (browser required)

Navigate to `https://x.com/notifications/mentions`. Find replies to the handle in config.json. Respond to substantive ones (max 5). Log to `replies` table.

### Phase D: Edit high-performing posts with project link

Find posts that earned >2 upvotes but haven't had a link appended yet:

```sql
SELECT id, platform, our_url, our_content, thread_title, source_summary
FROM posts
WHERE status='active'
  AND upvotes > 2
  AND posted_at < NOW() - INTERVAL '6 hours'
  AND link_edited_at IS NULL
  AND our_url IS NOT NULL
ORDER BY upvotes DESC
```

For each post:
1. Pick the project from `config.json → projects[]` whose `topics` best match the thread. If no project fits, skip.
2. Write 1 sentence + link:
   - "fwiw I built something for this - [project.website]"
   - "we open sourced the thing I mentioned if anyone wants to poke around [project.github]"
   - "here's the repo if useful [project.github]"
3. Edit the original comment to append `\n\n[link text]` at the bottom.

**Platform-specific editing:**

**Reddit** (browser):
- Navigate to `old.reddit.com` comment permalink
- Click "edit" under the comment
- Append `\n\n[link text]` to existing content
- Save, verify edit appeared

**Moltbook** (API):
```bash
source ~/social-autoposter/.env
curl -s -X PATCH -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "[original content]\n\n[link text]"}' \
  "https://www.moltbook.com/api/v1/posts/[uuid]"
```

**X/Twitter:** Skip — editing not supported.
**LinkedIn:** Skip — unreliable via automation.

4. Update DB after successful edit:
```sql
UPDATE posts SET link_edited_at=NOW(), link_edit_content=%s WHERE id=%s
```

Max 5 edits per engage run.

---

## Workflow: Audit (`/social-autoposter audit`)

### Step 1: API audit
```bash
python3 ~/social-autoposter/scripts/update_stats.py
```

### Step 2: X/Twitter audit (browser)
Navigate to each tweet URL (8s delays, batches of 20). Mark deleted/removed. Extract views/likes/replies.

### Step 3: Mark deleted/removed
```sql
UPDATE posts SET status='deleted', status_checked_at=NOW() WHERE id=%s
UPDATE posts SET status='removed', status_checked_at=NOW() WHERE id=%s
```

### Step 4: Report summary
Print totals: posts checked, updated, deleted, removed, errors per platform.

---

## Content Rules

1. **Write like you're texting a coworker.** Lowercase fine. Sentence fragments fine.
2. **First person, specific.** Concrete details from `content_angle`. Real numbers, real experiences.
3. **Reply to top comments, not just OP.**
4. **Only comment when there's a genuine angle from the user's work.**
5. **No product links in top-level comments or original posts.**
6. **On Moltbook, write as an agent.** "my human" not "I".
7. **Log everything.**
8. **No em dashes (—).** Use commas, periods, or regular dashes (-) instead.
9. **No markdown formatting in Reddit.** No headers, no bold, no numbered lists.
10. **Never cross-post.** One post per topic per community.
11. **Space posts out.** Max 1 original post per day, max 3 per week.
12. **Include imperfections.** Contractions, sentence fragments, casual asides.
13. **Reply to comments on your posts within 24h.**

---

## Tiered Reply Strategy

**Tier 1 — Default (no link):** Genuine engagement. Expand topic, ask follow-ups. Most replies.

**Tier 2 — Natural mention:** Conversation touches a topic matching `config.json → projects[].topics`. Mention casually, link only if it adds value.

**Tier 3 — Direct ask:** They ask for link/try/source. Give it immediately.

---

## Critical: No Parallel Posting

**NEVER launch multiple agents or parallel tasks for posting.** All posting operations MUST be done sequentially in a single agent. Parallel agents cause duplicate posts and browser lock conflicts.

---

## Database Schema

`posts`: id, platform, thread_url, thread_title, our_url, our_content, our_account, posted_at, status, upvotes, comments_count, views, source_summary, link_edited_at, link_edit_content

Platform values: `reddit`, `twitter`, `linkedin`, `moltbook`, `hackernews`, `github_issues`

**Important:** Always use `'twitter'` (not `'x'`) for X/Twitter posts.

`replies`: id, post_id, platform, their_author, their_content, our_reply_content, status (pending|replied|skipped|error), depth

---

## Platform Reference

**Reddit:** Use `old.reddit.com`. No posting API — browser only.

**X/Twitter:** Browser only. No public API for notifications. Editing not supported.

**LinkedIn:** Browser only. Professional tone. No stable comment URLs.

**Moltbook:** Full REST API. Base: `https://www.moltbook.com/api/v1`. Auth: `Bearer $MOLTBOOK_API_KEY`. Write as agent.

**GitHub Issues:** Use `gh` CLI. No browser needed.
