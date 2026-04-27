---
name: measure-seo-change
version: 1.0.0
description: "Measures whether a logged SEO change (snippet rewrite, link retrofit, content expansion, redirect consolidation) actually moved the needle in GSC after its 28-day soak window. Reads the SEO Changelog Sheet, dispatches per Action type, judges win/loss/neutral against type-specific thresholds, writes back to the Sheet, and posts learnings to the matching /fix- skill so it self-improves."
invocation: /measure-seo-change
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
triggers:
  - did the SEO change work
  - measure SEO impact
  - audit past rewrites
  - did the link juice work
  - evaluate retrofit
  - 28-day check on SEO
  - check SEO Changelog
  - did the title rewrite help
---

# /measure-seo-change — Did the SEO change actually move the needle?

This skill is the **measurement half** of every SEO experiment on the network. Every `/fix-*` skill ships a change AND logs it to the SEO Changelog Sheet with a baseline. This skill comes back 28 days later, pulls current GSC data, computes the lift, judges win/loss/neutral, and feeds the learning back to the skill that made the change.

**Why this skill exists separately from `/fix-*`:** different verb. `/fix-page-snippet` rewrites a snippet. `/fix-interlinking` adds links. `/measure-seo-change` measures *anything* in the Changelog. One measurer, many fixers.

## The rule

A change has not "worked" until GSC says so. Until measured, every change is a hypothesis. The Sheet's `Outcome` column is empty by default and only this skill writes to it.

## Invocation (parameterized)

```
/measure-seo-change                           # default: measure all rows past their 28-day window
/measure-seo-change --row 25                  # measure one specific Sheet row
/measure-seo-change --action internal_link_retrofit   # measure only one Action type
/measure-seo-change --since 2026-04-01        # measure all rows logged on/after this date
/measure-seo-change --dry-run                 # compute lift, do not write to Sheet
```

## Phase 0 — Load context (resolver)

Before measuring anything, read these in order:

1. `~/.claude/projects/-Users-kerapassante-Developer-projects-marketing-podcast-pipeline/memory/reference_seo_changelog_sheet.md` — Sheet ID, tab name, auth options.
2. `references/thresholds.md` (this skill) — win/loss thresholds per Action type.
3. `state/measurement-history.json` (this skill) — past measurements, for self-improvement signal.

If `state/measurement-history.json` does not exist, create it: `{"measurements": []}`.

## Phase 1 — Discover rows ready to measure

**Issue:** SEO Changelog Sheet has many rows; only some are past their 28-day window AND not yet measured.

**Context:** A row is "ready" when:
- `Date` is ≥28 days before today
- `Outcome` column (P) is empty
- Page still exists (HTTP 200, not redirected away)

