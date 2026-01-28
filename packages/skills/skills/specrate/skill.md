# Specrate

Manage specs and changes to specs in a structured workflow for proposing, planning, implementing, and archiving changes.

## Prerequisites

- Git repository
- Understanding of spec-driven development

## Instructions

### Core Actions

Based on user intent, follow the appropriate action:

| Intent | Action |
|--------|--------|
| Show current status | SHOW-STATUS |
| Propose a new change | PROPOSE-CHANGE |
| Amend an existing change | AMEND-CHANGE |
| Plan a proposed change | PLAN-CHANGE |
| Implement a planned change | IMPLEMENT-CHANGE |
| Archive an implemented change | ARCHIVE-CHANGE |
| Fix a spec according to codebase | FIX-SPEC |

### Workflow

```
Propose → Plan → Implement → Archive
```

Each step has validation and documentation requirements.

### Directory Structure

All specrate artifacts reside in `.specrate/` at repository root:

```
.specrate/
├── specs/           # Current specifications
├── changes/         # Proposed and active changes
│   ├── proposed/
│   ├── planned/
│   └── implementing/
└── archive/         # Completed changes
```

### Handling Ambiguous Requests

- If intent mixes multiple actions: break down and confirm
- If intent is ambiguous (e.g., "update the spec"): ask clarifying questions with options

## Guidelines

1. Always ask for clarifications if needed
2. Ensure workspace remains consistent after each step
3. All artifacts MUST reside in `.specrate/` folder
4. Do NOT create auxiliary documents outside `.specrate/`
5. Provide concise options when asking for clarifications

## Notes

- Designed for structured change management
- Supports full change lifecycle tracking
- Maintains audit trail of all spec modifications

Source: rickygao/specrate
