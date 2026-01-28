# MCP Builder

Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools.

## Prerequisites

- TypeScript (recommended) or Python
- Node.js 18+ for TypeScript, Python 3.10+ for Python
- Understanding of async/await patterns
- Familiarity with API integration

## Instructions

1. **Phase 1: Research and Planning**
   - Study MCP Protocol: Start with `https://modelcontextprotocol.io/sitemap.xml`
   - Understand the API you're integrating
   - Plan tool selection prioritizing comprehensive API coverage

2. **Phase 2: Set Up Project**

   For TypeScript (recommended):
   ```bash
   npm init -y
   npm install @modelcontextprotocol/sdk zod
   ```

   For Python:
   ```bash
   pip install mcp pydantic
   ```

3. **Implement Core Infrastructure**
   - API client with authentication
   - Error handling helpers with actionable messages
   - Response formatting (JSON/Markdown)
   - Pagination support

4. **Implement Tools**

   Each tool needs:
   - **Input Schema**: Use Zod (TypeScript) or Pydantic (Python)
   - **Output Schema**: Define `outputSchema` for structured data
   - **Clear Description**: Concise summary with parameter descriptions
   - **Annotations**: readOnlyHint, destructiveHint, idempotentHint

   ```typescript
   server.registerTool({
     name: "github_create_issue",
     description: "Create a new issue in a GitHub repository",
     inputSchema: z.object({
       repo: z.string().describe("Repository in owner/name format"),
       title: z.string().describe("Issue title"),
       body: z.string().optional()
     }),
     annotations: { destructiveHint: false, idempotentHint: false }
   });
   ```

5. **Phase 3: Test**
   ```bash
   # TypeScript
   npm run build
   npx @modelcontextprotocol/inspector

   # Python
   python -m py_compile your_server.py
   ```

6. **Phase 4: Create Evaluations**
   - Create 10 complex, realistic test questions
   - Each question should require multiple tool calls
   - Verify answers are stable and verifiable

## Error Handling

- Return actionable error messages that guide toward solutions
- Include specific suggestions and next steps
- Handle rate limiting gracefully

## Notes

- Use consistent tool naming prefixes (e.g., `github_create_issue`)
- Balance API coverage with workflow convenience tools
- Transport: Streamable HTTP for remote, stdio for local
- Return both text content and structured data

Source: anthropics/skills
