# BIMI SVG Tiny P/S Corpus Validator

Use the public makeBIMI SVG Tiny P/S Test Corpus to evaluate an SVG against its evidence-bound fixture rules and to report the result clearly.

## Inputs

Accept either an SVG file, an SVG URL, or raw SVG markup. If the source cannot be retrieved or parsed as XML, stop and report that limitation.

## Authoritative corpus

1. Retrieve the current manifest from `https://makebimi.com/public/test-corpus/v1/manifest.json`.
2. Record `schema_version`, `corpus_version`, and `released` from the manifest in the result.
3. Treat the manifest fixture IDs, expected outcomes, rule IDs, descriptions, and source URLs as the corpus definition for this run.

## Validation procedure

1. Parse the candidate as XML and identify the root `svg` element.
2. Evaluate the candidate against the manifest’s evidence-bound profile rules. At minimum, inspect the root namespace, `version`, `baseProfile`, root-level non-empty `title`, prohibited root `x` and `y` attributes, scripting, animation, raster `image` elements, linking, and external references.
3. Compare each detected condition to the corresponding fixture rule ID and expected outcome in the manifest.
4. Separate outcomes into:
   - **Profile failure**: a rule represented by a failing corpus fixture is violated.
   - **Informational pass**: an optional or informational corpus condition is present without creating a profile failure.
   - **Receiver-specific guidance**: a manifest item is labelled `receiver-guidance-warning`; report it separately and do not turn it into a universal SVG Tiny P/S failure.
   - **Unverified**: the supplied input or available parser cannot establish the condition.
5. Preserve the exact corpus rule IDs in the output. Do not invent additional rules or silently apply receiver guidance as a universal profile requirement.

## Required output

Return a compact structured report with these fields:

```json
{
  "corpus": {
    "schema_version": "",
    "corpus_version": "",
    "released": "",
    "manifest_url": "https://makebimi.com/public/test-corpus/v1/manifest.json"
  },
  "input": {
    "source_type": "file | url | markup",
    "retrieval_status": ""
  },
  "profile_result": "pass | fail | unverified",
  "profile_findings": [
    {"rule_id": "", "status": "pass | fail | unverified", "evidence": ""}
  ],
  "receiver_guidance": [
    {"rule_id": "", "status": "warning | clear | unverified", "evidence": ""}
  ],
  "limits": [
    "This corpus is an implementation aid, not a certification authority decision.",
    "A passing result does not predict inbox logo display or replace receiver review.",
    "Receiver-specific guidance is reported separately from evidence-bound profile rules."
  ]
}
```

## Safety and accuracy limits

Do not state that an SVG is certified, that a VMC or CMC has been issued, or that a receiver will display a logo. Do not infer DMARC policy, certificate status, trademark rights, or DNS configuration from the SVG alone. When a condition is outside the manifest or cannot be verified from the supplied SVG, identify it as unverified rather than guessing.

## References

- Corpus manifest: `https://makebimi.com/public/test-corpus/v1/manifest.json`
- BIMI Group SVG guidance: `https://bimigroup.org/creating-bimi-svg-logo-files/`
- Google Workspace BIMI SVG guidance: `https://knowledge.workspace.google.com/admin/security/create-a-bimi-svg-file-detailed-steps`
- SVG Tiny P/S Internet-Draft: `https://www.ietf.org/archive/id/draft-svg-tiny-ps-abrotman-04.html`