**Mechanism:** Read the Sheet via MCP. (The Python script does NOT do Sheet I/O — Sheet auth lives in the harness's Google Workspace MCP, which already authenticates correctly. The script handles only deterministic GSC math.)

```
mcp__google-workspace__read_sheet_values(
    user_google_email="bill@reiamplifi.com",
    spreadsheet_id="<id from reference_seo_changelog_sheet.md>",
    range_name="Changelog!A2:P1000"
)
```

Filter the returned rows where:
- `row[0]` (Date) parses to a date ≥28 days ago
- `row[15]` (Outcome) is empty
- (Optional) Action type matches `--action` filter

**Action:** Print the list of ready rows, grouped by Action type. Group counts → progress signal.

**Verification:** Each row should have a slug (`row[2]`), baseline metrics (`row[5]` position, `row[6]` impressions, `row[7]` CTR), and a known Action type (`row[3]`). Unknown Action types log a warning and skip.

## Phase 2 — Per-row measurement (dispatch by Action type)

For each ready row, call the deterministic script:

```bash
python3 ~/.claude/skills/measure-seo-change/scripts/measure.py \
  --slug <row[2]> \
  --action <row[3]> \
  --baseline-position <row[5]> \
  --baseline-impressions <row[6]> \
  --baseline-ctr <row[7]>
```

Script returns single-line JSON to stdout: `{"slug": ..., "outcome": ..., "deltas": {...}, "current": {...}}`. Outcome is already judged against the threshold table — the skill does NOT re-judge. The judgment lives in `references/thresholds.md` (which the script reads via the `THRESHOLDS` table — keep them in sync).

If the script's outcome is `inconclusive` for any reason, do NOT auto-rollback even if the Action is one that normally auto-rollbacks. Always require a human read on inconclusive results.

**Per-Action notes** (for human-readable logging — script applies the actual rules):

### 2a. Action = "Meta rewrite (title + description)"

**Issue:** Did the new snippet improve CTR?

**Context:** Title/meta rewrites move CTR. They do NOT typically move position (Google does not rank by snippet text). Position is the control variable; CTR is the signal.

**Mechanism:** Compare `CTR % (before)` to current 28-day CTR for the same page. Position should be roughly stable (within ±3 spots) — if position changed dramatically, the comparison is contaminated; mark as `inconclusive — position drift`.

**Win threshold:** CTR up ≥30% relative (e.g., 0.5% → 0.65%) AND position drift <5 spots.
**Loss threshold:** CTR down ≥20% relative.
**Neutral:** anything between.

**Action on loss:** Flag for rollback in the `Outcome` column. The matching `/fix-page-snippet --rollback` invocation handles the actual revert.

### 2b. Action = "internal_link_retrofit"

**Issue:** Did the inserted internal links lift the page's position?

**Context:** Internal link concentration is a PageRank signal. It moves *position*, not CTR (CTR is downstream of position). Position is the primary metric; impressions is secondary (a side effect of better position).

**Mechanism:** Compare `Position (before)` to current 28-day average position. Compare `Impressions (before)` to current 28-day impressions. CTR is not the right signal here — ignore unless it crashed (which would indicate the new anchor text is misleading users, a separate bug).

**Win threshold:**
- Position improved by ≥5 spots, OR
- Page crossed into top 10 (position ≤10 currently), OR
- Impressions up ≥50% relative

**Loss threshold:** Position degraded by ≥3 spots AND impressions down ≥20%.
**Neutral:** anything between.

**Action on loss:** Do NOT auto-rollback link retrofits. Position can drift for many reasons (algorithm updates, competitor changes). Instead, flag in `Outcome` and note: "lost — investigate before re-running this strategy."

### 2c. Action = "expand_content"

**Issue:** Did expanding the article body lift clicks?

**Context:** Content expansion can raise impressions (more queries match) and/or position (Google rewards depth). Track both.

**Mechanism:** Compare `Impressions (before)` and `Position (before)` to current. Win if impressions up AND position stable-or-better. Loss if both degraded.

**Win threshold:** Impressions up ≥40% AND position stable-or-better.
**Loss threshold:** Impressions down ≥20% AND position degraded.
**Neutral:** mixed.

**Action on loss:** Do NOT auto-rollback content expansions. Flag in `Outcome` for human review.

### 2d. Unknown / new Action types

**Issue:** A new `/fix-*` skill logged a row with an Action this skill does not know about.

**Mechanism:** Log a warning. Do not measure. Add a stub to `references/thresholds.md` so the next operator can define thresholds.

## Phase 3 — Write back to the Sheet (via MCP)

For each measured row, update three columns via MCP:

```
mcp__google-workspace__modify_sheet_values(
    user_google_email="bill@reiamplifi.com",
    spreadsheet_id="<id>",
    range_name=f"Changelog!N{row_index}:P{row_index}",
    values=[[str(deltas["pos_after"]), str(deltas["ctr_after"]), outcome]]
)
```

- Column N = `Position (28d)` — current 28-day average position
- Column O = `CTR % (28d)` — current 28-day CTR
- Column P = `Outcome` — one of: `win`, `loss`, `neutral`, `inconclusive — <reason>`, `skipped — <reason>`

**Verification:** Re-read the row to confirm the three columns updated correctly. If write fails, append the result to `state/measurement-history.json` so we don't re-run the GSC fetch on retry.

## Phase 4 — Self-improvement (feed learnings back)

This is the loop that makes the network smarter over time. After every measurement run:

1. **Aggregate by lever / strategy.** For all `Outcome=win` rows of a given Action, what do they have in common? Same lever_title? Same anchor pattern? Same trigger phrase?

2. **Append to `state/measurement-history.json`** so future runs can build a longer pattern history.

3. **When a pattern reaches statistical confidence (≥10 wins of the same kind, win rate ≥70%), append a "proven lever rule" to the matching `/fix-*` skill's SKILL.md.** Example: after 10 measured snippet rewrites where adding a year ("2026") to the title produced a CTR win, append to `/fix-page-snippet`:
   > **Proven lever (added 2026-MM-DD):** Adding a year ("2026") to titles raised CTR in 8 of 10 measured rewrites. Strong signal — lean toward this lever for evergreen pages.

4. **Equivalent for `/fix-interlinking`:** which anchor patterns won most often, which trigger phrases (in the source post) correlated with the biggest position gain on the target.

The `/fix-*` skills get smarter without anyone editing them by hand. That's the self-improving property Garry Tan calls out — measured + automated.

## Phase 5 — Report (optional, when run from cron)

If `--report` flag is set, post a summary to Slack `#ceo`:
- Wins / losses / neutrals this run
- Any rollback recommendations for `/fix-page-snippet`
- Any new "proven lever" rules appended to fix- skills
- Cumulative win rate per Action type (life-of-skill)

## Persistent state

```
state/
  measurement-history.json   — every measurement ever made: {row, slug, action, outcome, deltas, metadata}
  proven-levers.json         — patterns confirmed at ≥10 measurements + ≥70% win rate (used to append rules)
```

JSON schemas documented at top of each file.

## Self-improving rules

After every session involving this skill:

1. **Did a `/fix-*` skill log a row with an Action this skill does not handle?** → Add a section under Phase 2 with thresholds (or stub it in `references/thresholds.md`).

2. **Did the user disagree with a `win` / `loss` judgment?** → Tighten the threshold in `references/thresholds.md` and add an example.

3. **Did a measurement turn out to be `inconclusive` because of a confound (position drift, algorithm update, seasonal traffic)?** → Add a check in the relevant Phase 2 section to detect and flag that confound.

4. **Did the user ask for a metric this skill does not currently track?** → Extend `scripts/measure.py` to fetch it AND update the relevant Phase 2 section to use it.

Write new rules directly into this SKILL.md.
