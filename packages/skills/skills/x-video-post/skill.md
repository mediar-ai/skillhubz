---
name: x-video-post
description: Post a video with text to X (Twitter) using hybrid Playwright + macOS-use workflow. Use when user asks to post a video to X or Twitter.
allowed-tools: Bash, Read, Grep, mcp__playwright-extension__*, mcp__macos-use__*
---

# X (Twitter) Video Post

Posts a video with accompanying text to X. Uses Playwright for navigation and text entry, then switches entirely to macOS-use for file upload and posting.

**Critical difference from LinkedIn**: You MUST close the Playwright browser connection before triggering the file upload, or the native dialog will not appear.

## Prerequisites

- Chrome logged into X (Twitter)
- Video file exists at an absolute path on disk
- Post text prepared

## Step-by-Step Workflow

### Phase 1: Type Post Text (Playwright)

1. Navigate to X home:
   ```
   browser_navigate → https://x.com/home
   ```
2. Take a snapshot to find the composer
3. Click the "What is happening?!" text area to focus it
4. Type the post text into the composer

### Phase 2: Close Playwright (Critical!)

5. **Close Playwright browser connection:**
   ```
   browser_close
   ```
   This is **mandatory** — Playwright's CDP `fileChooserOpened` listener will intercept the file dialog event and prevent the native macOS dialog from appearing. The typed text will persist in Chrome after closing Playwright.

### Phase 3: Upload Video (macOS-use)

6. Get Chrome PID:
   ```bash
   pgrep -x "Google Chrome"
   ```
7. Use `click_and_traverse` on the **media upload icon** (image/video icon in composer toolbar)
   - Grep traversal for media-related buttons or icons
   - It's typically an image icon in the bottom toolbar of the composer
8. Wait for native file dialog (AXSheet) to appear
   - Grep traversal for `AXSheet` to confirm
9. Press `Cmd+Shift+G` via `press_key_and_traverse` to open "Go to folder"
10. Type the absolute video file path via `type_and_traverse`
11. Press `Return` via `press_key_and_traverse`
12. Grep traversal for `"Open"` button (AXButton near bottom of AXSheet, y > 1500)
13. Click "Open" via `click_and_traverse`

### Phase 4: Wait for Upload & Post (macOS-use)

14. **Wait for video upload to complete** — X shows upload progress
    - Look for "Uploaded (100%)" or similar completion indicator
    - Large videos may take 30-60+ seconds
    - Periodically `refresh_traversal` and grep for upload status
15. Once upload complete, click **"Post"** button via `click_and_traverse`
    - Grep traversal for "Post" AXButton

## Troubleshooting

- **File dialog doesn't appear**: Most likely Playwright is still connected. Ensure you called `browser_close` before clicking the media button with macOS-use.
- **Text disappeared after browser_close**: This shouldn't happen — Chrome keeps the page state. If it does, re-type via macOS-use `type_and_traverse`.
- **Upload progress stuck**: Large videos take time. Wait and check. If truly stuck, try re-selecting the file.
- **"Post" button grayed out**: Video may still be processing. Wait for upload completion indicator.
- **Can't find media button**: Traverse Chrome window and grep for image/photo/media related accessibility labels. The button is in the composer toolbar row.
