# Desktop Computer Automation

> **CRITICAL RULES:**
>
> 1. **Never run midscene commands in the background.** Each command must run synchronously so you can read its output (especially screenshots) before deciding the next action.
> 2. **Run only one midscene command at a time.** Wait for the previous command to finish, read the screenshot, then decide the next action.
> 3. **Allow enough time for each command to complete.** Midscene commands involve AI inference and screen interaction, which can take longer than typical shell commands.
> 4. **Always report task results before finishing.**

Control your desktop (macOS, Windows, Linux) using `npx @midscene/computer@1`. Each CLI command maps directly to an MCP tool -- you (the AI agent) act as the brain, deciding which actions to take based on screenshots.

## Prerequisites

Midscene requires models with strong visual grounding capabilities. Configure these environment variables:

```bash
MIDSCENE_MODEL_API_KEY="your-api-key"
MIDSCENE_MODEL_NAME="model-name"
MIDSCENE_MODEL_BASE_URL="https://..."
MIDSCENE_MODEL_FAMILY="family-identifier"
```

## Commands

### Connect to Desktop

```bash
npx @midscene/computer@1 connect
npx @midscene/computer@1 connect --displayId <id>
```

### List Displays

```bash
npx @midscene/computer@1 list_displays
```

### Take Screenshot

```bash
npx @midscene/computer@1 take_screenshot
```

### Perform Action

Use `act` to interact with the computer. Describe what you want to do in natural language:

```bash
npx @midscene/computer@1 act --prompt "type hello world in the search field and press Enter"
npx @midscene/computer@1 act --prompt "drag the file icon to the Trash"
npx @midscene/computer@1 act --prompt "search for the weather in Shanghai using the Chrome browser, tell me the result"
```

### Disconnect

```bash
npx @midscene/computer@1 disconnect
```

## Workflow Pattern

1. **Connect** to establish a session
2. **Health check** -- take a screenshot and verify it succeeds, then move the mouse to a random position
3. **Launch the target app and take screenshot** to see the current state
4. **Execute action** using `act` to perform the desired action
5. **Disconnect** when done
6. **Report results** -- summarize what was accomplished

## Best Practices

1. **Always run a health check first** after connecting
2. **Bring the target app to the foreground** before using this skill (e.g., `open -a <AppName>` on macOS)
3. **Be specific about UI elements**: Say "the red close button in the top-left corner" instead of "the close button"
4. **Describe locations when possible**: "the icon in the top-right corner of the menu bar"
5. **Never run in background**: Every midscene command must run synchronously
6. **Check for multiple displays**: Use `list_displays` if an app is not visible
7. **Batch related operations** into a single `act` command when possible
8. **Set up PATH before running (macOS)**: `export PATH="/usr/sbin:/usr/bin:/bin:/sbin:$PATH"`

## Troubleshooting

### macOS: Accessibility Permission Denied
Open **System Settings > Privacy & Security > Accessibility** and add your terminal app.

### macOS: Xcode Command Line Tools Not Found
```bash
xcode-select --install
```

### API Key Not Set
Check `.env` file contains `MIDSCENE_MODEL_API_KEY=<your-key>`.

### AI Cannot Find the Element
1. Take a screenshot to verify the element is actually visible
2. Use more specific descriptions (include color, position, surrounding text)
3. Ensure the element is not hidden behind another window
