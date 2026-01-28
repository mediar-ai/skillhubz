# Project Development Methodology

Identify tasks suited to LLM processing, design pipelines, and iterate with agent-assisted development.

## Prerequisites

- Understanding of LLM capabilities
- Familiarity with batch processing

## Instructions

### Task-Model Fit

**LLM-suited tasks**:
- Synthesis across sources
- Subjective judgment with rubrics
- Natural language output
- Error tolerance acceptable
- Batch processing (no conversational state)

**LLM-unsuited tasks**:
- Precise computation
- Real-time requirements
- Perfect accuracy required
- Sequential dependencies
- Deterministic output needed

### Manual Prototype First

Before building automation:
1. Copy one representative input into model
2. Evaluate output quality
3. Identify failure modes
4. Estimate tokens per item

If manual prototype fails, automated system will fail.

### Pipeline Architecture

```
acquire → prepare → process → parse → render
```

- **acquire**: Fetch raw data
- **prepare**: Transform to prompt format
- **process**: LLM calls (expensive, non-deterministic)
- **parse**: Extract structured data
- **render**: Generate final outputs

### File System as State Machine

```
data/{id}/
├── raw.json      # acquire complete
├── prompt.md     # prepare complete
├── response.md   # process complete
├── parsed.json   # parse complete
```

Check file existence to determine processing state.

### Architectural Reduction

Start minimal. Vercel's d0 agent: 17 tools → 2 tools (bash + SQL), 80% → 100% success rate.

**When reduction works**:
- Data layer is well-documented
- Model has sufficient reasoning
- Specialized tools were constraining

## Guidelines

1. Validate task-model fit with manual prototype
2. Structure pipelines as discrete, idempotent stages
3. Use file system for state management
4. Design prompts for parseable outputs
5. Start minimal; add complexity only when proven necessary
6. Estimate costs early and track throughout

## Notes

- Karpathy's HN Capsule: 930 items, $58 cost, 1 hour
- Expect multiple architectural iterations
- Test whether scaffolding helps or constrains model

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
