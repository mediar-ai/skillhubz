# Browser Lock (Multi-Agent Playwright Concurrency)

Multiple Claude agents share a **single browser instance** via MCP Playwright. A hook-based locking system prevents conflicts — only one agent can use the browser at a time; others wait their turn.

## How It Works

1. **PreToolUse hook** (`~/.claude/hooks/playwright-lock.sh`) runs before any `mcp__playwright*` tool call:
   - If lock is free or held by the same session: acquire/refresh, allow the call
   - If held by another session: poll every 2s, wait up to 120s
   - If timeout: block the tool call (exit code 2)

2. **PostToolUse hook** (`~/.claude/hooks/playwright-unlock.sh`) runs after each tool call:
   - Refreshes the lock timestamp, keeping the session's hold alive across sequential browser operations

3. **Session exit** (`~/.claude/hooks/session-end.sh`) releases the lock on clean exit

## Key Files

| File | Purpose |
|------|---------|
| `~/.claude/hooks/playwright-lock.sh` | PreToolUse hook — acquires lock or waits |
| `~/.claude/hooks/playwright-unlock.sh` | PostToolUse hook — refreshes lock timestamp |
| `~/.claude/playwright-lock.json` | Lock state: `{ session_id, timestamp }` |
| `~/.claude/playwright-mutex.d/` | Atomic filesystem mutex (transient, should not persist) |
| `~/.claude/playwright-lock.log` | Event log (ACQUIRED, BLOCKED, REFRESHED, TIMEOUT, EXPIRED) |
| `~/.claude/settings.json` | Hook config under `PreToolUse` / `PostToolUse` with matcher `mcp__playwright.*` |

## Parameters

| Parameter | Value | Defined in |
|-----------|-------|------------|
| Lock expiry | 30s of inactivity | `playwright-lock.sh` `LOCK_EXPIRY` |
| Max wait | 120s | `playwright-lock.sh` `MAX_WAIT` |
| Poll interval | 2s | `playwright-lock.sh` `POLL_INTERVAL` |
| Mutex stale timeout | 5s | `playwright-lock.sh` `MUTEX_EXPIRY` |
| PreToolUse hook timeout | 130s | `settings.json` |
| PostToolUse hook timeout | 5s | `settings.json` |

## Debugging

### Check current lock status
```bash
cat ~/.claude/playwright-lock.json
```

### Watch lock activity in real time
```bash
tail -f ~/.claude/playwright-lock.log
```

### Force-release a stuck lock
```bash
rm -f ~/.claude/playwright-lock.json ~/.claude/playwright-mutex.d
```

### View recent contention events
```bash
grep "BLOCKED\|ACQUIRED after\|TIMEOUT\|EXPIRED" ~/.claude/playwright-lock.log | tail -20
```

## Important Notes

- New/restarted sessions pick up hooks automatically
- Running sessions must be restarted to activate locking (hooks are loaded at session startup from `settings.json`)
- Session identity comes from the hook input JSON (`session_id`), with terminal-based fallback
- The lock auto-expires after 30s of no Playwright calls from the holding session, so an agent that moves on to non-browser work releases the browser naturally