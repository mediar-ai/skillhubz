# Hugging Face Evaluation

Add structured evaluation results to model cards with support for README extraction, Artificial Analysis API, and custom evaluations using vLLM/lighteval.

## Prerequisites

- uv (Python package manager)
- HF_TOKEN environment variable
- For Artificial Analysis: AA_API_KEY environment variable

## Instructions

### Workflow: Extract from README

```bash
# 1. Check for existing PRs first
uv run scripts/evaluation_manager.py get-prs --repo-id "username/model-name"

# 2. Inspect tables to find evaluation data
uv run scripts/evaluation_manager.py inspect-tables --repo-id "username/model"

# 3. Extract specific table (prints YAML)
uv run scripts/evaluation_manager.py extract-readme \
  --repo-id "username/model" \
  --table 1

# 4. Apply changes
uv run scripts/evaluation_manager.py extract-readme \
  --repo-id "username/model" \
  --table 1 \
  --create-pr  # or --apply for direct push
```

### Import from Artificial Analysis

```bash
AA_API_KEY="your-key" uv run scripts/evaluation_manager.py import-aa \
  --creator-slug "anthropic" \
  --model-name "claude-sonnet-4" \
  --repo-id "username/model-name" \
  --create-pr
```

### Run Custom Evaluations

**lighteval with vLLM:**
```bash
uv run scripts/lighteval_vllm_uv.py \
  --model meta-llama/Llama-3.2-1B \
  --tasks "leaderboard|mmlu|5"
```

**inspect-ai with vLLM:**
```bash
uv run scripts/inspect_vllm_uv.py \
  --model meta-llama/Llama-3.2-1B \
  --task mmlu
```

**Via HF Jobs:**
```bash
hf jobs uv run scripts/lighteval_vllm_uv.py \
  --flavor a10g-small \
  --secrets HF_TOKEN=$HF_TOKEN \
  -- --model meta-llama/Llama-3.2-1B \
     --tasks "leaderboard|mmlu|5"
```

### Hardware Recommendations

| Model Size | Hardware |
|------------|----------|
| < 3B params | t4-small |
| 3B - 13B | a10g-small |
| 13B - 34B | a10g-large |
| 34B+ | a100-large |

## Notes

- Always check for existing PRs before creating new ones
- Preview YAML output before applying changes
- vLLM provides 5-10x faster inference than standard methods

Source: huggingface/skills
