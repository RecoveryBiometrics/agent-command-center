# Stage 2: Compose Report

## Inputs
All data collected in stage 01:
- `business`, `report_type`, `pipeline_status`, `ops_log_entries`
- `search_performance`, `wins_drops`, `opportunities`, `gaps`
- `traffic`, `conversions`, `content_velocity`

## Process

### 1. Check suppress rules
Read `references/suppress-rules.md` and apply:
- **ceo:** If all ops-log entries are info-level (no warnings/errors), STOP. Output nothing. Log "CEO digest suppressed — all clean."
- **error:** Never suppress. That's the whole point.
- **weekly:** Never suppress. Always send the weekly report.

### 2. Load report template
Read the matching template from `references/`:
- `weekly` → `references/weekly-summary.md`
- `error` → `references/error-alert.md`
- `ceo` → `references/ceo-digest.md`

### 3. Render the report
Fill the template with collected data. Follow these rules:

**Numbers must be real.** Never invent, estimate, or round aggressively. If data is missing, say "no data" — don't guess.

**Compare to prior period.** For weekly reports, always show direction: "Clicks: 142 (+23 vs last week)" or "Position: 18.3 (no prior data)". Use the `priorTotals` from analyze.js output when available.

**Conditional sections.** Only render sections that have data:
- If no wins → skip "What's Going Up"
- If no drops → skip "What's Going Down"
- If no gaps → skip "Content Gaps"
- If no conversion data → skip "Conversions" (don't say "0 conversions", just omit)
- If no GA4 data → skip "Traffic" section entirely

**Keep it scannable.** Use Slack formatting:
- Bold headers with `*Header*`
- Bullet points for lists
- Code blocks for slugs: `` `page-slug` ``
- Blockquotes for key metrics: `> Clicks: *142* | Impressions: *8,340*`

**Max length.** Slack truncates at ~4000 chars. If the report is longer, prioritize:
1. Key metrics (totals, direction)
2. Wins and drops (top 5 each)
3. Opportunities (top 5)
4. Gaps (top 5)
5. Traffic summary (one line)
6. Content velocity (one line)

## Outputs
Pass to stage 03:
- `formatted_message` — Slack-ready text
- `report_type` — for routing decisions
- `suppressed` — boolean, true if suppress rules triggered
- `sheet_data` — structured data for Sheet write (weekly only)
  - Row format: [date, clicks, impressions, ctr, position, sessions, users, content_count, wins_count, drops_count, opportunities_count, gaps_count]
