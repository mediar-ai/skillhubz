# Hugging Face Model Trainer

Train language models using TRL (Transformer Reinforcement Learning) on Hugging Face Jobs infrastructure.

## Prerequisites

- HF_TOKEN environment variable with write permissions
- Hugging Face Pro/Team/Enterprise plan
- Dataset on Hub or loadable via datasets library

## Instructions

### Training Methods

- **SFT** - Supervised Fine-Tuning for instruction tuning
- **DPO** - Direct Preference Optimization from preference data
- **GRPO** - Group Relative Policy Optimization (online RL)
- **Reward Modeling** - Train reward models for RLHF

### Quick Start: SFT Training

```python
hf_jobs("uv", {
    "script": """
# /// script
# dependencies = ["trl>=0.12.0", "peft>=0.7.0", "trackio"]
# ///

from datasets import load_dataset
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

dataset = load_dataset("trl-lib/Capybara", split="train")

trainer = SFTTrainer(
    model="Qwen/Qwen2.5-0.5B",
    train_dataset=dataset,
    peft_config=LoraConfig(r=16, lora_alpha=32),
    args=SFTConfig(
        output_dir="my-model",
        push_to_hub=True,
        hub_model_id="username/my-model",
        num_train_epochs=3,
        report_to="trackio",
    )
)
trainer.train()
trainer.push_to_hub()
""",
    "flavor": "a10g-large",
    "timeout": "2h",
    "secrets": {"HF_TOKEN": "$HF_TOKEN"}
})
```

### Hardware Selection

| Model Size | Hardware | Cost/hr |
|------------|----------|---------|
| <1B params | t4-small | ~$0.75 |
| 1-3B | t4-medium | ~$1.50 |
| 3-7B | a10g-large | ~$5.00 |
| 7-13B | a100-large | ~$10.00 |

### Critical Settings

1. **Timeout** - Default 30min is too short. Use 1-2+ hours
2. **Hub Push** - Set `push_to_hub=True` and `hub_model_id`
3. **Secrets** - Include `secrets={"HF_TOKEN": "$HF_TOKEN"}`
4. **Trackio** - Add for real-time monitoring

### Dataset Validation

Validate format before training to prevent failures:

```bash
uv run scripts/dataset_inspector.py \
  --dataset "username/dataset-name" \
  --split "train"
```

### GGUF Conversion

Convert trained models for local inference (Ollama, LM Studio):

```python
hf_jobs("uv", {
    "script": "<conversion script>",
    "flavor": "a10g-large",
    "timeout": "45m",
    "env": {
        "ADAPTER_MODEL": "username/my-model",
        "BASE_MODEL": "Qwen/Qwen2.5-0.5B",
        "OUTPUT_REPO": "username/my-model-gguf"
    }
})
```

## Notes

- Jobs are asynchronous - check status with `hf_jobs("logs", {"job_id": "..."})`
- Environment is ephemeral - must push to Hub or results are lost
- Use LoRA/PEFT for models >7B to reduce memory

Source: huggingface/skills
