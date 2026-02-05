# skillhubz

Discover and share Claude Skills — a community marketplace for AI assistant skills, prompts, and workflows.

## Submit Skills (No Authentication Required)

You can submit skills **without logging in or creating an account**:

### Via CLI (Recommended)

```bash
# From your skill directory containing skill.md
npx skillhu publish

# Or specify a path
npx skillhu publish ./my-skill
```

### Via Website

Visit [skillhu.bz/submit](https://skillhu.bz/submit) and fill out the form — no login required.

### Via Git (Direct)

1. Fork this repo
2. Add your skill to `packages/skills/skills/your-skill-name/`
3. Create `skill.md` (required) and `manifest.json` (optional)
4. Submit a PR

## Install Skills

```bash
npx skillhu install gmail-reply
```

## Structure

```
skillhubz/
├── apps/
│   └── web/              # skillhu.bz website (React + Vite)
├── packages/
│   ├── cli/              # skillhu CLI (npm package)
│   └── skills/           # Skill definitions registry
```

## Development

```bash
# Install dependencies
npm install

# Run website locally
npm run dev

# Build website
npm run build
```

## Links

- Website: https://skillhu.bz
- CLI: https://www.npmjs.com/package/skillhu
- GitHub: https://github.com/mediar-ai/skillhubz

## Related Resources

See [claude-skills-resources.md](./claude-skills-resources.md) for a curated list of other skill marketplaces, awesome lists, and resources.

## License

MIT
