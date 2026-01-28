# Evaluation Methods for Agent Systems

Evaluate agent systems with multi-dimensional rubrics accounting for non-determinism and multiple valid paths.

## Prerequisites

- Understanding of agent architectures
- Familiarity with evaluation metrics

## Instructions

### Key Insight: Performance Drivers

Research found three factors explain 95% of performance variance:

| Factor | Variance | Implication |
|--------|----------|-------------|
| Token usage | 80% | More tokens = better performance |
| Tool calls | ~10% | More exploration helps |
| Model choice | ~5% | Better models multiply efficiency |

### Multi-Dimensional Rubric

| Dimension | Measures |
|-----------|----------|
| Factual accuracy | Claims match ground truth |
| Completeness | Output covers requested aspects |
| Citation accuracy | Citations match sources |
| Source quality | Uses appropriate primary sources |
| Tool efficiency | Right tools, reasonable count |

### Test Set Design

**Complexity Stratification**:
- Simple: Single tool call
- Medium: Multiple tool calls
- Complex: Many calls, significant ambiguity
- Very complex: Extended interaction, deep reasoning

### Evaluation Methodologies

**LLM-as-Judge**: Scalable, consistent judgments.
- Provide task, output, ground truth, evaluation scale
- Request structured judgment

**Human Evaluation**: Catches what automation misses.
- Edge cases, system failures, subtle biases

**End-State Evaluation**: For agents that mutate state.
- Focus on final state matching expectations

## Guidelines

1. Use multi-dimensional rubrics, not single metrics
2. Evaluate outcomes, not specific execution paths
3. Cover complexity levels from simple to complex
4. Test with realistic context sizes
5. Supplement LLM evaluation with human review
6. Track metrics over time for trend detection

## Notes

- Agents may take different valid paths to goals
- Model upgrades beat token increases for performance
- High absolute agreement matters less than systematic patterns

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
