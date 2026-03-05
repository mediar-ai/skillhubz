---
name: playwright-mcp-setup
description: Set up Playwright MCP with the Chrome extension for browser automation in Claude Code. Use when setting up Playwright MCP, troubleshooting browser connection, or configuring file upload permissions.
allowed-tools: Bash, Read, Write, Edit, mcp__macos-use__*, mcp__playwright-extension__*
---

# Playwright MCP Setup — Full Guide

Complete setup guide for Playwright MCP with the Chrome extension in Claude Code. This enables Claude to control your existing Chrome browser (with your logged-in sessions) instead of launching a new headless browser.

## Why Extension Mode?

By default, Playwright MCP launches a fresh Chromium browser with no sessions. With extension mode, it connects to your real Chrome — keeping all logins, cookies, extensions, and profiles. This is essential for automating social media, authenticated dashboards, and any site where you're already logged in.

## Prerequisites

- **Google Chrome** installed at `/Applications/Google Chrome.app`
- **Claude Code** installed and working

## Step 1: Install the Playwright MCP Bridge Extension

1. Open Chrome and navigate to the Chrome Web Store
2. Search for **"Playwright MCP Bridge"** or go directly to the extension page
3. Click **"Add to Chrome"** to install
4. The extension ID is: `mmlmfjhmonkocbjadbfplnigmagldckm`

**Verify installation:** Check Chrome shows the extension icon in the toolbar, or navigate to `chrome://extensions` and confirm "Playwright MCP Bridge" is listed and enabled.

## Step 2: Get the Extension Token

1. Click the Playwright MCP Bridge extension icon in Chrome's toolbar, or navigate to:
   ```
   chrome-extension://mmlmfjhmonkocbjadbfplnigmagldckm/status.html
   ```
2. The page shows your token in the format:
   ```
   PLAYWRIGHT_MCP_EXTENSION_TOKEN=<your-token-here>
   ```
3. Copy the token value (the part after `=`)

**How the token works:** On first load, the extension generates a random 32-byte base64url token and stores it in localStorage. This token authenticates the MCP server connection to prevent unauthorized access to your browser.

## Step 3: Configure Claude Code

### Option A: Official Playwright Plugin (Recommended)

If you installed the official Playwright plugin via `/install-plugin playwright`, Claude Code automatically detects the extension and runs with `--extension` flag. The plugin config lives at:
```
~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/playwright/.mcp.json
```

You may need to set the token as an environment variable. Add to your shell profile (`~/.zshrc`):
```bash
export PLAYWRIGHT_MCP_EXTENSION_TOKEN="your-token-here"
```

### Option B: Manual MCP Server Configuration

Add to your `~/.claude/settings.json` under `mcpServers`:
```json
{
  "mcpServers": {
    "playwright-extension": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--extension"],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "your-token-here"
      }
    }
  }
}
```

Or in a project-level `.mcp.json`:
```json
{
  "playwright-extension": {
    "command": "npx",
    "args": ["@playwright/mcp@latest", "--extension"],
    "env": {
      "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "your-token-here"
    }
  }
}
```

## Step 4: Verify Connection

1. Restart Claude Code (or run `/mcp` to reconnect MCP servers)
2. Chrome should show an info bar: **"Playwright MCP Bridge started debugging this browser"** with a Cancel button
3. Test with a simple command like `browser_snapshot` — it should return the current page's accessibility tree

If the info bar doesn't appear, check:
- The extension is enabled in `chrome://extensions`
- The token matches between your config and the extension's status page
- Chrome is running

## Step 5: Enable File Upload Support (Important!)

By default, `browser_file_upload` and `fileChooser.setFiles()` fail with **"Not allowed"** due to Chrome's CDP security restriction on extensions. To fix this:

