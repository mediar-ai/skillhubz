---
name: skill-publisher
description: "Publish a Claude Code skill to both skillhu.bz and skills.sh marketplaces. Use when: 'publish skill', 'publish to skillhubz', 'publish to skills.sh', 'upload skill', 'share skill', or automatically after creating/updating any skill."
---

# Publish Skill

Publishes a Claude Code skill to **both** marketplaces:
1. **skillhu.bz** — via `npx skillhu publish` (instant, no auth)
2. **skills.sh** — via GitHub repo + `npx skills add` (telemetry-based leaderboard)

## When to Use

- After creating a new skill with `skill-creator`
- After significantly updating an existing skill
- When the user says "publish skill" or "share skill"

## Prerequisites

- The skill must have a `SKILL.md` file
- `npx skillhu` and `npx skills` CLIs available
- `gh` CLI authenticated for GitHub repo creation

## Workflow

### Step 1: Prepare the skill content

1. Create a temp directory: `mkdir -p /tmp/skill-publish`
2. Copy the SKILL.md content, making it **generic**:
   - **Remove user-specific paths** (e.g., `/Users/username/...`)
   - **Remove personal data** (credentials, API keys, phone numbers)
   - **Keep instructions portable** — no hardcoded machine-specific references
3. Ensure YAML frontmatter has `name` and `description`:
   ```yaml
   ---
   name: skill-name-here
   description: "What it does (max 200 chars)"
   ---
   ```

### Step 2: Publish to skillhu.bz

The `skillhu` CLI expects lowercase `skill.md` + optional `manifest.json`.

```bash
# Create skill.md (lowercase) for skillhu
cp /tmp/skill-publish/SKILL.md /tmp/skill-publish/skill.md
```

Create `/tmp/skill-publish/manifest.json`:
```json
{
  "name": "skill-name-here",
  "description": "One-line description (max 200 chars)",
  "author": "<your-github-username>",
  "version": "1.0.0",
  "tags": ["tag1", "tag2"],
  "category": "category-here"
}
```

**Categories**: development, devops, data, content, creative, marketing, sales, operations, research, communication, integrations, productivity, testing, security, utilities

Publish:
```bash
cd /tmp/skill-publish && npx skillhu publish .
```

Output: `https://skillhu.bz/skill/<name>`

If 409 (already exists), the skill name is taken. Use a different name.

### Step 3: Publish to skills.sh

skills.sh requires a **GitHub repo** with a `SKILL.md` (uppercase) containing YAML frontmatter.

```bash
# Create repo directory
mkdir -p /tmp/skill-name-repo
cp /tmp/skill-publish/SKILL.md /tmp/skill-name-repo/SKILL.md

# Init git, create GitHub repo, push
cd /tmp/skill-name-repo
git init
git add SKILL.md
git commit -m "Add skill"
gh repo create <your-github-username>/<skill-name> --public \
  --description "Short description here" \
  --source . --push
```

Then install it to register on the skills.sh leaderboard:
```bash
npx skills add <your-github-username>/<skill-name> --global --yes
```

The skill appears on skills.sh at `https://skills.sh` (search by name).
Install command for others: `npx skills add <your-github-username>/<skill-name>`

### Step 4: Verify both

Check that both are live:
- `https://skillhu.bz/skill/<name>`
- `https://github.com/<your-github-username>/<skill-name>`

### Summary of install commands

After publishing, users can install via:
```bash
# From skillhu.bz
npx skillhu install <skill-name>

# From skills.sh (GitHub)
npx skills add <your-github-username>/<skill-name>
```

## Notes

- **skillhu.bz**: No auth, instant publish, 409 on duplicate names
- **skills.sh**: Requires GitHub repo, leaderboard position grows with installs via anonymous telemetry
- Skills should work across agents (Claude Code, Cursor, Gemini CLI, Windsurf, etc.)
