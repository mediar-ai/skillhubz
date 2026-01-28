# Multi-Agent Architecture Patterns

Design multi-agent systems for distributing work across multiple context windows.

## Prerequisites

- Understanding of context limitations
- Familiarity with agent frameworks

## Instructions

### Core Insight

Sub-agents exist primarily to **isolate context**, not to anthropomorphize role division. Each sub-agent gets a clean context focused on its subtask.

### Token Economics

| Architecture | Token Multiplier |
|--------------|------------------|
| Single chat | 1× baseline |
| Single + tools | ~4× baseline |
| Multi-agent | ~15× baseline |

### Pattern 1: Supervisor/Orchestrator

Central agent delegates to specialists and synthesizes results.

```
User -> Supervisor -> [Specialist, Specialist] -> Aggregation -> Output
```

**When to use**: Clear decomposition, coordination across domains, human oversight needed.

**Pitfall**: "Telephone game" where supervisor paraphrases incorrectly. Fix with `forward_message` tool for direct responses.

### Pattern 2: Peer-to-Peer/Swarm

Agents communicate directly with explicit handoffs.

```python
def transfer_to_agent_b():
    return agent_b  # Handoff via function return
```

**When to use**: Flexible exploration, emergent requirements, no rigid planning.

### Pattern 3: Hierarchical

Layers of abstraction: Strategy → Planning → Execution.

**When to use**: Large-scale projects, enterprise workflows, clear hierarchy.

### Context Isolation Mechanisms

- **Full context delegation**: Complex tasks needing full understanding
- **Instruction passing**: Simple, well-defined subtasks
- **File system memory**: Complex tasks with shared state

### Consensus Mechanisms

- **Weighted voting**: Weight by confidence or expertise
- **Debate protocols**: Adversarial critique across rounds
- **Trigger intervention**: Detect stalls or sycophancy

## Guidelines

1. Design for context isolation as primary benefit
2. Choose pattern based on coordination needs, not metaphor
3. Implement explicit handoff protocols with state passing
4. Use weighted voting or debate for consensus
5. Monitor for supervisor bottlenecks

## Notes

- Model upgrades often beat token increases for performance
- Swarm slightly outperforms supervisor with direct responses
- Validate outputs before passing between agents

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
