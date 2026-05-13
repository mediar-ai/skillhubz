---
name: mk0r-cli
description: Use when the user says "mk0r", "appmaker CLI", "open a VM", "run something in the sandbox", "talk to the VM agent", "spin up an E2B sandbox", or "chat with appmaker from CLI." Wraps the `mk0r` CLI to list projects, exec commands inside their E2B sandboxes, stream chat with the VM agent (same `/api/chat` the web UI uses), toggle SOAX residential IP, manage schedules, and copy files. Supports a sticky default project via `mk0r projects use`.
---

# mk0r CLI Skill

The `mk0r` CLI is the programmatic entry point to **appmaker** (mk0r.com / staging.mk0r.com). Each project = one E2B sandbox with a persistent Chromium on CDP :9222 + Playwright MCP on :3001 + an ACP bridge on :3002, all routed through a SOAX residential proxy on :3003 when enabled.

## Setup (one-time per shell)

### 1. Stash the API key in macOS keychain

The user mints a key at `https://staging.mk0r.com/account/api-keys` (or `https://mk0r.com/account/api-keys` for prod). Each key starts with `mk0r_`. Save it under a canonical name so this skill (and future scripts) can find it without re-prompting:

```bash
security add-generic-password -U -a "$USER" \
  -s "mk0r-api-key-staging" -w 'mk0r_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
# Or for prod:
security add-generic-password -U -a "$USER" \
  -s "mk0r-api-key-prod" -w 'mk0r_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
```

To look it up later:

```bash
security find-generic-password -s "mk0r-api-key-staging" -w
```

### 2. Install / locate the CLI

The CLI lives in the appmaker repo (`cli/` directory). To put `mk0r` on PATH:

```bash
cd ~/appmaker/cli && npm link
mk0r --help
```

If you don't want the global symlink, invoke directly:

```bash
node ~/appmaker/cli/bin/mk0r.js --help
```

### 3. Write the config file

```bash
KEY=$(security find-generic-password -s "mk0r-api-key-staging" -w)
mkdir -p ~/.config/mk0r
printf '{\n  "host": "https://staging.mk0r.com",\n  "apiKey": "%s"\n}' "$KEY" \
  > ~/.config/mk0r/config.json
chmod 600 ~/.config/mk0r/config.json
```

For prod, swap `staging.mk0r.com` → `mk0r.com`. The CLI also honours `MK0R_HOST`, `MK0R_API_KEY`, and `MK0R_PROJECT` env vars; they override the file values.

## Verify

```bash
mk0r whoami           # confirms auth works; shows uid/email
mk0r projects ls      # lists projects with last-active column
```

## Pin a default project (highly recommended)

```bash
mk0r projects use <projectId>   # sticky; written to ~/.config/mk0r/config.json
mk0r projects current           # prints current default
mk0r projects use --clear       # wipe
```

After pinning, `mk0r exec`, `mk0r chat`, `mk0r session`, `mk0r cp`, `mk0r cat`, `mk0r runs`, and `mk0r schedule …` all accept the projectId as **optional** and fall back to the default. You can also pass `MK0R_PROJECT=<id>` as a per-shell override.

## Primary path: chat with the VM agent

`mk0r chat` is the canonical way to drive the VM. It hits `/api/chat` (same endpoint the web UI uses), streams the NDJSON response, and renders text deltas to stdout + tool calls (`→ tool(args)` / `✓` / `✗`) to stderr.

```bash
# With default project pinned
mk0r chat "navigate to https://example.com and tell me the H1"

# Explicit project
mk0r chat <projectId> "your prompt"

# Quieter output
mk0r chat "your prompt" --quiet

# Hide <thinking> deltas — flag MUST be AFTER the prompt
# (parseArgs would otherwise consume the prompt as the flag's value).
mk0r chat "your prompt" --no-thinking
```

The agent has these tools: bash/terminal, file read/write, Playwright MCP (same Chromium that runs on :9222, proxied through SOAX). Browser actions automatically route through the residential exit.

