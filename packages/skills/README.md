# skillhu.bz Skills Registry

A community-driven collection of Claude Code skills for computer use automation.

## What are Skills?

Skills are markdown files with instructions that tell Claude Code how to automate tasks on your computer. They live in `~/.claude/commands/` and can be invoked with `/skillname`.

## Quick Start

```bash
# Install a skill
npx skillhu install gmail-reply

# Search for skills
npx skillhu search "email automation"

# List installed skills
npx skillhu list
```

## Publishing a Skill

```bash
# Login with GitHub
npx skillhu login

# Create a new skill from template
npx skillhu init my-skill

# Edit your skill, then publish
npx skillhu publish
```

## Skill Structure

```
skills/
└── gmail-reply/
    ├── skill.md        # The skill instructions
    └── manifest.json   # Metadata
```

### skill.md

```markdown
# Gmail Auto-Reply

Reply to unread support emails automatically.

## Instructions

1. Open Chrome and navigate to mail.google.com
2. Wait for inbox to load...
```

### manifest.json

```json
{
  "name": "gmail-reply",
  "description": "Auto-reply to support emails in Gmail",
  "author": "username",
  "version": "1.0.0",
  "tags": ["email", "gmail", "automation"],
  "category": "productivity"
}
```

## Categories

- `browser-automation` - Web browser tasks
- `file-management` - File operations
- `data-entry` - Form filling, data input
- `web-scraping` - Data extraction
- `testing` - QA and testing
- `productivity` - General productivity
- `integrations` - App integrations
- `utilities` - Helper utilities

## Contributing

1. Fork this repo
2. Add your skill in `skills/your-skill-name/`
3. Submit a PR

PRs are auto-merged if they pass validation. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT - Skills are contributed under MIT license unless otherwise specified.
