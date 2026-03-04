---
name: video-social-poster
description: Orchestrates posting a video to multiple social platforms (LinkedIn, X/Twitter). Use when user wants to post a video to social media, share a video on LinkedIn/X, or says "post this video".
allowed-tools: Bash, Read, Grep, mcp__playwright-extension__*, mcp__macos-use__*
---

# Video Social Poster

High-level orchestrator for posting a video with text to one or more social media platforms. Delegates to platform-specific skills.

## Trigger Phrases

- "post this video", "share this video on social", "post video to LinkedIn and X"
- "upload video to Twitter", "post video to LinkedIn"
- Any request involving posting a video file to social media platforms

## Prerequisites

- Video file exists at an absolute path
- Post text provided (or will be composed)
- Chrome logged into target platforms (LinkedIn and X/Twitter)

## Workflow

### 1. Gather Inputs

Confirm you have:
- **Video file path** — absolute path to the video file
- **Post text** — the caption/text for the post (may differ per platform)
- **Target platforms** — which platforms to post to (LinkedIn, X, or both)

If any are missing, ask the user.

### 2. Post to Each Platform

Delegate to the appropriate platform-specific skill:

| Platform | Skill | Key Notes |
|----------|-------|-----------|
| LinkedIn | `linkedin-video-post` | Don't need to close Playwright for upload |
| X/Twitter | `x-video-post` | **Must close Playwright** before file upload |

**Important ordering**: If posting to both platforms, post to **LinkedIn first**, then **X**. This is because X requires closing the Playwright browser connection, which would disrupt LinkedIn posting if done first.

### 3. Verify Success

After each platform post:
- Confirm the post is visible
- Note the post URL if available

## Technical Background

Standard Playwright `browser_file_upload` fails on these platforms with `Protocol error (DOM.setFileInputFiles): Not allowed`. The solution is a hybrid approach using Playwright for web interactions and macOS-use MCP for native file dialog handling. See `social-media-video-upload` skill for the full technical pattern.

## Platform-Specific Skills

- **`social-media-video-upload`** — Core hybrid upload pattern (reference doc)
- **`linkedin-video-post`** — LinkedIn step-by-step workflow
- **`x-video-post`** — X/Twitter step-by-step workflow
