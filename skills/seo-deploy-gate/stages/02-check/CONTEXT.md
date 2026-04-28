# Stage 2: Check

Run the 8 rules against the change context. Accumulate findings. Determine overall severity.

## Inputs
- `change_context.json` from stage 01

## Process

### Pre-flight: Rule 6 carve-out
If `changeType` contains ONLY `quality-fix` (no structural, market-removal, market-entry), return:
```
{ severity: "PASS", findings: [{ rule: "Rule 6", severity: "PASS", message: "Quality fix carve-out — structural rules skipped" }] }
```
Skip rules 1-5 and 8. Go directly to stage 03 with PASS.

### Run each rule in order

For each rule (1, 2, 3, 4, 5, 7, 8 — skip 6 as it's the carve-out), call the check function in `lib/check-{rule-slug}.js`:

```javascript
const findings = [];
for (const ruleName of ['eight-week', 'link-audit', 'strategic-intent', 'ux-preview', 'deploy-size', 'tracker-log', 'eval-window']) {
  const rule = require(`../lib/check-${ruleName}`);
  const result = await rule(changeContext);
  if (result.severity !== 'PASS') findings.push(result);
}
```

Each rule returns:
```json
{
  "rule": "Rule 1 — 8-week rule",
  "severity": "BLOCK" | "WARN" | "PASS",
  "message": "NV/SC pages added 2026-03-13 (4 weeks ago), cannot reverse yet",
  "evidence": {
    "trackerRow": 7,
    "urlsAffected": ["/bathroom-safety-las-vegas-nv"],
    "daysOld": 28
  }
}
```

### Determine overall severity
- If ANY finding has severity `BLOCK` → overall BLOCK (unless `--force` set)
- Else if ANY finding has severity `WARN` → overall WARN
- Else → PASS

### Handle force override
If `forceOverride: true`:
- Overall severity becomes PASS (deploy proceeds)
- All BLOCK findings preserved in output so they're logged
- Add finding: `{ rule: "FORCE OVERRIDE", severity: "FORCED", message: forceReason }`

### Fail-fast option
The default runs all rules to gather complete findings. Pipelines can opt into fail-fast with env var `GATE_FAIL_FAST=true` — stops at first BLOCK. Still logs the single finding.

## Outputs

Write `check_results.json`:
```json
{
  "overallSeverity": "BLOCK",
  "forceOverride": false,
  "findings": [
    {
      "rule": "Rule 1 — 8-week rule",
      "severity": "BLOCK",
      "message": "...",
      "evidence": { ... }
    },
    {
      "rule": "Rule 3 — Strategic intent",
      "severity": "BLOCK",
      "message": "...",
      "evidence": { ... }
    }
  ],
  "passedRules": ["Rule 6", "Rule 7", "Rule 8"],
  "changeContext": { /* from stage 01, passed through */ }
}
```

Return to stage 03.
