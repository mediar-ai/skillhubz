# Memory System Design

Design memory architectures for agents with layered persistence from working memory to knowledge graphs.

## Prerequisites

- Understanding of vector embeddings
- Familiarity with graph databases

## Instructions

### Memory Layers

| Layer | Persistence | Access | Use Case |
|-------|-------------|--------|----------|
| Working | Context window | Zero latency | Current task |
| Short-term | Session | Searchable | Conversation state |
| Long-term | Cross-session | Structured | Learning over time |
| Entity | Permanent | Queryable | Entity consistency |

### Memory Architecture Comparison

| System | Accuracy | Latency | Notes |
|--------|----------|---------|-------|
| Temporal KG | 94.8% | 2.58s | Best accuracy |
| MemGPT | 93.4% | Variable | Good general |
| GraphRAG | 75-85% | Variable | 20-35% over RAG |
| Vector RAG | 60-70% | Fast | Loses relationships |

### Why Vector Stores Fall Short

Vector stores lose relationship information. If agent learns "Customer X purchased Product Y on Date Z," it cannot answer "What did customers who bought Y also buy?"

### Knowledge Graph Advantages

- Preserve relationships between entities
- Enable queries that traverse relationships
- Support temporal validity periods

### Temporal Knowledge Graphs

Add validity periods to facts:

```python
# What was user's address on January 15?
temporal_graph.query("""
    MATCH (user)-[r:LIVES_AT]->(address)
    WHERE r.valid_from <= $date AND r.valid_until > $date
    RETURN address
""", {"date": "2024-01-15"})
```

### Memory Selection Guide

- **Simple persistence**: File-system memory
- **Semantic search**: Vector RAG with metadata
- **Relationship reasoning**: Knowledge graph
- **Temporal validity**: Temporal knowledge graph

## Guidelines

1. Match architecture to query requirements
2. Use temporal validity to prevent outdated conflicts
3. Consolidate memories periodically
4. Design for retrieval failures gracefully
5. Consider privacy implications of persistence

## Notes

- Zep showed 90% retrieval latency reduction vs full-context
- GraphRAG reduces hallucination by up to 30%
- Entity memory maintains consistency across conversations

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
