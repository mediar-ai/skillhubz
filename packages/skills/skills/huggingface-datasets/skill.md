# Hugging Face Datasets

Create and manage datasets on Hugging Face Hub with SQL-based querying, transformation, and streaming row updates.

## Prerequisites

- uv (Python package manager)
- HF_TOKEN environment variable with Write-access token

## Instructions

### Core Capabilities

1. **SQL-Based Querying** - Query any HF dataset using DuckDB SQL via `hf://` protocol
2. **Dataset Creation** - Initialize repos, configure metadata, stream row updates
3. **Multi-Format Support** - Chat, classification, QA, completion, tabular templates
4. **Export & Push** - Save results locally or push to new Hub repos

### Quick Start: SQL Queries

```bash
# Query a dataset
uv run scripts/sql_manager.py query \
  --dataset "cais/mmlu" \
  --sql "SELECT * FROM data WHERE subject='nutrition' LIMIT 10"

# Get dataset schema
uv run scripts/sql_manager.py describe --dataset "cais/mmlu"

# Sample random rows
uv run scripts/sql_manager.py sample --dataset "cais/mmlu" --n 5

# Count with filter
uv run scripts/sql_manager.py count --dataset "cais/mmlu" --where "subject='nutrition'"
```

### Transform and Push

```bash
# Query and push to new dataset
uv run scripts/sql_manager.py query \
  --dataset "cais/mmlu" \
  --sql "SELECT * FROM data WHERE subject='nutrition'" \
  --push-to "username/mmlu-nutrition-subset" \
  --private

# Export to local file
uv run scripts/sql_manager.py export \
  --dataset "cais/mmlu" \
  --sql "SELECT * FROM data LIMIT 100" \
  --output "sample.parquet" \
  --format parquet
```

### Create New Datasets

```bash
# Initialize repository
uv run scripts/dataset_manager.py init --repo_id "your-username/dataset-name" --private

# Quick setup with template
uv run scripts/dataset_manager.py quick_setup \
  --repo_id "your-username/dataset-name" \
  --template classification

# Add rows with template validation
uv run scripts/dataset_manager.py add_rows \
  --repo_id "your-username/dataset-name" \
  --template qa \
  --rows_json "$(cat your_qa_data.json)"
```

### Templates

- `chat` - Multi-turn dialogues with tool usage
- `classification` - Text classification with labels
- `qa` - Question-answering pairs
- `completion` - Text completion prompts
- `tabular` - Structured data

## Notes

- Uses PEP 723 scripts with inline dependency management
- DuckDB `hf://` protocol provides direct dataset access
- Integrates with HF MCP Server for discovery

Source: huggingface/skills
