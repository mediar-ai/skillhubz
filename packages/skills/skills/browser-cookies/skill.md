---
name: browser-cookies
description: Export, save, and import cookies for isolated browser MCP agents. Use after new logins in isolated browsers to persist sessions across restarts, or to seed isolated browsers from the real Chrome session.
allowed-tools: Bash, Read, Write, Edit, mcp__isolated-browser__browser_run_code, mcp__playwright-extension__browser_run_code
---

# Browser Cookies

Manage cookie persistence for isolated browser MCP agents. Isolated browsers load cookies from `~/.claude/browser-sessions.json` at startup but do not save changes back automatically. This skill handles the export/import cycle.

## Storage

- **Cookie file:** `~/.claude/browser-sessions.json`
- **Format:** Playwright `storageState` JSON (`{ "cookies": [...], "origins": [...] }`)
- **Consumers:** All isolated browser agents (isolated-browser, reddit-agent, twitter-agent, linkedin-agent) load from this file via `storageState` in their config

## Workflow 1: Save cookies FROM an isolated browser

Use this after logging into a new service in the isolated browser. This exports the current session cookies and merges them back into the shared cookie file.

### Step 1: Export cookies from the isolated browser

```javascript
// Call via mcp__isolated-browser__browser_run_code
async (page) => {
  const cookies = await page.context().cookies();
  return JSON.stringify(cookies);
}
```

The result is a large JSON string. Save it to a temp file if it exceeds inline limits.

### Step 2: Merge into browser-sessions.json

Parse the exported cookies and merge them into the existing file. When merging, cookies from the export take precedence (matched by domain + name + path).

```python
import json

# Load exported cookies (from temp file or inline)
with open('/tmp/exported-cookies.json') as f:
    new_cookies = json.load(f)

# Load existing storage state
with open('~/.claude/browser-sessions.json') as f:
    state = json.load(f)

# Build lookup of existing cookies
existing = {}
for c in state.get('cookies', []):
    key = (c['domain'], c['name'], c.get('path', '/'))
    existing[key] = c

# Merge: new cookies overwrite existing, add any new ones
for c in new_cookies:
    key = (c['domain'], c['name'], c.get('path', '/'))
    existing[key] = c

state['cookies'] = list(existing.values())

with open('~/.claude/browser-sessions.json', 'w') as f:
    json.dump(state, f, indent=2)
```

### Step 3: Restart the isolated browser

Close and reopen the isolated browser to load the updated cookies:
1. `mcp__isolated-browser__browser_close`
2. `mcp__isolated-browser__browser_navigate` to the target URL

## Workflow 2: Seed cookies FROM the real Chrome browser

Use this to refresh all cookies from the user's real Chrome session (via playwright-extension). This replaces all cookies in the file.

### Step 1: Export from playwright-extension

```javascript
// Call via mcp__playwright-extension__browser_run_code
async (page) => {
  const cookies = await page.context().cookies();
  return JSON.stringify(cookies);
}
```

### Step 2: Replace cookies in browser-sessions.json

```python
import json

# Parse the exported cookies from the MCP result
# (handle the escaped JSON string from ### Result section)
new_cookies = ...  # parsed cookie array

with open('~/.claude/browser-sessions.json') as f:
    state = json.load(f)

state['cookies'] = new_cookies

with open('~/.claude/browser-sessions.json', 'w') as f:
    json.dump(state, f, indent=2)
```

### Step 3: Restart isolated browsers to pick up new cookies

## Workflow 3: Save cookies after EVERY isolated browser session

**IMPORTANT:** When you finish a browser task that involved any login, form submission, or authentication in the isolated browser, always run Workflow 1 before closing/leaving. This ensures the next isolated browser session has the updated cookies.

## Notes

- Cookies are loaded once at context creation. Changes during a session are only in memory until explicitly saved.
- All isolated browser agents share the same `browser-sessions.json`. Saving from one agent updates cookies for all of them.
- Some httpOnly session-bound cookies may not transfer (e.g., GitHub `user_session`). These require re-login per session.
- Google session cookies (SID, HSID, SSID, APISID, SAPISID, etc.) DO transfer and persist well.