1. Navigate to `chrome://extensions` in Chrome (use macOS-use if Playwright can't access `chrome://` URLs)
2. Find **"Playwright MCP Bridge"** and click **"Details"**
3. Scroll down and enable **"Allow access to file URLs"** toggle
4. **Restart Chrome** for the setting to take effect

After this, file uploads work using `browser_run_code`:
```javascript
async (page) => {
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 5000 }),
    page.getByRole('button', { name: 'Upload' }).click()
  ]);
  await fileChooser.setFiles('/absolute/path/to/file.png');
  return 'File uploaded';
}
```

**Note:** The file path must be within Playwright MCP's allowed roots (typically the project directory). Copy files there first if needed.

### Automating the File URL Toggle

This setting **cannot** be enabled purely programmatically — Chrome protects extension preferences with HMAC-SHA256 validation in `Secure Preferences`. The only reliable approaches are:

1. **Automate the UI with macOS-use** (recommended for agent setup):
   ```
   # Use macOS-use to navigate chrome://extensions (Playwright can't access chrome:// URLs)
   1. open_application_and_traverse Chrome
   2. Click address bar, type "chrome://extensions", press Return
   3. Find "Playwright MCP Bridge" heading, click its "Details" button
   4. Find "Allow access to file URLs" toggle, click it
   5. Restart Chrome
   ```

2. **Chrome enterprise policy** (for fleet deployment):
   Deploy `ExtensionSettings` policy via MDM to pre-configure the setting.

**Where the setting is stored:** `~/Library/Application Support/Google/Chrome/<Profile>/Secure Preferences` under `extensions.settings.<extension_id>.newAllowFileAccess` (boolean). The file is HMAC-protected — direct edits are detected and reverted by Chrome.

## Architecture

```
Claude Code  -->  Playwright MCP Server (--extension flag)
                       |
                       | WebSocket (localhost only)
                       v
              Playwright MCP Bridge Extension (Chrome)
                       |
                       | Chrome DevTools Protocol (CDP)
                       v
                  Your Chrome Browser (tabs, pages)
```

- **Playwright MCP Server**: Node.js process (`npx @playwright/mcp@latest --extension`) that exposes MCP tools
- **Playwright MCP Bridge Extension**: Chrome extension that relays CDP commands to browser tabs
- **Token**: Shared secret ensuring only authorized MCP servers connect
- **Security**: WebSocket connections restricted to localhost (127.0.0.1 / [::1])

## Troubleshooting

### "Not allowed" on file upload
Enable "Allow access to file URLs" in extension details (see Step 5). Restart Chrome.

### File chooser modal expires
Don't use separate `browser_click` + `browser_file_upload` calls — the modal expires between tool calls. Use `browser_run_code` to do click + setFiles atomically.

### "File access denied: path is outside allowed roots"
Playwright MCP restricts file paths to the project directory. Copy the file into the project first:
```bash
cp ~/Downloads/photo.png ./photo.png
```

### Can't navigate to chrome:// URLs
Playwright can't access `chrome://` pages (blocked by CDP). Use macOS-use (`click_and_traverse`, `type_and_traverse`) to interact with Chrome settings pages.

### Extension not detected / no debugging bar
- Verify extension is installed and enabled at `chrome://extensions`
- Check the token matches: compare `PLAYWRIGHT_MCP_EXTENSION_TOKEN` env var with the token shown at `chrome-extension://mmlmfjhmonkocbjadbfplnigmagldckm/status.html`
- Restart Claude Code (`/mcp` to reconnect)

### Playwright locks / multi-agent conflicts
If multiple Claude agents share one browser, consider using lock mechanisms to prevent conflicts.

## Desktop App Onboarding Pattern

If building a desktop app that needs to onboard users to Playwright MCP, here's a proven 4-phase flow:

1. **Welcome** — explain browser access capability
2. **Connect** — check Chrome installed, check extension installed (poll every 2s scanning Chrome profile directories for extension ID), open status.html, collect token
3. **Verify** — run a test Playwright connection to confirm everything works
4. **Done** — confirmation

Detection logic:
- **Chrome installed**: check for Chrome app at standard install path
- **Extension installed**: scan Chrome profile directories for `Extensions/<extension_id>`
- **Token validation**: 20+ chars, base64url format (`[A-Za-z0-9_-]+`)
