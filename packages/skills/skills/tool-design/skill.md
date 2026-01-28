# Tool Design for Agents

Design tools that agents can effectively discover, understand, and use.

## Prerequisites

- Understanding of agent architectures
- API design experience

## Instructions

### Core Principle

Tool descriptions are **prompt engineering** that shapes agent behavior. Poor design creates failure modes no prompt engineering can fix.

### Consolidation Principle

If a human engineer cannot definitively say which tool to use, an agent cannot either. Prefer single comprehensive tools over multiple narrow tools.

**Instead of**: list_users, list_events, create_event
**Use**: schedule_event (handles full workflow)

### Description Requirements

Answer four questions:
1. **What** does it do? (Clear, specific)
2. **When** should it be used? (Triggers and contexts)
3. **What inputs** does it accept? (Types, constraints, defaults)
4. **What does it return**? (Format, examples, errors)

### Architectural Reduction

Production evidence shows removing specialized tools often improves performance.

Vercel d0: 17 tools → 2 (bash + SQL), 80% → 100% success.

**When reduction works**:
- Data layer is well-documented
- Model has sufficient reasoning
- Tools were constraining, not enabling

### Response Format Options

```python
def get_customer(id: str, format: str = "concise"):
    """
    format: "concise" for key fields, "detailed" for complete
    """
```

### Error Message Design

Errors must be actionable for agents:
- What went wrong
- How to correct it
- Retry guidance if applicable

### MCP Tool Naming

Always use fully qualified names:
```
"Use the BigQuery:bigquery_schema tool..."  # Correct
"Use the bigquery_schema tool..."            # May fail
```

## Guidelines

1. Write descriptions answering what, when, inputs, returns
2. Use consolidation to reduce ambiguity
3. Implement response format options
4. Design errors for agent recovery
5. Limit to 10-20 tools; use namespacing if more needed
6. Prefer primitive tools over specialized wrappers
7. Build minimal architectures that benefit from model improvements

## Notes

- 10-20 tools reasonable for most applications
- Tool description overlap causes model confusion
- Use agents to optimize their own tool descriptions

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
