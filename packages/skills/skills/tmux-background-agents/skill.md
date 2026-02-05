# tmux Background Agents

Manage background Claude Code sessions using tmux. Start agents, send prompts, read responses, and hand off to Terminal windows - all without interrupting your main session.

## Prerequisites

- macOS with Terminal.app
- tmux installed (`brew install tmux`)
- Claude Code CLI installed

## Instructions

### Start a new background Claude session

```bash
# Basic - starts in specified directory
tmux new-session -d -s SESSION_NAME "cd /path/to/dir && claude --dangerously-skip-permissions"

# With initial prompt
tmux new-session -d -s SESSION_NAME "cd /path/to/dir && claude --dangerously-skip-permissions 'YOUR PROMPT HERE'"
```

### Send a prompt to an existing session

```bash
tmux send-keys -t SESSION_NAME "your prompt here" Enter
```

Note: Sometimes an extra `Enter` is needed:
```bash
tmux send-keys -t SESSION_NAME Enter
```

### Read response from a session

```bash
tmux capture-pane -t SESSION_NAME -p
```

For full scrollback:
```bash
tmux capture-pane -t SESSION_NAME -p -S -100
```

### List all sessions

```bash
tmux ls
```

### Open a session in a Terminal window (hand off to user)

```bash
osascript <<'APPLESCRIPT'
tell application "Terminal"
  activate
  do script "tmux attach -t SESSION_NAME"
end tell
APPLESCRIPT
```

### Kill a session

```bash
tmux kill-session -t SESSION_NAME
```

## Workflow Example

1. **Start session:**
```bash
tmux new-session -d -s my-agent "cd ~/project && claude --dangerously-skip-permissions"
sleep 5
```

2. **Send prompt:**
```bash
tmux send-keys -t my-agent "Fix the bug in auth.swift" Enter
```

3. **Wait and read response:**
```bash
sleep 15
tmux capture-pane -t my-agent -p
```

4. **Hand off to user:**
```bash
osascript -e 'tell application "Terminal" to do script "tmux attach -t my-agent"'
```

## User Request Mapping

When the user asks to:
- "start a background agent" → create tmux session with Claude
- "send prompt to agent X" → use `tmux send-keys`
- "check agent X" → use `tmux capture-pane`
- "open agent X" → open Terminal attached to tmux session
- "list agents" → use `tmux ls`
- "stop agent X" → use `tmux kill-session`

## Tips

- Always wait 5-8 seconds after starting a session for Claude to initialize
- After sending a prompt, wait 10-15 seconds for response
- Send an extra `Enter` if the prompt doesn't seem to submit
- Use descriptive session names like `auth-fix`, `ui-refactor`, etc.
