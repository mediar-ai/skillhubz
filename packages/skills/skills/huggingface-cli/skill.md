# HuggingFace CLI

Execute Hugging Face Hub operations using the `hf` CLI for downloading models/datasets, uploading files, managing repositories, cache, and cloud compute.

## Prerequisites

- HuggingFace CLI installed: `pip install huggingface_hub`
- HF account and token for authenticated operations
- `hf auth login` completed

## Instructions

1. **Authentication**
   ```bash
   hf auth login                    # Interactive login
   hf auth login --token $HF_TOKEN  # Non-interactive
   hf auth whoami                   # Check current user
   ```

2. **Download models and datasets**
   ```bash
   hf download <repo_id>                           # Full repo to cache
   hf download <repo_id> --local-dir ./models      # To local directory
   hf download <repo_id> --include "*.safetensors" # Filter by pattern
   hf download <repo_id> --repo-type dataset       # Dataset
   ```

3. **Upload files**
   ```bash
   hf upload <repo_id> . .                         # Current dir to root
   hf upload <repo_id> ./models /weights           # Folder to path
   hf upload <repo_id> . . --repo-type dataset     # Dataset
   hf upload <repo_id> . . --create-pr             # Create PR
   ```

4. **Repository management**
   ```bash
   hf repo create <name>                           # Create model repo
   hf repo create <name> --repo-type dataset       # Create dataset
   hf repo create <name> --private                 # Private repo
   hf repo delete <repo_id>                        # Delete repo
   hf repo tag create <repo_id> v1.0               # Create tag
   ```

5. **Cache management**
   ```bash
   hf cache ls                      # List cached repos
   hf cache rm model/gpt2           # Remove cached repo
   hf cache prune                   # Remove detached revisions
   ```

6. **Browse Hub**
   ```bash
   hf models ls                                    # List trending models
   hf models ls --search "llama" --limit 20       # Search models
   hf datasets ls                                  # List datasets
   hf spaces ls                                    # List spaces
   ```

7. **Cloud compute (Jobs)**
   ```bash
   hf jobs run python:3.12 python script.py       # Run on CPU
   hf jobs run --flavor a10g-small <image> <cmd>  # Run on GPU
   hf jobs ps                                      # List jobs
   hf jobs logs <job_id>                          # View logs
   ```

## Error Handling

- If authentication fails, run `hf auth login` again
- For permission errors, check token scope
- For large uploads, use `hf upload-large-folder`

## Notes

- Key options: `--repo-type` (model/dataset/space), `--revision`, `--quiet`
- GPU flavors: cpu-basic, t4-small, a10g-small, a100-large, h100
- Use `--quiet` for scripts to get only paths/URLs

Source: huggingface/skills
