# Context Engineering Fundamentals

Foundational understanding of context engineering for AI agent systems, covering context components, attention mechanics, progressive disclosure, and context budgeting.

## Prerequisites

- Understanding of LLM basics
- Familiarity with AI agent architectures
- Knowledge of token concepts

## Instructions

1. **Understand Context Components**

   Context includes everything the model can attend to:
   - **System Prompts**: Core identity, constraints, behavioral guidelines
   - **Tool Definitions**: Actions an agent can take with descriptions
   - **Retrieved Documents**: Domain-specific knowledge loaded at runtime
   - **Message History**: Conversation and reasoning across turns
   - **Tool Outputs**: Results of agent actions (can be 80%+ of context)

2. **Apply the Attention Budget Constraint**

   - Models create n² relationships for n tokens
   - Attention "depletes" as context grows
   - Middle of context receives less attention than beginning/end
   - Place critical information at attention-favored positions

3. **Use Progressive Disclosure**

   Load information only as needed:
   ```markdown
   # Instead of loading all documentation at once:

   # Step 1: Load summary
   docs/api_summary.md          # Lightweight overview

   # Step 2: Load specific section as needed
   docs/api/endpoints.md        # Only when API calls needed
   ```

4. **Organize System Prompts**

   Use clear section boundaries:
   ```markdown
   <BACKGROUND_INFORMATION>
   You are a Python expert helping a development team.
   </BACKGROUND_INFORMATION>

   <INSTRUCTIONS>
   - Write clean, idiomatic code
   - Include type hints
   </INSTRUCTIONS>

   <TOOL_GUIDANCE>
   Use bash for shell operations, python for code tasks.
   </TOOL_GUIDANCE>
   ```

5. **Practice Context Budgeting**

   - Know effective context limit for your model
   - Monitor context usage during development
   - Implement compaction triggers at 70-80% utilization
   - Design for degradation rather than hoping to avoid it

6. **Prefer Quality Over Quantity**

   Find the smallest possible set of high-signal tokens that maximize desired outcomes. More context is not always better.

## Error Handling

- If agent behavior is unexpected, check context composition
- If responses degrade mid-conversation, context may be overloaded
- Implement observation masking for long tool outputs

## Notes

- Context engineering is iterative, not one-time prompt writing
- File-system access enables natural progressive disclosure
- Hybrid strategies work best: pre-load some, load more on demand
- Tool outputs often dominate context - design for this

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