## Escape hatch: exec / cp / cat

When you want to bypass the agent and poke the sandbox directly:

```bash
# Sync exec (Cloud Run synchronous HTTP ceiling is ~60min)
mk0r exec -- "uname -a; whoami; ls /app"

# Async exec for long jobs
RUN_ID=$(mk0r exec --async -- "bash /app/long-job.sh")
mk0r runs $RUN_ID --watch

# Upload / read files (1.5MB cap on read)
mk0r cp ./local.txt :/tmp/remote.txt
mk0r cat :/tmp/remote.txt
```

Pass `<projectId>:<path>` to override the default for a single command.

## Residential IP toggle (SOAX)

```bash
mk0r session info                       # project, sessionKey, vmId, BRD state, live egress IP
mk0r session brd on --country us        # enable
mk0r session brd off                    # disable (egress reverts to datacenter)
mk0r session brd status                 # current state + live egress IP
```

State is persisted in Firestore on the session doc (`useResidentialIp`, `residentialCountry`). The system re-applies it on every sandbox pause/resume. SOAX rotates the exit IP every 5 minutes within a session (`sessionlength-300`), so consecutive reads of `ipify.org` will often differ; both will be residential, both will be in the requested country.

## Schedules

```bash
mk0r schedule ls
mk0r schedule create --cron "*/20 * * * *" --command "./skill/run-cycle.sh" --tz America/Los_Angeles
mk0r schedule run <scheduleId>          # fire once now
mk0r schedule rm <scheduleId>
```

The orchestrator uses fire-and-forget exec when `ACP_CALLBACK_BASE_URL` is set on Cloud Run: the sandbox runs the command detached, POSTs back to `/api/scheduled/finish` when done. Tolerates 3h+ jobs even though Cloud Run's sync HTTP ceiling is 60 minutes.

## Architecture notes (so the model doesn't re-derive)

- **One Chromium per sandbox**, launched with `--proxy-server=http://127.0.0.1:3003 --remote-debugging-port=9222`. `@playwright/mcp` attaches via `--cdp-endpoint http://127.0.0.1:9222`, so MCP browser calls AND raw CDP both hit the same process. There is no second browser.
- **Chat messages render client-side only today.** The Firestore `app_sessions/{sessionKey}` doc holds VM metadata, not chat turns. So `mk0r chat` streams go to the CLI; web UI streams go to that tab; neither sees the other's history. The agent itself remembers (ACP-level memory) — open the web UI and ask "what did we just do?" and it will recap.
- **OAuth, not API key.** Each sandbox writes the user's refreshing Claude OAuth token to `~/.claude/.credentials.json` and explicitly does NOT set `ANTHROPIC_API_KEY`. Subprocesses (e.g. `claude -p`) inherit OAuth for free.

## Common asks

| Ask | Command |
| --- | --- |
| "list my projects" | `mk0r projects ls` |
| "create a project named X" | `mk0r projects create X` |
| "open project X in the browser" | `open -a "Google Chrome" "https://staging.mk0r.com/app/<id>"` |
| "what egress IP am I going out from" | `mk0r session brd status` |
| "navigate the agent to URL X" | `mk0r chat "navigate to X with playwright and report the title"` |
| "run X in the VM" | `mk0r chat "run X and tell me what happens"` (primary) **or** `mk0r exec -- X` (escape hatch) |
| "did the long job finish?" | `mk0r runs <runId>` |
| "schedule X every 20 minutes" | `mk0r schedule create --cron "*/20 * * * *" --command "X"` |

## Don'ts

- **Don't `curl` the raw `/api/chat` endpoint** when `mk0r chat` already streams + renders properly.
- **Don't put `--no-thinking` / `--quiet` BEFORE the prompt.** `parseArgs` will consume the next token as the flag's value and your prompt vanishes.
- **Don't write API keys into source files.** Always pull from keychain at runtime.
- **Don't restart the sandbox by hand.** Pause/resume is handled by appmaker on inactivity. `mk0r session brd on` re-asserts the proxy config across resumes automatically.
