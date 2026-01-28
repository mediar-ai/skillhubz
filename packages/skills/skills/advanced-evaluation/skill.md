# Advanced Evaluation

Production-grade techniques for evaluating LLM outputs using LLM-as-judge approaches with bias mitigation.

## Prerequisites

- Understanding of evaluation metrics
- Access to LLM APIs for judge models

## Instructions

### Core Approaches

**Direct Scoring**: Single LLM rates one response on a defined scale.
- Best for: Objective criteria (factual accuracy, instruction following)
- Requires: Clear criteria, calibrated scale, chain-of-thought justification

**Pairwise Comparison**: LLM compares two responses and selects the better one.
- Best for: Subjective preferences (tone, style, persuasiveness)
- Requires: Position bias mitigation (swap positions and check consistency)

### Bias Mitigation

| Bias | Mitigation |
|------|------------|
| Position Bias | Evaluate twice with swapped positions |
| Length Bias | Explicit prompting to ignore length |
| Self-Enhancement | Use different models for generation and evaluation |
| Verbosity Bias | Criteria-specific rubrics |

### Pairwise Comparison Protocol

1. First pass: Response A first, Response B second
2. Second pass: Response B first, Response A second
3. Consistency check: If passes disagree, return TIE
4. Final verdict: Consistent winner with averaged confidence

### Rubric Components

1. **Level descriptions**: Clear boundaries for each score
2. **Characteristics**: Observable features per level
3. **Examples**: Representative text (optional but valuable)
4. **Edge cases**: Guidance for ambiguous situations

### Decision Framework

```
Is there objective ground truth?
├── Yes → Direct Scoring (factual accuracy, format compliance)
└── No → Is it preference/quality judgment?
    ├── Yes → Pairwise Comparison (tone, creativity)
    └── No → Reference-based evaluation
```

## Guidelines

1. Always require justification before scores (15-25% reliability improvement)
2. Always swap positions in pairwise comparison
3. Match scale granularity to rubric specificity
4. Separate objective and subjective criteria
5. Include confidence scores calibrated to evidence strength

## Notes

- Chain-of-thought prompting improves evaluation reliability
- Single-pass pairwise comparison is corrupted by position bias
- Validate automated evaluation against human judgments

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
