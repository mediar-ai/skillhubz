# Hugging Face Jobs

Run any workload on fully managed Hugging Face infrastructure - data processing, batch inference, experiments, and scheduled tasks.

## Prerequisites

- HF_TOKEN environment variable
- Hugging Face Pro/Team/Enterprise plan

## Instructions

### Common Use Cases

- Data Processing - Transform, filter, analyze large datasets
- Batch Inference - Run inference on thousands of samples
- Experiments & Benchmarks - Reproducible ML experiments
- Model Training - Fine-tune models (see model-trainer skill for TRL)
- Scheduled Jobs - Automate recurring tasks

### UV Scripts (Recommended)

```python
hf_jobs("uv", {
    "script": """
# /// script
# dependencies = ["datasets", "transformers"]
# ///

from datasets import load_dataset
dataset = load_dataset("cais/mmlu", split="train[:100]")
print(f"Loaded {len(dataset)} examples")
""",
    "flavor": "cpu-basic",
    "timeout": "30m",
    "secrets": {"HF_TOKEN": "$HF_TOKEN"}
})
```

### Hardware Flavors

| Use Case | Flavor | Cost/hr |
|----------|--------|---------|
| Basic tasks | cpu-basic | ~$0.10 |
| Light GPU | t4-small | ~$0.75 |
| Medium GPU | a10g-small | ~$3.50 |
| Large GPU | a10g-large | ~$5.00 |
| Heavy compute | a100-large | ~$10.00 |

### CLI Commands

```bash
# Submit job from URL
hf jobs uv run \
  --flavor cpu-basic \
  --timeout 30m \
  --secrets HF_TOKEN \
  "https://example.com/script.py"

# Check status
hf jobs ps
hf jobs logs <job-id>
hf jobs inspect <job-id>
hf jobs cancel <job-id>
```

### Important Notes

- Jobs run in isolated Docker containers
- Local file paths don't work - use inline code or URLs
- Always set timeout (default 30min may be too short)
- Use `secrets` parameter to pass HF_TOKEN for Hub access
- Results are lost unless pushed to Hub

## Notes

- For model training, see the huggingface-model-trainer skill
- Uses PEP 723 inline dependencies
- Supports CPU, GPU, and TPU hardware

Source: huggingface/skills
