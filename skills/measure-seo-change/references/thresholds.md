# Win/Loss Thresholds — by Action type

This file is the **source of truth** for what counts as a `win`, `loss`, or `neutral` for each kind of SEO change logged in the SEO Changelog Sheet. Tunable over time as the skill measures more outcomes.

| Action type | Primary metric | Secondary metric | Win threshold | Loss threshold | Auto-rollback? |
|---|---|---|---|---|---|
| `Meta rewrite (title + description)` | CTR % | Position (control) | CTR up ≥30% rel AND position drift <5 | CTR down ≥20% rel | YES (via `/fix-page-snippet --rollback`) |
| `internal_link_retrofit` | Position | Impressions | Pos improved ≥5 spots OR crossed into top 10 OR impressions up ≥50% | Pos degraded ≥3 spots AND impressions down ≥20% | NO (flag for human review) |
| `expand_content` | Impressions | Position | Impressions up ≥40% AND position stable-or-better | Impressions down ≥20% AND position degraded | NO (flag for human review) |
| `redirect_consolidation` | Impressions on canonical | Position on canonical | Canonical impressions up ≥50% within 28d | Canonical impressions flat or down | NO (flag, may need 60-90 days) |

## Confounds to detect & flag

- **Position drift on a snippet rewrite.** If position changed by >5 spots between baseline and measurement, the CTR comparison is contaminated. Mark `inconclusive — position drift`.
- **Algorithm update window.** If a Google core update landed inside the 28-day window, mark `inconclusive — core update <date>` and re-measure 28 days after the update settles.
- **Seasonal traffic.** Some queries are seasonal. If impressions on the page swung >2x in either direction site-wide during the window, flag as `inconclusive — seasonal`.

## Notes for new Action types

When a new `/fix-*` skill starts logging an Action this skill has not seen:
1. Stub a row in the table above with `TBD` thresholds.
2. Run measurement in `--dry-run` mode for the first 5 rows of that type — eyeball the deltas, write thresholds based on what looks like a real lift vs noise.
3. Update the table.
4. Add a Phase 2 sub-section in `SKILL.md`.
