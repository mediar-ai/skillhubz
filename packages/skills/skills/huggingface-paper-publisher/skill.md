# Hugging Face Paper Publisher

Publish and manage research papers on Hugging Face Hub with arXiv integration, model/dataset linking, and authorship management.

## Prerequisites

- huggingface_hub, pyyaml, requests, markdown
- HF_TOKEN environment variable

## Instructions

### Index Paper from arXiv

```bash
# Check if paper exists
uv run scripts/paper_manager.py check --arxiv-id "2301.12345"

# Index paper on HF
uv run scripts/paper_manager.py index --arxiv-id "2301.12345"
```

### Link Paper to Model/Dataset

```bash
# Link to model
uv run scripts/paper_manager.py link \
  --repo-id "username/model-name" \
  --repo-type "model" \
  --arxiv-id "2301.12345"

# Link to dataset
uv run scripts/paper_manager.py link \
  --repo-id "username/dataset-name" \
  --repo-type "dataset" \
  --arxiv-id "2301.12345"

# Link multiple papers
uv run scripts/paper_manager.py link \
  --repo-id "username/model-name" \
  --repo-type "model" \
  --arxiv-ids "2301.12345,2302.67890"
```

### Claim Authorship

```bash
uv run scripts/paper_manager.py claim \
  --arxiv-id "2301.12345" \
  --email "your.email@institution.edu"
```

### Manage Paper Visibility

```bash
# List your papers
uv run scripts/paper_manager.py list-my-papers

# Toggle visibility on profile
uv run scripts/paper_manager.py toggle-visibility \
  --arxiv-id "2301.12345" \
  --show true
```

### Create Research Article

```bash
# Create from template
uv run scripts/paper_manager.py create \
  --template "modern" \
  --title "Your Paper Title" \
  --authors "Jane Doe, John Smith" \
  --output "paper.md"

# Convert to HTML
uv run scripts/paper_manager.py convert \
  --input "paper.md" \
  --output "paper.html" \
  --style "modern"
```

### Templates

- `standard` - Traditional scientific paper
- `modern` - Clean, web-friendly (Distill-style)
- `arxiv` - arXiv formatting
- `ml-report` - ML experiment report

## Notes

- Hub auto-generates `arxiv:<PAPER_ID>` tags from links
- Paper pages show all models/datasets citing the paper
- Compatible with tfrere's research article template

Source: huggingface/skills
