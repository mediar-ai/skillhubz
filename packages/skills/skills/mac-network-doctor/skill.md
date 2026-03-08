---
name: mac-network-doctor
description: Diagnose and fix slow internet on macOS. Finds hidden bandwidth drains — VPNs (Cloudflare WARP, system VPN configs), iCloud sync (Desktop & Documents syncing dev projects), Spotlight indexing node_modules, background software updates. Especially useful on limited bandwidth (hotspot, tethering, slow Wi-Fi). Use when user says "internet is slow", "why is my connection slow", "fix network", "check bandwidth usage", "what's eating my bandwidth", "optimize network", "hotspot is slow", or any macOS network troubleshooting.
---

# Mac Network Doctor

Diagnose and fix slow macOS internet by finding hidden bandwidth and resource drains.

## Workflow

Run phases sequentially. Present findings after each phase and confirm before making changes.

### Phase 1: Diagnose

Run `scripts/diagnose.sh` from the skill directory:
```bash
bash <skill-dir>/scripts/diagnose.sh
```

Parse the output sections and present a summary table:

| Check | Status | Impact |
|-------|--------|--------|
| VPNs | Found / None | High — adds latency to all traffic |
| iCloud sync | Active / Idle | High — constant upload/download |
| Desktop/Docs iCloud | Synced / Local | High — dev projects generate churn |
| iCloud node_modules | N found, X MB | Medium — unnecessary sync traffic |
| Spotlight indexing | N workers, X% CPU | Medium — triggers iCloud downloads |
| Dev dirs unprotected | N missing index | Low-Medium — Spotlight indexes junk |
| Software Update | Running / Idle | Low-Medium — can download GBs |
| Ping latency | Xms avg, Y% loss | Baseline measurement |

### Phase 2: Fix

Ask user which issues to fix. For each, see `references/fixes.md`.

**Fix priority order** (highest impact first):

1. **VPNs** — Disconnect/remove VPN proxies (WARP, etc.) that add latency
2. **iCloud Desktop & Documents sync** — Disable via System Settings (requires macOS automation MCP). This is the single biggest hidden drain for developers
3. **iCloud node_modules** — Delete node_modules from `~/Library/Mobile Documents/`
4. **Spotlight exclusions** — Add `.metadata_never_index` to dev artifact dirs
5. **Persistent protection** — Add shell wrappers to `~/.zshrc` for package managers

**Important**: Always confirm before destructive actions (deleting files, removing VPNs, changing iCloud settings).

### Phase 3: Prevent

After fixes, set up persistent protections:

1. Check if `~/.zshrc` already has `_spotlight_exclude_node_modules` function
2. If not, detect installed package managers (`which npm bun pnpm yarn`)
3. Append wrappers only for installed package managers
4. Verify by sourcing: `source ~/.zshrc`

### Phase 4: Verify

Run the traffic check again:
```bash
nettop -m tcp -J bytes_in,bytes_out -l 1 -t wifi 2>/dev/null | sort -t, -k2 -rn | head -20
```

Also check:
```bash
ps aux | grep -i '[c]loudd\|[b]ird\|[c]loudphoto' | awk '{printf "%s%% CPU  %s\n", $3, $11}'
ping -c 5 8.8.8.8
```

Present a before/after comparison if baseline was captured.

## Key gotchas

- `warp-cli status` may show "Disconnected" but WARP daemon still runs as root — check `ps aux | grep CloudflareWARP`
- Desktop & Documents iCloud sync cannot be disabled via CLI — must use System Settings GUI (macOS automation MCP)
- `mdutil -d` only works on volumes, not directories — use `.metadata_never_index` files for per-directory exclusion
- System extensions (VPN network extensions) are SIP-protected — removing the parent app or VPN config deactivates them
- AWDL (`awdl0`) is Apple's peer-to-peer Wi-Fi (AirDrop, Sidecar) — it doesn't use internet bandwidth but can cause radio interference

## Resources

- **scripts/diagnose.sh** — Run to collect all diagnostic data in one pass
- **references/fixes.md** — Detailed fix commands for each issue type
