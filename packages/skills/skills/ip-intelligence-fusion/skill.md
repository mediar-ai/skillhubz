---
name: ip-intelligence-fusion
description: Investigate a supplied public IPv4 or IPv6 address and create an auditable multi-source ownership, routing, geolocation, proxy/VPN/Tor, abuse, fraud, hosting, reputation, and purity assessment.
---

# IP Intelligence Fusion

Use the complete implementation from https://github.com/GetIPProxy/ip-intelligence-fusion.

## Requirements

- Require exactly one explicitly supplied public IPv4 or IPv6 address.
- Reject hostnames and private, loopback, link-local, reserved, multicast, or unspecified addresses.
- Use Python 3.9 or later.
- Never request, reveal, or transmit API keys.
- Treat unavailable evidence as unknown, never as zero risk.

## Workflow

1. Clone or install the complete repository so that scripts, references, and assets remain together.
2. Read `references/methodology.md` before interpreting evidence.
3. Read `references/providers.md` when selecting or diagnosing sources.
4. Run `python scripts/ip_intelligence.py <PUBLIC_IP> --report-dir <REPORT_DIR> --language en`.
5. Use `--language zh-CN` when Chinese output is requested.
6. Preserve every provider state: success, skipped, unavailable, or error.
7. If read-only browser access exists, follow `references/public-pages.md` for validated official-page fallback.
8. Never infer locked, missing, or unverified values.
9. Deliver the JSON evidence file, self-contained HTML report, and a concise evidence brief.

## Interpretation

- Only upstream numeric scores participate in the weighted composite.
- Keep boolean proxy, VPN, Tor, hosting, bot, blacklist, and abuse signals unscored.
- Keep registry country separate from geolocation country.
- Keep registry allocation prefix separate from announced BGP route prefix.
- Hosting, VPN, proxy, or Tor classification is not proof of abuse.
- Describe the result as an investigation aid, not an automatic allow/deny verdict.

## Failure handling

- If network access is blocked, generate the report using available evidence and retain provider failures.
- If no numeric source succeeds, report numeric risk as unknown.
- If public-page evidence cannot be verified against the exact target IP, discard it.
- Do not invent provider responses, files, scores, or capabilities.

Full documentation, renderer, deterministic collector, and tests: https://github.com/GetIPProxy/ip-intelligence-fusion

Support: hello@getipproxy.com
