---
name: ip-intelligence-fusion
description: Investigate a supplied public IPv4 or IPv6 address across 12 sources and create auditable ownership, routing, geolocation, reputation, proxy/VPN/Tor, abuse, fraud, hosting, and network-risk evidence for e-commerce, social, advertising, SEO, research, AI, live-streaming, and operations workflows.
---

# IP地址归属、信誉、风控查询 1.4.2

Use the complete implementation from https://github.com/GetIPProxy/ip-intelligence-fusion. The Chinese README covers cross-border stores, account matrices, advertising QA, local SEO, market and price research, brand protection, website testing, travel comparison, AI accounts, live commerce, browser profiles, and proxy/log operations.

## Requirements

- Require exactly one explicitly supplied public IPv4 or IPv6 address.
- Reject hostnames and private, loopback, link-local, reserved, multicast, or unspecified addresses.
- Use Python 3.9 or later; no third-party Python packages are required.
- Never request, reveal, or transmit API keys.
- Treat unavailable evidence as unknown, never as zero risk.

## Workflow

1. Clone or install the complete repository so that scripts, references, and assets remain together.
2. Read `references/methodology.md` before interpreting evidence.
3. Read `references/providers.md` when selecting or diagnosing sources.
4. Run `python scripts/ip_intelligence.py <PUBLIC_IP> --report-dir <REPORT_DIR> --language en`.
5. Use `--language zh-CN` when Chinese output is requested.
6. Choose `--profile fast`, `--profile resilient`, or the default `--profile comprehensive` to match latency and coverage needs; bounded transient retries are recorded in diagnostics.
7. Preserve every provider state: success, skipped, unavailable, or error.
8. If read-only browser access exists, follow `references/public-pages.md` for validated official-page fallback.
9. Never infer locked, missing, or unverified values.
10. Deliver the JSON evidence file, self-contained HTML report, and a concise evidence brief.

## Where it helps

Use the IP evidence to review network conditions for cross-border e-commerce stores and store matrices, TikTok and social-media account matrices, advertising operations and landing-page QA, local SEO and SERP monitoring, market research, competitor observation and price checks, brand protection, website testing, travel and local-service comparison, AI accounts and team seats, cross-border live commerce, anti-detect browser or cloud-device profiles, proxy resources, supplier resources, login logs, and customer access IPs. It supports investigation and comparison; it does not guarantee account, advertising, streaming, or business outcomes.

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

Full documentation, renderer, deterministic collector, offline HTML evidence matrix, and tests: https://github.com/GetIPProxy/ip-intelligence-fusion

Support: hello@getipproxy.com
