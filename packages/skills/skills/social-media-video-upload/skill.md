---
name: social-media-video-upload
description: Core hybrid Playwright + macOS-use pattern for uploading files through Chrome. Use when any social media platform needs a file upload and Playwright's browser_file_upload fails with "Not allowed".
allowed-tools: Bash, Read, mcp__playwright-extension__*, mcp__macos-use__*
---

# Social Media Video Upload — Hybrid Pattern

Foundational reference for uploading files to web apps through Chrome when Playwright's `browser_file_upload` doesn't work (returns `Protocol error (DOM.setFileInputFiles): Not allowed`).

## The Core Problem

- `browser_file_upload` fails on LinkedIn, X, and many sites: `Not allowed`
- Playwright intercepts `fileChooserOpened` CDP events, which prevents the native macOS file dialog from appearing
- On **X specifically**: you must **close the Playwright tab** (`browser_close`) before the macOS-use click triggers the file dialog — otherwise Playwright's CDP listener swallows the event

## The Solution: Hybrid Playwright + macOS-use

Use Playwright for all standard web interactions (navigate, type, click web buttons). Switch to macOS-use when you need to trigger and interact with native file dialogs.

### Step-by-Step Pattern

1. **Use Playwright** for navigation, typing text, clicking web UI buttons
2. **When you hit a file upload button:**
   - On X: call `browser_close` first to release CDP file chooser interception
   - On LinkedIn: no need to close — just switch to macOS-use
3. **Find Chrome PID:**
   ```bash
   pgrep -x "Google Chrome"
   ```
4. **Click the upload button via macOS-use** (`click_and_traverse`) — this triggers the native file dialog
5. **Confirm dialog opened:** grep the traversal output for `AXSheet` role
6. **Navigate the file dialog:**
   - Press `Cmd+Shift+G` to open "Go to folder" text field
   - Type the full absolute file path
   - Press `Return` to navigate
7. **Click "Open" button:**
   - The Open/Cancel buttons are always near the bottom of the AXSheet
   - Typically at `y > 1500` (around y ~1565)
   - Grep traversal for `"Open"` and find the AXButton
8. **Verify upload** — wait for upload progress indicator to complete
9. **Continue posting** via macOS-use (click Post, Next, etc.)

## Traversal Tips

- **Never read full traversal JSON** — files are huge. Use grep or python to search.
- Check for `AXSheet` role to confirm file dialog is open
- The "Where:" popup shows the current directory in the file dialog
- File dialog Open/Cancel buttons are typically at y ~1565
- After clicking Open, wait a moment for the file to be selected/uploaded

## Platform-Specific Notes

| Platform | Close Playwright? | Upload Button | Post-Upload |
|----------|-------------------|---------------|-------------|
| LinkedIn | No | "Add media" in composer | Click "Next" (video edit), then "Post" |
| X | **Yes** (`browser_close`) | Media icon (image/video) | Wait for "Uploaded (100%)", click "Post" |

## Common Gotchas

- **Playwright steals file dialogs**: The CDP `fileChooserOpened` event listener prevents native dialogs. On X, the only fix is closing the Playwright connection.
- **Cmd+Shift+G timing**: Sometimes the "Go to folder" sheet takes a moment to appear. If typing the path doesn't work, wait and retry.
- **File path must be absolute**: Always use full paths like `/path/to/your/video.mp4`
- **AXSheet detection**: After clicking an upload button, grep for `AXSheet` in the traversal to confirm the dialog appeared. If it didn't, the CDP interception may have swallowed it.
