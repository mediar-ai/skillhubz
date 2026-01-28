# Filesystem-Based Context Engineering

Use the filesystem for dynamic context discovery, enabling agents to store and retrieve unlimited context on demand.

## Prerequisites

- File system access tools (read, write, grep, glob)
- Understanding of context limitations

## Instructions

### Core Insight

Files enable **dynamic context discovery**: agents pull relevant context on demand rather than carrying everything in the context window.

### Pattern 1: Scratch Pad

Write large tool outputs to files instead of returning to context.

```python
def handle_tool_output(output, threshold=2000):
    if len(output) < threshold:
        return output

    file_path = f"scratch/{tool_name}_{timestamp}.txt"
    write_file(file_path, output)

    summary = extract_summary(output, max_tokens=200)
    return f"[Output in {file_path}. Summary: {summary}]"
```

### Pattern 2: Plan Persistence

Store plans in structured format for re-reading:

```yaml
# scratch/current_plan.yaml
objective: "Refactor authentication module"
status: in_progress
steps:
  - id: 1
    description: "Audit current endpoints"
    status: completed
  - id: 2
    description: "Design new flow"
    status: in_progress
```

### Pattern 3: Sub-Agent Communication

Sub-agents write findings directly to filesystem. Coordinator reads files, bypassing message passing.

```
workspace/
  agents/
    research_agent/findings.md
    code_agent/changes.md
  coordinator/synthesis.md
```

### Pattern 4: Dynamic Skill Loading

Store skills as files. Load only when task requires them.

```
Static context: "Available: database-optimization, api-design"
Agent action: read_file("skills/database-optimization/SKILL.md")
```

### Filesystem Search Techniques

- `ls` / `list_dir`: Discover structure
- `glob`: Find files by pattern
- `grep`: Search contents
- `read_file` with ranges: Read specific lines

## Guidelines

1. Write large outputs to files; return summaries to context
2. Store plans in structured files for re-reading
3. Use sub-agent file workspaces instead of message chains
4. Load skills dynamically rather than stuffing all in system prompt
5. Combine grep/glob with semantic search

## Notes

- Models are trained to understand filesystem traversal
- Filesystem search often outperforms semantic search for code
- Implement cleanup for scratch files to prevent unbounded growth

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
