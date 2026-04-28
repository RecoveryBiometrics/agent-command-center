# Exit Codes Contract

The gate returns one of three exit codes. Pipelines and agents MUST check this before proceeding with deploy.

## 0 — PASS

**Meaning:** All rules passed. Deploy is safe to proceed.

**What the gate did:**
- Ran all 8 rules against the current change set
- None fired at BLOCK or WARN severity
- Logged a "Passed" row to tracker sheet

**Caller should:** Proceed with deploy.

---

## 1 — WARN

**Meaning:** One or more rules fired at WARN severity. Deploy allowed, but risk noted.

**What the gate did:**
- Ran all 8 rules
- At least one rule returned WARN (not BLOCK)
- Logged "Warned" row to tracker sheet
- Posted alert to business Slack channel with findings
- Appended entry to `incident-log.md`

**Caller should:** Proceed with caution. Read findings. Consider breaking into smaller deploys.

**Common WARN triggers:**
- Rule 4: Structural change without verified preview
- Rule 5: Large deploy (>100 files or >50 redirects)
- Rule 8: Multiple active changes in flight for same area

---

## 2 — BLOCK

**Meaning:** A critical rule failed. Deploy must NOT proceed.

**What the gate did:**
- Ran rules until hitting first BLOCK (fail-fast)
- Printed findings to stderr
- Logged "Blocked" row to tracker sheet
- Posted URGENT alert to business Slack channel
- Appended entry to `incident-log.md`

**Caller should:** HALT deploy. Fix the underlying problem or use `--force` with explicit justification.

**Common BLOCK triggers:**
- Rule 1: Reversing a change <8 weeks old
- Rule 2: Internal links broken by structural change
- Rule 3: Removing pages <8 weeks old as "thin content"
- Rule 7: Tracker logging failed (undocumented changes not allowed)

---

## Override: `--force`

The `--force` flag on `run.js` bypasses BLOCK and allows deploy. When used:
- Exit code becomes 0 (deploy proceeds)
- Tracker row is logged with "FORCED (block overridden)" in Status column
- Slack alert is posted to business_channel AND ops-log with `⚠️ FORCE OVERRIDE` prefix
- Required: `--force-reason "<explanation>"` — stored in tracker

**When to use `--force`:**
- Genuine emergency revert of a broken deploy
- Rule false positive (extremely rare — if happens 2x, tune the rule)

**When NOT to use `--force`:**
- "I want to ship this" — that's exactly what the rule is preventing
- Schedule pressure — the revert will cost more than waiting

---

## Integration patterns

### Bash:
```bash
node ~/.claude/skills/seo-deploy-gate/run.js --business safebath --summary "$SUMMARY"
EXIT=$?
if [ $EXIT -eq 2 ]; then
  echo "DEPLOY BLOCKED"
  exit 1
elif [ $EXIT -eq 1 ]; then
  echo "Deploy warned but proceeding"
fi
# EXIT 0: silent, proceed
```

### Node:
```javascript
const { runGate } = require('~/.claude/skills/seo-deploy-gate/lib/run');
const { exitCode, findings, severity } = await runGate({ businessId, summary });

if (exitCode === 2) {
  throw new Error(`Gate BLOCKED: ${findings.map(f => f.message).join('; ')}`);
}
if (exitCode === 1) {
  logger.warn(`Gate WARNED: ${findings.map(f => f.message).join('; ')}`);
}
// Proceed
```

### Claude session:
```
Use the Skill tool with skill="seo-deploy-gate" args="safebath <change summary>"
Read the severity from the response.
If BLOCK: stop, tell user why, ask for instruction.
If WARN: proceed but tell user what was flagged.
If PASS: proceed.
```
