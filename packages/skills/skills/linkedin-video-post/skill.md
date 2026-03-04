---
name: linkedin-video-post
description: Post a video with text to LinkedIn using hybrid Playwright + macOS-use workflow. Use when user asks to post a video to LinkedIn.
allowed-tools: Bash, Read, Grep, mcp__playwright-extension__*, mcp__macos-use__*
---

# LinkedIn Video Post

Posts a video with accompanying text to LinkedIn. Uses Playwright for web interactions and macOS-use for the native file upload dialog.

## Prerequisites

- Chrome logged into LinkedIn
- Video file exists at an absolute path on disk
- Post text prepared

## Step-by-Step Workflow

### Phase 1: Open Composer (Playwright)

1. Navigate to LinkedIn feed:
   ```
   browser_navigate → https://www.linkedin.com/feed/
   ```
2. Take a snapshot to find the composer
3. Click "Start a post" button to open the post composer modal

### Phase 2: Write Post Text (Playwright)

4. Take a snapshot of the composer modal
5. Type the post text into the composer text area
6. Verify text appears correctly

### Phase 3: Upload Video (macOS-use)

7. Get Chrome PID:
   ```bash
   pgrep -x "Google Chrome"
   ```
8. **Do NOT close Playwright** — LinkedIn works without closing it
9. Use `click_and_traverse` on the **"Add media"** button (camera/image icon in composer toolbar)
   - Find it in the Playwright snapshot first to identify its position
   - Or grep the macOS-use traversal for "Add media" or the media icon
10. Wait for native file dialog (AXSheet) to appear
11. Press `Cmd+Shift+G` via `press_key_and_traverse` to open "Go to folder"
12. Type the absolute video file path via `type_and_traverse`
13. Press `Return` via `press_key_and_traverse`
14. Grep traversal for `"Open"` button (AXButton near bottom, y > 1500)
15. Click "Open" via `click_and_traverse`

### Phase 4: Post (macOS-use)

16. **Wait for video upload** — LinkedIn shows upload progress. Wait for it to complete.
17. LinkedIn shows a video editing/trimming step — click **"Next"** to skip it
18. Click **"Post"** button
19. **Dismiss boost offer** — LinkedIn may show a "Boost this post" dialog. Dismiss it by clicking "Got it" or the X button.

## Troubleshooting

- **"Add media" not found**: Look for camera icon or image icon in the composer toolbar. Try snapshot/traversal to locate it.
- **File dialog didn't open**: Playwright may have intercepted it. Try closing Playwright (`browser_close`), then clicking via macOS-use.
- **Upload stuck**: Large videos take time. Wait 30-60 seconds and check traversal for progress indicators.
- **"Next" button not appearing**: The video may still be processing. Wait and refresh traversal.
- **Boost dialog blocking**: After posting, LinkedIn often shows a boost promotion. Dismiss it before confirming success.
