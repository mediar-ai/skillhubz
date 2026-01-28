# Skill Creator

Guide for creating effective skills that extend Claude's capabilities with specialized knowledge, workflows, and tool integrations.

## Prerequisites

- Clear understanding of skill purpose
- Concrete usage examples
- Knowledge of target domain

## Instructions

### Step 1: Understand with Concrete Examples

- What functionality should the skill support?
- How will it be used? (trigger phrases, use cases)
- What would a user say to trigger this skill?

### Step 2: Plan Reusable Contents

Identify what to include:
- **scripts/**: Executable code for deterministic tasks
- **references/**: Documentation loaded as needed
- **assets/**: Templates, images, fonts for output

### Step 3: Initialize the Skill

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

Creates: SKILL.md template, example directories

### Step 4: Edit the Skill

**SKILL.md Structure:**
```yaml
---
name: skill-name
description: What it does AND when to use it
---

# Instructions in Markdown
```

**Key Principles:**
- Concise is key - context window is shared
- Only add context Claude doesn't already have
- Set appropriate degrees of freedom (high/medium/low)

**Progressive Disclosure:**
- Metadata (~100 words) - always in context
- SKILL.md body (<5k words) - when triggered
- Bundled resources - as needed

### Step 5: Package the Skill

```bash
scripts/package_skill.py <path/to/skill-folder>
```

Validates and creates .skill file for distribution.

### Step 6: Iterate

Test on real tasks, identify struggles, improve, repeat.

## Error Handling

- If validation fails, fix errors and re-package
- Don't create extraneous docs (README, CHANGELOG)
- Keep SKILL.md under 500 lines

## Notes

- Skills are "onboarding guides" for specific domains
- Default assumption: Claude is already smart
- Avoid deeply nested references

Source: anthropics/skills
