# Context Degradation Patterns

Recognize and mitigate context failures as context length increases.

## Prerequisites

- Understanding of attention mechanisms
- Familiarity with context windows

## Instructions

### Degradation Patterns

**Lost-in-Middle**: Information in center receives less attention.
- 10-40% lower recall for middle content
- Place critical info at beginning or end

**Context Poisoning**: Errors compound through repeated reference.
- Tool outputs, retrieved docs, or summaries introduce errors
- Creates feedback loops reinforcing incorrect beliefs

**Context Distraction**: Irrelevant info overwhelms relevant content.
- Single irrelevant document reduces performance
- Models must attend to everything provided

**Context Confusion**: Model cannot determine which context applies.
- Responses address wrong aspect of query
- Tool calls appropriate for different task

**Context Clash**: Accumulated information directly conflicts.
- Multi-source retrieval with contradictions
- Version conflicts between outdated and current info

### Model Degradation Thresholds

| Model | Degradation Onset | Severe |
|-------|-------------------|--------|
| GPT-5.2 | ~64K tokens | ~200K |
| Claude Opus 4.5 | ~100K tokens | ~180K |
| Claude Sonnet 4.5 | ~80K tokens | ~150K |
| Gemini 3 Pro | ~500K tokens | ~800K |

### Four-Bucket Mitigation

1. **Write**: Save context outside window (scratchpads, files)
2. **Select**: Pull relevant context through retrieval/filtering
3. **Compress**: Reduce tokens via summarization
4. **Isolate**: Split across sub-agents with fresh contexts

## Guidelines

1. Monitor context length and performance correlation
2. Place critical information at beginning or end
3. Implement compaction before degradation becomes severe
4. Validate retrieved documents for accuracy
5. Segment tasks to prevent confusion across objectives

## Notes

- RULER benchmark: Only 50% of 32K+ models maintain performance at 32K
- Shuffled haystacks can outperform coherent ones
- Larger context windows do not uniformly improve performance

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
