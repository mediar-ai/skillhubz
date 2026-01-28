# Hugging Face Tool Builder

Build reusable command-line scripts and utilities for the Hugging Face API with support for chaining, piping, and automation.

## Prerequisites

- HF_TOKEN environment variable for API access
- Shell (bash), Python, or TypeScript for scripts

## Instructions

### Script Rules

1. Scripts must support `--help` argument
2. Use `HF_TOKEN` environment variable for authentication
3. Prefer shell scripts; use Python/TypeScript for complexity
4. Test non-destructive scripts before delivery
5. Share usage examples

### API Endpoints

```
/api/models      - Model search and metadata
/api/datasets    - Dataset search and metadata
/api/spaces      - Space search and metadata
/api/collections - Collection management
/api/daily_papers - Daily paper updates
/api/trending    - Trending content
/api/whoami-v2   - User information
```

### Example: Query API

```bash
# Get all endpoints
curl -s "https://huggingface.co/.well-known/openapi.json" | jq '.paths | keys'

# Search models
curl -H "Authorization: Bearer ${HF_TOKEN}" \
  "https://huggingface.co/api/models?search=llama&limit=5"

# Get model details
curl -H "Authorization: Bearer ${HF_TOKEN}" \
  "https://huggingface.co/api/models/meta-llama/Llama-2-7b"
```

### Composable Pipelines

```bash
# Get top 10 models by downloads
./baseline_hf_api.sh 50 | \
  jq '[.[] | {id, downloads}] | sort_by(.downloads) | reverse | .[:10]'

# Enrich model IDs with metadata
printf '%s\n' model1 model2 | ./hf_enrich_models.sh | jq -s '.'

# Extract model card frontmatter
printf '%s\n' meta-llama/Llama-2-7b | ./hf_model_card_frontmatter.sh
```

### HF CLI Commands

```bash
hf download <repo> <file>     # Download files
hf upload <repo> <file>       # Upload files
hf repo create <name>         # Create repository
hf repo-files list <repo>     # List repo files
hf jobs ps                    # List jobs
```

### Reference Scripts

- `baseline_hf_api.sh` - Simple API query (bash)
- `baseline_hf_api.py` - Simple API query (Python)
- `hf_enrich_models.sh` - Enrich model IDs with metadata
- `hf_model_papers_auth.sh` - Fetch papers with auth
- `find_models_by_paper.sh` - Search models by paper

## Notes

- Do not read openapi.json directly (too large) - use jq to extract
- Always use HF_TOKEN for higher rate limits
- Prefer streaming JSON (NDJSON) for large outputs

Source: huggingface/skills
