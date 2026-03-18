---
name: whatsapp-macos
description: "Control WhatsApp desktop (macOS Catalyst app) via native MCP tools. Send messages, read chats, search contacts, verify delivery, start/quit app. Use when: 'WhatsApp message', 'send WhatsApp', 'check WhatsApp', 'text someone on WhatsApp', 'read WhatsApp messages', 'WhatsApp unread', 'open WhatsApp'."
allowed-tools: mcp__whatsapp__whatsapp_status, mcp__whatsapp__whatsapp_start, mcp__whatsapp__whatsapp_quit, mcp__whatsapp__whatsapp_get_active_chat, mcp__whatsapp__whatsapp_list_chats, mcp__whatsapp__whatsapp_search, mcp__whatsapp__whatsapp_open_chat, mcp__whatsapp__whatsapp_scroll_search, mcp__whatsapp__whatsapp_read_messages, mcp__whatsapp__whatsapp_send_message, mcp__whatsapp__whatsapp_navigate
---

# WhatsApp macOS MCP Skill

Control the native WhatsApp Catalyst app via dedicated MCP tools. No manual PID management or accessibility tree parsing needed.

## Available Tools

| Tool | Description | Key params |
|------|-------------|-----------|
| `whatsapp_status` | Check if WhatsApp is running, accessibility granted | (none) |
| `whatsapp_start` | Launch WhatsApp if not running | (none) |
| `whatsapp_quit` | Quit WhatsApp | (none) |
| `whatsapp_search` | Search contacts/chats, returns indexed structured results | `query`: search text |
| `whatsapp_open_chat` | Click Nth search result to open chat | `index`: 0-based result index |
| `whatsapp_get_active_chat` | Get current chat name, subtitle, recent messages | `limit`: max messages (default 10) |
| `whatsapp_send_message` | Send message in current chat with delivery verification | `message`: text to send |
| `whatsapp_read_messages` | Read messages from current open chat | `limit`: max messages (default 20) |
| `whatsapp_scroll_search` | Scroll search results to load more | `direction`: "up"/"down", `amount`: lines |
| `whatsapp_list_chats` | List visible sidebar chats | `filter`: "all"/"unread"/"favorites"/"groups" |
| `whatsapp_navigate` | Switch tabs | `tab`: "chats"/"calls"/"updates"/"settings"/"archived"/"starred" |

## Workflow: Send a Message

This is the REQUIRED workflow. Do NOT skip steps.

1. `whatsapp_search("contact name")` — returns indexed results with section (chats/contacts), contactName, preview, time
2. `whatsapp_open_chat(index: N)` — click the correct result, returns the active chat name
3. `whatsapp_get_active_chat()` — **verify** the correct chat is open (check name matches intended recipient)
4. `whatsapp_send_message("your message")` — sends in current chat, returns `verified: true/false`

If the contact isn't in the initial results, use `whatsapp_scroll_search(direction: "down")` to load more.

## Workflow: Read Messages

1. `whatsapp_search("contact name")` → find the chat
2. `whatsapp_open_chat(index: N)` → open it
3. `whatsapp_get_active_chat()` → returns name + recent messages in one call
4. Or use `whatsapp_read_messages(limit: 50)` for more messages

## Search Result Format

Each search result includes:
- `index` — 0-based position for `whatsapp_open_chat`
- `section` — "chats" or "contacts"
- `contactName` — parsed contact name (may be null for some chats)
- `rawDescription` — full accessibility description
- `preview` — last message preview
- `time` — timestamp

## Safety

- **Always confirm with user** before sending messages unless they gave explicit instructions
- Always verify the active chat name matches the intended recipient before sending
- The send tool includes post-send verification (reads back last message)

## Setup

The MCP server must be registered in `~/.claude.json`:
```json
"whatsapp": {
  "type": "stdio",
  "command": "whatsapp-mcp",
  "args": [],
  "env": {}
}
```

Install via: `npm install -g whatsapp-mcp-macos`

Requires: WhatsApp desktop installed, macOS accessibility permissions granted.
