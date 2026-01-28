# Obsidian Plugin Development

Comprehensive guidelines for Obsidian.md plugin development including ESLint rules, TypeScript best practices, and submission requirements.

## Prerequisites

- TypeScript knowledge
- Familiarity with Obsidian.md
- Node.js environment

## Instructions

### Core Principles

1. **Memory Safety**: Prevent leaks through proper resource management
2. **Type Safety**: Use proper type narrowing, avoid unsafe casts
3. **API Best Practices**: Follow Obsidian's recommended patterns
4. **User Experience**: Maintain UI/UX consistency
5. **Accessibility**: Keyboard and screen reader support (MANDATORY)

### Top 10 Critical Rules

1. **Plugin ID**: No "obsidian", can't end with "plugin"
2. **Use `registerEvent()`** for automatic cleanup
3. **Use `instanceof`** instead of type casting
4. **Sentence case** for all UI text
5. **Use `requestUrl()`** instead of `fetch()`
6. **Use Obsidian CSS variables** for theming
7. **Keyboard accessible** - all interactive elements
8. **No `innerHTML`** - security risk (XSS)
9. **No regex lookbehind** - iOS < 16.4 incompatible
10. **Remove all sample code** - MyPlugin, SampleModal, etc.

### Essential Do's

```typescript
// Use registerEvent for cleanup
this.registerEvent(this.app.vault.on('create', callback));

// Use instanceof for type checking
if (file instanceof TFile) { ... }

// Use Editor API for active file
editor.replaceSelection(text);

// Use Obsidian helpers
containerEl.createDiv({ cls: 'my-class' });
```

### Essential Don'ts

```typescript
// Don't store view references
this.myView = view; // Memory leak!

// Don't use type casting
const file = item as TFile; // Use instanceof

// Don't use fetch
fetch(url); // Use requestUrl()

// Don't use innerHTML
el.innerHTML = html; // XSS risk
```

### Accessibility (MANDATORY)

- All interactive elements must be keyboard accessible
- Provide ARIA labels for icon buttons
- Define focus indicators using `:focus-visible`
- Minimum touch target: 44×44px

## Guidelines

1. Use `registerEvent()`, `addCommand()`, `registerDomEvent()`
2. Use `this.app` not global `app`
3. Use `Vault.process()` for background file modifications
4. Use `normalizePath()` for user paths
5. Test on mobile if not desktop-only

## Notes

- Based on `eslint-plugin-obsidianmd`
- Boilerplate generator available: `/create-plugin`
- Always test with keyboard navigation

Source: gapmiss/obsidian-plugin-skill
