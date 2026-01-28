# Context Optimization Techniques

Extend effective context capacity through strategic compression, masking, caching, and partitioning.

## Prerequisites

- Understanding of context windows
- Familiarity with token economics

## Instructions

### Optimization Strategies

**Compaction**: Summarize context near limits, reinitialize with summary.
- Target 50-70% token reduction
- Less than 5% quality degradation

**Observation Masking**: Replace verbose tool outputs with references.
- Tool outputs can be 80%+ of token usage
- Store full output, return summary + reference

**KV-Cache Optimization**: Reuse cached computations for common prefixes.
- Place stable elements first (system prompt, tool definitions)
- Avoid dynamic content like timestamps

**Context Partitioning**: Split work across sub-agents with isolated contexts.
- Each sub-agent gets fresh context
- Aggregate results at coordination layer

### Compaction Priority

1. Tool outputs → replace with summaries
2. Old turns → summarize early conversation
3. Retrieved docs → summarize if recent versions exist
4. Never compress → system prompt

### Observation Masking Strategy

**Never mask**: Critical observations, most recent turn, active reasoning

**Consider masking**: 3+ turns ago, verbose outputs with extractable key points

**Always mask**: Repeated outputs, boilerplate, already-summarized content

### Cache-Friendly Ordering

```python
context = [system_prompt, tool_definitions]  # Stable, cacheable
context += [reused_templates]                 # Reusable
context += [unique_content]                   # Unique per request
```

## Guidelines

1. Measure before optimizing—know your current state
2. Apply compaction before masking when possible
3. Design for cache stability with consistent prompts
4. Partition before context becomes problematic
5. Balance token savings against quality preservation

## Notes

- Context quality matters more than quantity
- Optimization can double or triple effective capacity
- Monitor token utilization and trigger at 70-80%

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
