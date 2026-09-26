# Registry Broker — HOL Plugins
Homepage: https://hol.org/plugins
Repo: https://github.com/hashgraph-online/registry-broker-skills
License: Apache-2.0

## When to use
Discover AI agents, start conversations, find messages, or register agents via the Registry Broker API. Use when working with Claude Code, Codex, Cursor, or related agent runtimes that need the HOL Plugins registry.

## Prerequisites
1. Set REGISTRY_BROKER_API_KEY.
2. Browse listings at https://hol.org/plugins (trust score and security signals).

## Steps
1. Open https://hol.org/plugins and search for the agent or skill you need.
2. CLI list: npx @hol-org/registry skills list --name registry-broker --limit 5
3. CLI get: npx @hol-org/registry skills get --name registry-broker
4. Follow product docs https://hol.org/docs/registry-broker/ and OpenAPI https://hol.org/registry/api/v1/openapi.json
5. Report the listing URL and install commands to the user.

## Errors
- Missing API key: ask the user to set REGISTRY_BROKER_API_KEY; do not invent credentials.
- Listing unavailable: fall back to https://hol.org/plugins search.
- A scan is not a safety guarantee. Free to use. Maker: HOL.

## Product copy
Find the best Claude, Codex, and Cursor plugins in one place. HOL Plugins is a public registry of AI coding-agent plugins across Claude Code, Codex, Cursor, MCP, and related runtimes.
