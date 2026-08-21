# IP Intelligence Fusion

Use this skill for a single public IPv4 or IPv6 address that the operator owns, that is publicly
documented, or that the operator is explicitly authorized to investigate. The result is a
time-stamped evidence report for human review. It is not an identity lookup, an automatic
allow/deny decision, a location guarantee, or a platform-review tool.

## Mandatory boundaries

- Accept exactly one public IP. Reject hostnames, private addresses, reserved addresses, batches,
  customer login logs, account logs, cookies, device identifiers, and device fingerprints.
- Treat an IP as potentially personal information when it is linked with a person, account,
  customer, employee, or login record. Do not infer that command-line possession proves authority.
- Supported work is limited to owned/public/authorized asset checks, public-information
  verification, authorized security operations, abnormal-request triage, and provider delivery
  acceptance testing.
- Do not assist with unauthorized person investigation, bulk personal-IP collection, location
  spoofing, account farming, bulk registration, platform-review evasion, CAPTCHA or login bypass,
  access-control bypass, port scanning, exploitation, attacks, or proxy forwarding.
- Do not log in, submit forms, handle CAPTCHA, defeat rate limits, or use a mirror when reading a
  provider's public page. Stop when a page requires access beyond ordinary read-only viewing.

## Network consent workflow

1. Validate that the user supplied one public IP. If no IP is present, ask for it. Do not resolve a
   hostname on the user's behalf.
2. Start with local-only processing. The default CLI mode must not call a remote service. It may
   read a local evidence JSON file and render JSON, Markdown, or HTML.
3. Before any external query, explain the target IP, providers/domains, fields sent, and that the
   transfer may cross borders. Ask for explicit confirmation. This is an operational record, not
   proof of legal authorization.
4. Only after confirmation use `--external`. In an interactive terminal the CLI presents a `YES`
   prompt. In a non-interactive process pass `--confirm-external` as well. `--self` requires both
   flags; the IP discovery request is made only after confirmation.
5. Use the default `fast` profile unless the user explicitly requests `--profile comprehensive`.
   Do not silently expand the set of recipients.
6. If confirmation is absent or refused, produce a local report with `not-requested` source states
   where appropriate. Do not turn that state into `error`, zero risk, or a negative finding.

Examples:

```text
Local-only JSON:
python scripts/ip_intelligence.py 8.8.8.8 --format json

Interactive external lookup:
python scripts/ip_intelligence.py 8.8.8.8 --external --profile fast

Non-interactive external lookup:
python scripts/ip_intelligence.py 8.8.8.8 --external --confirm-external --format json
```

The removed `--include-raw` option must not be suggested or accepted.

## Provider and evidence rules

The CLI request layer permits only audited HTTPS hosts and rejects credentials in URLs, user
information, non-standard ports, and unapproved redirect destinations. The current domains and
collection methods are listed in [references/providers.md](references/providers.md).

IPinfo and AbuseIPDB credentials, when independently configured, are request headers. IPQualityScore,
Scamalytics, and ipdata API adapters are disabled; those services can appear only as validated
official public-page evidence. The old plaintext IP-API adapter is removed.

Public-page evidence must contain the exact target IP, an official HTTPS source URL, an observation
time, and only the allowlisted normalized fields. Do not include raw responses, `fn`, email,
abuse-contact, analysis, or personalized-hostname fields. Use the local evidence import only after
the host has actually observed the official page.

Keep these distinctions in every report:

- `success`: validated structured evidence was returned;
- `skipped`: an enabled provider needs a missing configured credential;
- `not-requested`: external collection was disabled, or an API adapter is intentionally disabled;
- `unavailable`: an experimental source could not be read or parsed;
- `error`: an enabled source failed validation, transport, or upstream processing.

Absence of evidence is not low risk. Numeric risk comes only from upstream numeric scores. Boolean
proxy, VPN, Tor, hosting, abuse, and bot signals remain contextual or unscored. Preserve provider
identity, consensus, alternatives, conflicts, and timestamps.

## Report handling

Generate the requested representation with the CLI. Reports may contain the complete IP, geographic
region, organization/ISP, allocation or route prefixes, and network-risk labels. Set restrictive
file permissions; do not place reports in public Issues, demo sites, public logs, or uncontrolled
shared storage. Delete them under the operator's retention schedule.

The JSON report must include `policy` metadata and the `data_policy` declaration. In external mode,
record `external-confirmed` and the provider domains that actually started a request. Reports must
not contain upstream raw payloads, contact details, credentials, or API keys. Never call an IP safe
based only on this report and never present it as proof of abuse.

## Completion brief

Return a concise summary in the user's language containing the normalized target, risk score or
`unknown`, confidence, contributing numeric sources, consensus facts, material conflicts, contextual
signals, source-state counts, timestamp, and absolute paths to generated reports. State that the
report is an aid for authorized human review, not a legal conclusion or an automatic platform
decision.

If a network is unavailable, preserve explicit provider failures and continue with local evidence.
If a public page is blocked or changes layout, keep it unavailable and report the gap. Do not invent
values or bypass the restriction.

## Compliance reminder

External requests may transmit an IP to a service provider outside China. The operator is responsible
for checking authorization, notice, lawful basis, personal-information handling, data-export
requirements, retention/deletion, and third-party terms. This skill and its MIT license are not
legal advice and cannot establish compliance by themselves. Future support for customer or account
logs requires a separate personal-information impact assessment and data-export design; it must not
be added directly to v2.0.
