# Contributing to skillhu.bz

Thank you for contributing! This guide will help you submit your skill.

## Quick Start (CLI)

The easiest way to contribute is using the CLI:

```bash
# Login with GitHub
npx skillhu login

# Create a new skill
npx skillhu init my-awesome-skill

# Edit the generated files in my-awesome-skill/
# - skill.md: The actual instructions
# - manifest.json: Metadata

# Publish
npx skillhu publish
```

## Manual Contribution

1. **Fork** this repository

2. **Create** your skill folder:
   ```
   skills/
   └── your-skill-name/
       ├── skill.md
       └── manifest.json
   ```

3. **Write** your skill.md with clear instructions

4. **Create** manifest.json:
   ```json
   {
     "name": "your-skill-name",
     "description": "What your skill does",
     "author": "your-github-username",
     "version": "1.0.0",
     "tags": ["tag1", "tag2"],
     "category": "productivity"
   }
   ```

5. **Submit** a pull request

## Skill Guidelines

### skill.md Structure

```markdown
# Title

Brief description.

## Prerequisites

- Required apps/services
- Login states needed

## Instructions

1. Step-by-step instructions
2. Be specific about UI elements
3. Include success confirmations

## Error Handling

- How to handle common errors

## Notes

- Additional context
```

### Good Skills

- ✅ Clear, numbered steps
- ✅ Specific UI element names
- ✅ Error handling instructions
- ✅ Success confirmations at each step
- ✅ Reasonable scope (single task)

### Avoid

- ❌ Vague instructions ("click the button")
- ❌ Missing prerequisites
- ❌ No error handling
- ❌ Too broad scope
- ❌ Hardcoded personal data

## Categories

Choose one:

| Category | Use for |
|----------|---------|
| `browser-automation` | Web browser tasks |
| `file-management` | File operations |
| `data-entry` | Form filling |
| `web-scraping` | Data extraction |
| `testing` | QA and testing |
| `productivity` | General productivity |
| `integrations` | App integrations |
| `utilities` | Helper utilities |

## Validation

PRs are automatically validated for:

- [ ] Valid folder structure
- [ ] skill.md exists and has title
- [ ] manifest.json is valid JSON
- [ ] Required fields present
- [ ] Folder name matches manifest name
- [ ] File size < 50KB
- [ ] No duplicate names

Valid PRs are **auto-merged**. Invalid PRs will show errors in the checks.

## Updating a Skill

To update an existing skill you authored:

1. Make your changes
2. Bump the version in manifest.json
3. Submit a PR

## Questions?

- Open an issue for help
- Join our Discord (link in README)
- Check existing skills for examples
