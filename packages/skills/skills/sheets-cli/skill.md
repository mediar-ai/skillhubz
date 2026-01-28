# Google Sheets CLI

Read, write, and update Google Sheets data via CLI with primitives for tables, rows, and cells.

## Prerequisites

- `sheets-cli` installed and in PATH
- Google Sheets API credentials configured

## Instructions

### Quick Reference

```bash
# Find spreadsheet by name
sheets-cli sheets find --name "Projects"

# List sheets/tabs
sheets-cli sheets list --spreadsheet <id-or-url>

# Read table data
sheets-cli read table --spreadsheet <id> --sheet "Sheet1" --limit 100

# Update by key column (preferred - rows can shift)
sheets-cli update key --spreadsheet <id> --sheet "Projects" \
  --key-col "Name" --key "Acme" --set '{"Status":"Done"}'

# Append row
sheets-cli append --spreadsheet <id> --sheet "Projects" \
  --values '{"Name":"NewCo","Status":"Active"}'
```

### Workflow Pattern

Always follow **read → decide → dry-run → apply**:

```bash
# 1. Understand current state
sheets-cli read table --sheet "Tasks" --limit 100

# 2. Dry-run first
sheets-cli update key --sheet "Tasks" --key-col "ID" --key "TASK-42" \
  --set '{"Status":"Complete"}' --dry-run

# 3. Apply if dry-run looks correct
sheets-cli update key --sheet "Tasks" --key-col "ID" --key "TASK-42" \
  --set '{"Status":"Complete"}'
```

### Commands

| Command | Description |
|---------|-------------|
| `sheets find` | Find spreadsheet by name |
| `sheets list` | List tabs in spreadsheet |
| `read table` | Read table with headers |
| `update key` | Update row by key column |
| `update index` | Update row by index |
| `append` | Add new row |
| `batch` | Multiple operations |

## Guidelines

1. Always read before writing to understand current state
2. Use key-based updates (rows can shift)
3. Dry-run before applying changes
4. Use JSON format for values
5. Specify spreadsheet by ID or URL

## Notes

- Pre-installed and available in PATH
- Supports batch operations for efficiency
- Key-column updates are safer than index-based

Source: gmickel/sheets-cli
