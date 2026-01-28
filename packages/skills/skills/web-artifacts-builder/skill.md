# Web Artifacts Builder

Suite of tools for creating elaborate, multi-component HTML artifacts using modern frontend technologies (React, Tailwind CSS, shadcn/ui).

## Prerequisites

- Node.js 18+
- npm
- Understanding of React and TypeScript

## Instructions

### Stack

React 18 + TypeScript + Vite + Parcel (bundling) + Tailwind CSS + shadcn/ui

### Step 1: Initialize Project

```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

Creates:
- React + TypeScript (via Vite)
- Tailwind CSS 3.4.1 with shadcn/ui theming
- Path aliases (`@/`) configured
- 40+ shadcn/ui components pre-installed
- Parcel configured for bundling

### Step 2: Develop Your Artifact

Edit the generated files to build your artifact.

### Step 3: Bundle to Single HTML

```bash
bash scripts/bundle-artifact.sh
```

Creates `bundle.html` - self-contained with all JS, CSS, dependencies inlined.

### Step 4: Share Artifact

Share the bundled HTML file as an artifact.

### Step 5: Testing (Optional)

Use Playwright/Puppeteer to test if needed.

### Design Guidelines

**AVOID "AI slop":**
- Excessive centered layouts
- Purple gradients
- Uniform rounded corners
- Inter font

**DO:**
- Unique, intentional design choices
- Appropriate use of shadcn/ui components
- Proper spacing and hierarchy

## Error Handling

- Ensure index.html exists in root for bundling
- If build fails, check for TypeScript errors
- Test bundle.html locally before sharing

## Notes

- For complex artifacts requiring state management or routing
- Not for simple single-file HTML/JSX artifacts
- shadcn/ui components: https://ui.shadcn.com/docs/components

Source: anthropics/skills
