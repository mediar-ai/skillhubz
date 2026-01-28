# Doc Co-Authoring

Structured workflow for co-authoring documentation including proposals, technical specs, decision docs, and similar content. Three stages: Context Gathering, Refinement & Structure, and Reader Testing.

## Prerequisites

- Clear understanding of document purpose
- Access to relevant context (channels, docs, stakeholders)
- Time for iterative refinement

## Instructions

### Stage 1: Context Gathering

1. **Ask Initial Questions**
   - What type of document? (technical spec, decision doc, proposal)
   - Who's the primary audience?
   - What's the desired impact?
   - Any template or format to follow?

2. **Encourage Info Dumping**
   - Background on project/problem
   - Related team discussions
   - Why alternatives aren't being used
   - Timeline pressures or constraints

3. **Ask Clarifying Questions**
   - Generate 5-10 questions based on gaps
   - Allow shorthand answers

### Stage 2: Refinement & Structure

1. **For Each Section:**
   - Ask clarifying questions about content
   - Brainstorm 5-20 options
   - User curates (keep/remove/combine)
   - Draft the section
   - Iterate with surgical edits

2. **Use `str_replace` for edits** - never reprint whole doc

3. **Quality Check** - After 3 iterations, ask if anything can be removed

### Stage 3: Reader Testing

1. **Predict Reader Questions** (5-10 questions)
2. **Test with Fresh Context** - no context bleed
3. **Check for:**
   - Ambiguity or unclear sections
   - Assumed knowledge
   - Internal contradictions
4. **Fix gaps** found during testing

## Error Handling

- If user wants to skip a stage, allow freeform work
- If context is missing, proactively ask
- Address gaps as they come up, don't accumulate

## Notes

- Quality over speed
- Each iteration should make meaningful improvements
- Goal: document that actually works for readers

Source: anthropics/skills
