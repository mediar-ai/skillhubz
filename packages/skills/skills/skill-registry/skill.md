---
name: skill-registry
description: "Scan, inventory, and track all Claude Code skills — local, global, project-level, and published. Shows publish status on skillhu.bz and skills.sh, install counts, and authorship. Use when: 'list skills', 'skill registry', 'skill inventory', 'what skills do I have', 'which skills are published', 'skill stats'."
---

# Skill Registry

Scan all skill locations, cross-reference with online registries (skillhu.bz, skills.sh/GitHub), and output a unified inventory. Persists state to `~/.claude/skill-registry.json` for fast lookups.

## Workflow

### Step 1: Scan local skills

Scan all three skill locations and extract YAML frontmatter from each SKILL.md:

```bash
# Scan ~/.claude/skills/ (private global skills — authored by user)
for d in ~/.claude/skills/*/; do
  name=$(basename "$d")
  if [ -f "$d/SKILL.md" ]; then
    desc=$(awk '/^---/{n++; next} n==1 && /^description:/{gsub(/^description: *"?|"$/,"",$0); print; exit}' "$d/SKILL.md")
    echo "claude|$name|$desc"
  fi
done

# Scan ~/.agents/skills/ (skills.sh installed skills — may be authored by others)
for d in ~/.agents/skills/*/; do
  name=$(basename "$d")
  if [ -f "$d/SKILL.md" ]; then
    desc=$(awk '/^---/{n++; next} n==1 && /^description:/{gsub(/^description: *"?|"$/,"",$0); print; exit}' "$d/SKILL.md")
    echo "agents|$name|$desc"
  fi
done
```

For the current project, also check `.claude/skills/` in the working directory.

### Step 2: Determine authorship

Skills are **authored by user** if they exist in `~/.claude/skills/` (these are hand-created, not installed from a registry).

Skills in `~/.agents/skills/` may be:
- **Authored by user** — if also present in `~/.claude/skills/` or published under your GitHub username
- **Installed from others** — if they have a `license` field in frontmatter or are NOT in `~/.claude/skills/`

To check, compare the two directories:
```bash
# Skills ONLY in ~/.claude/skills (user-authored, not from skills.sh)
comm -23 <(ls ~/.claude/skills/ | sort) <(ls ~/.agents/skills/ | sort)

# Skills in BOTH (user-authored + also installed via skills.sh)
comm -12 <(ls ~/.claude/skills/ | sort) <(ls ~/.agents/skills/ | sort)

# Skills ONLY in ~/.agents/skills (installed from others)
comm -13 <(ls ~/.claude/skills/ | sort) <(ls ~/.agents/skills/ | sort)
```

### Step 3: Check publish status on skillhu.bz

Query the skillhu.bz registry for skills authored by your GitHub username:

```bash
# Fetch the full registry and filter for your skills
# Replace <your-github-username> with your actual GitHub username
curl -s 'https://skillhu.bz/api/skills' | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    skills = data if isinstance(data, list) else data.get('skills', [])
    for s in skills:
        if s.get('author') == '<your-github-username>':
            print(json.dumps({
                'name': s.get('name'),
                'installs': s.get('installs', 0),
                'stars': s.get('stars', 0),
                'category': s.get('category', ''),
                'updated': s.get('updatedAt', '')
            }))
except: pass
"
```

If the API doesn't have a list endpoint, fall back to checking individual skills:
```bash
# Check specific skill
curl -s "https://skillhu.bz/api/skills/SKILL_NAME" | python3 -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d))" 2>/dev/null
```

### Step 4: Check publish status on skills.sh (GitHub)

Check which skills have GitHub repos under your username:

```bash
# Replace <your-github-username> with your actual GitHub username
gh repo list <your-github-username> --json name,description --limit 200 | python3 -c "
import json, sys
repos = json.load(sys.stdin)
for r in repos:
    name = r.get('name', '')
    desc = r.get('description', '') or ''
    # Check if repo has a SKILL.md (indicates it's a published skill)
    print(f\"{name}|{desc}\")
"
```

For each potential skill repo, verify it has a SKILL.md:
```bash
gh api repos/<your-github-username>/REPO_NAME/contents/SKILL.md --jq '.name' 2>/dev/null && echo "has-skill-md"
```

### Step 5: Check engagement stats

For skillhu.bz published skills:
```bash
curl -s 'https://skillhu.bz/api/track' | python3 -c "
import json, sys
data = json.load(sys.stdin)
installs = data.get('installs', {})
stars = data.get('stars', {})
for name in set(list(installs.keys()) + list(stars.keys())):
    print(f\"{name}|installs:{installs.get(name,0)}|stars:{stars.get(name,0)}\")
"
```

### Step 6: Build and save the registry

Combine all data into `~/.claude/skill-registry.json`:

```python
import json, os, subprocess, glob
from datetime import datetime

registry = {
    "last_updated": datetime.now().isoformat(),
    "skills": []
}

# ... combine scan results into entries like:
entry = {
    "name": "skill-name",
    "locations": ["~/.claude/skills", "~/.agents/skills"],  # where it exists
    "authored_by_user": True,  # or False
    "description": "...",
    "published": {
        "skillhubz": {"url": "https://skillhu.bz/skill/NAME", "installs": 0, "stars": 0},
        "skills_sh": {"repo": "<your-github-username>/NAME", "url": "https://github.com/<your-github-username>/NAME"}
    },
    # or "published": {} if not published anywhere
}
```

### Step 7: Display the registry

Output a formatted table:

```
SKILL REGISTRY (last updated: 2026-03-03T...)

YOUR SKILLS (authored by you):
  Name                    | Location       | Published          | Installs
  auth                    | ~/.claude      | -                  | -
  gmail                   | ~/.claude      | -                  | -
  whatsapp-web-decrypt    | both           | skillhu + skills.sh| 0
  browser-lock            | ~/.claude      | skillhu            | 1
  social-autoposter       | ~/.claude      | -                  | -
  ...

INSTALLED SKILLS (from others):
  Name                    | Location       | Source
  frontend-design         | both           | skills.sh
  copywriting             | both           | skills.sh
  ...

PROJECT SKILLS (current project):
  Name                    | Location
  browser-analysis        | .claude/skills
  whatsapp-analysis       | .claude/skills
  ...

PUBLISHED BUT NOT LOCAL:
  Name                    | Platform       | Installs
  tmux-background-agents  | skillhu        | 0

SUMMARY:
  Total skills: XX | Your skills: XX | Published: XX | Installed from others: XX
```

### Step 8: Refresh vs cached

- **First run or `--refresh`**: Execute Steps 1-6, save to `~/.claude/skill-registry.json`
- **Subsequent runs**: Read from JSON file and display. Add `--refresh` to re-scan.
- **After publishing**: The `publish-skill` skill should trigger a refresh.

## Quick Commands

- `skill registry` or `list skills` — show the full registry (cached or fresh)
- `skill registry --refresh` — force re-scan all locations and online registries
- `skill registry --published` — show only published skills with stats
- `skill registry --unpublished` — show skills not yet published anywhere
- `skill registry --mine` — show only user-authored skills

## Notes

- Skills in `~/.claude/skills/` are user-authored (private, not installed from registries)
- Skills in `~/.agents/skills/` are installed via `npx skills add` (skills.sh)
- Project skills in `.claude/skills/` are repo-specific
- Replace `<your-github-username>` with your actual GitHub username throughout
- The registry JSON is at `~/.claude/skill-registry.json`
