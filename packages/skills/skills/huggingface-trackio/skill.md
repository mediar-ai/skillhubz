# Hugging Face Trackio

Track and visualize ML training experiments with real-time dashboards synced to Hugging Face Spaces.

## Prerequisites

- trackio package (`pip install trackio`)
- HF_TOKEN for Space syncing

## Instructions

### Two Interfaces

| Task | Interface |
|------|-----------|
| Logging metrics during training | Python API |
| Retrieving metrics after/during | CLI |

### Python API: Logging

```python
import trackio

# Initialize tracking
trackio.init(project="my-project", space_id="username/trackio")

# Log metrics
trackio.log({"loss": 0.1, "accuracy": 0.9})
trackio.log({"loss": 0.09, "accuracy": 0.91})

# Finalize
trackio.finish()
```

### With TRL Integration

```python
from trl import SFTConfig

config = SFTConfig(
    report_to="trackio",
    project="my-project",
    run_name="sft-experiment-1",
    # ... other config
)
```

### CLI: Retrieving Metrics

```bash
# List projects
trackio list projects --json

# List runs in project
trackio list runs --project my-project --json

# Get specific metric
trackio get metric --project my-project --run my-run --metric loss --json

# Launch dashboard
trackio show

# Sync to HF Space
trackio sync --space-id username/trackio
```

### Key Concepts

**For remote/cloud training:** Pass `space_id` so metrics sync to a Space dashboard and persist after the instance terminates.

**For local training:** Metrics stored locally, use `trackio show` to view dashboard.

### JSON Output

Add `--json` flag for programmatic output:

```bash
trackio list projects --json
trackio get metric --project my-project --run run-1 --metric loss --json
```

## Notes

- Metrics sync to HF Spaces for persistence
- Use `run_name` for descriptive experiment names
- Group related runs under the same `project`

Source: huggingface/skills
