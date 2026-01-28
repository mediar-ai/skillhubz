# Hosted Agent Infrastructure

Build background agents in remote sandboxed environments with unlimited concurrency and multiplayer collaboration.

## Prerequisites

- Cloud infrastructure (Modal, Cloudflare, etc.)
- Understanding of containerization

## Instructions

### Architecture Layers

1. **Sandbox Infrastructure**: Isolated execution environments
2. **API Layer**: State management and client coordination
3. **Client Interfaces**: Web, Slack, Chrome extensions

### Image Registry Pattern

Pre-build environment images on regular cadence (every 30 minutes):

- Cloned repository at known commit
- All runtime dependencies installed
- Initial setup and build completed
- Cached files from running app once

Session start: Spin up sandbox from most recent image.

### Snapshot and Restore

Take filesystem snapshots at key points:
- After initial image build (base)
- When agent finishes changes (session)
- Before sandbox exit (follow-up)

### Speed Optimizations

**Predictive Warm-Up**: Start warming sandbox as user begins typing.

**Parallel File Reading**: Allow reads immediately, even if sync incomplete. Block edits until synchronized.

**Maximize Build-Time Work**: Move everything possible to image build step.

### Self-Spawning Agents

Create tools for agents to spawn new sessions:
- Research across different repositories
- Parallel subtask execution
- Multiple smaller PRs from one major task

### Multiplayer Support

- Data model must not tie sessions to single authors
- Pass authorship info to each prompt
- Share session links for instant collaboration

### Key Metrics

- Sessions resulting in merged PRs (primary)
- Time from session start to first model response
- PR approval rate and revision count

## Guidelines

1. Pre-build environment images on regular cadence
2. Start warming sandboxes when users begin typing
3. Allow file reads before git sync; block only writes
4. Structure framework as server-first with thin clients
5. Isolate state per session to prevent interference
6. Track merged PRs as primary success metric

## Notes

- Session speed should be limited only by model TTFT
- Multiplayer is nearly free with proper sync architecture
- Slack integration creates virality loop for adoption

Source: muratcankoylan/Agent-Skills-for-Context-Engineering
