# skillhu

CLI for [skillhu.bz](https://skillhu.bz) - Install, search, and publish Claude Code skills.

## Installation

```bash
# Use directly with npx
npx skillhu <command>

# Or install globally
npm install -g skillhu
```

## Commands

### Install a skill

```bash
npx skillhu install gmail-reply
```

Downloads the skill to `~/.claude/commands/` where Claude Code can use it.

Options:
- `-l, --local` - Install to local `.claude/commands/` instead
- `-f, --force` - Overwrite existing skill

### Search for skills

```bash
npx skillhu search "email automation"
npx skillhu search notion --category productivity
```

### List installed skills

```bash
npx skillhu list
```

### Remove a skill

```bash
npx skillhu remove gmail-reply
```

### Create a new skill

```bash
npx skillhu init my-awesome-skill
```

Creates a new skill from template with `skill.md` and `manifest.json`.

### Publish a skill

```bash
# Login first
npx skillhu login

# Then publish
npx skillhu publish
```

This creates a PR to [mediar-ai/skills](https://github.com/mediar-ai/skills). Valid PRs are auto-merged.

### Browse skills

```bash
npx skillhu browse
```

Opens skillhu.bz in your browser.

## Skill Structure

```
my-skill/
├── skill.md        # Instructions for Claude
└── manifest.json   # Metadata
```

### skill.md

```markdown
# My Skill

Description of what this skill does.

## Instructions

1. Step one...
2. Step two...
```

### manifest.json

```json
{
  "name": "my-skill",
  "description": "What it does",
  "author": "your-github-username",
  "version": "1.0.0",
  "tags": ["tag1", "tag2"],
  "category": "productivity"
}
```

## Links

- Website: [skillhu.bz](https://skillhu.bz)
- Skills Registry: [github.com/mediar-ai/skills](https://github.com/mediar-ai/skills)
- Report Issues: [github.com/mediar-ai/skillhu/issues](https://github.com/mediar-ai/skillhu/issues)

## License

MIT
