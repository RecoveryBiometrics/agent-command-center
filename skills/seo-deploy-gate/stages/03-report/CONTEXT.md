# Stage 3: Report

Log the gate result to the tracker, alert Slack if warn/block, return exit code to caller.

## Inputs
- `check_results.json` from stage 02

## Process

### 1. Format the finding report
Human-readable summary for stdout (what the user sees):

```
═══════════════════════════════════════════════
SEO DEPLOY GATE — safebath
Summary: Restructure: remove 680 city-service pages
Commit: abc1234 on main
═══════════════════════════════════════════════

Severity: BLOCK

Findings:
  ❌ Rule 1 — 8-week rule
     NV/SC pages added 2026-03-13 (4 weeks ago). Cannot reverse until 2026-05-08.
     See tracker row 7.
  
  ❌ Rule 3 — Strategic intent
     /bathroom-safety-las-vegas-nv was added 28 days ago as strategic market entry.
     'New market' ≠ 'thin content'. Reconsider removal.
  
  ⚠️  Rule 5 — Atomic deploy size
     80 redirect rules added in single commit. Consider splitting.

Passed: Rule 4, Rule 6, Rule 7, Rule 8

Exit code: 2 (BLOCK)

To override: re-run with --force --force-reason "<explanation>"
═══════════════════════════════════════════════
```

### 2. Log to tracker sheet

Use MCP `mcp__google-workspace__append_table_rows` or `modify_sheet_values` to append a row to the "SEO Safeguard" tab (auto-create if missing).

Row schema:
| Column | Value |
|--------|-------|
| Date | Today's ISO date |
| Business | `businessId` |
| Severity | PASS / WARN / BLOCK / FORCED |
| Summary | Change summary from input |
| Branch | git branch |
| Commit | Short SHA |
| Rules Fired | Comma-separated list of failing rules |
| Files Changed | Count |
| Redirects Added | Count |
| URLs Affected | Top 5 URL patterns |
| Force Reason | If forced, the reason |
| Findings Detail | JSON dump of findings |

**If logging to tracker fails** (auth, network, sheet missing):
- Print error to stderr
- Exit code becomes 2 regardless of rule findings (Rule 7 violation)
- Rationale: undocumented changes are not allowed to ship

### 3. Post to Slack

Only post if severity is WARN, BLOCK, or FORCED.

Use MCP `mcp__claude_ai_Slack__slack_send_message`:

**WARN message** → `slack.business_channel`:
```
*⚠️ SEO Gate WARNED — {business}*

*Change:* {summary}
*Commit:* {shortSha} on `{branch}`

*Warnings:*
• Rule 4 — Preview not verified
• Rule 5 — Large deploy (80 redirects)

Proceeding with deploy. Logged to tracker.
```

**BLOCK message** → `slack.business_channel`:
```
*🛑 SEO Gate BLOCKED — {business}*

*Change:* {summary}
*Commit:* {shortSha} on `{branch}`

*Blocks:*
• Rule 1 — 8-week rule (NV/SC pages 4 weeks old)
• Rule 3 — Strategic intent (NV/SC = new market, not thin content)

Deploy halted. See tracker for details.
```

**FORCED message** → BOTH `slack.business_channel` AND `slack.ops_log_channel`:
```
*⚠️ SEO Gate FORCE OVERRIDE — {business}*

*Change:* {summary}
*Commit:* {shortSha} on `{branch}`
*Reason for override:* {forceReason}

*Overridden blocks:*
• Rule 1 — 8-week rule
• Rule 3 — Strategic intent

Deploy proceeded despite gate. Owner: @channel
```

### 4. Append to incident-log.md

For WARN, BLOCK, and FORCED outcomes, append entry to `~/.claude/skills/seo-deploy-gate/references/incident-log.md`:

```markdown
## YYYY-MM-DD — {business} {summary}

**Commit:** `{sha}`
**Status:** {severity}

**Rules fired:**
{findings bulleted list}

**Files changed:** {count}
**Redirects added:** {count}

(If FORCED)
**Force reason:** {forceReason}
```

### 5. Emit exit code
- PASS → exit 0
- WARN → exit 1
- BLOCK → exit 2
- FORCED → exit 0 (but logged everywhere)

## Outputs

stdout: Human-readable report (section 1 above)
stderr: Only if tracker logging failed
Exit code: 0 / 1 / 2
Side effects: tracker row added, Slack posted if applicable, incident log appended
