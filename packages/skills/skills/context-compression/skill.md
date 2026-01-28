# Context Compression Strategies

Compress agent context while preserving critical information for long-running sessions.

## Prerequisites

- Understanding of context windows
- Familiarity with summarization techniques

## Instructions

### Key Insight

Optimize for **tokens-per-task**, not tokens-per-request. When compression loses critical details, agents must re-fetch information, wasting more tokens overall.

### Compression Approaches

| Approach | Compression | Quality | Trade-off |
|----------|-------------|---------|-----------|
| Anchored Iterative | 98.6% | 3.70 | Best quality |
| Regenerative | 98.7% | 3.44 | Moderate |
| Opaque | 99.3% | 3.35 | Best compression |

### Structured Summary Sections

```markdown
## Session Intent
[What the user is trying to accomplish]

## Files Modified
- file.ts: Description of changes

## Decisions Made
- Key decision and rationale

## Current State
- Progress status

## Next Steps
1. Next action item
```

### Compression Triggers

| Strategy | Trigger Point |
|----------|---------------|
| Fixed threshold | 70-80% context utilization |
| Sliding window | Keep last N turns + summary |
| Task-boundary | Compress at logical task completions |

### Probe-Based Evaluation

Test compression quality by asking questions:

| Probe Type | Tests |
|------------|-------|
| Recall | "What was the original error?" |
| Artifact | "Which files have we modified?" |
| Continuation | "What should we do next?" |

## Guidelines

1. Use structured summaries with explicit sections
2. Implement incremental merging, not full regeneration
3. Track artifact trail separately (weakest dimension)
4. Accept slightly lower compression for better quality
5. Monitor re-fetching frequency as quality signal

## Notes

- Structure forces preservation through dedicated sections
- Artifact trail integrity is universally weak (2.2-2.5/5.0)
- Sliding window with structured summaries is best for coding agents

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
