# Stage 1: Collect Data

## HARD RULE — LIVE DATA ONLY

**Never read cached files for metrics.** Every number in a report must come from a live API at the time the report is generated. No exceptions.

If a live source is unreachable (auth missing, API down, no credentials):
- **Do not fall back to cached files.** Cached = stale = lies.
- In the report, write: `"{metric} unavailable — {reason}"` and move on.
- Flag it as a blocker in the "Decisions" section of the composed report.

Files in repos (like `ops-status.json`, `gsc-stats.json`, `ga4-latest.json`) are **diagnostic artifacts only** — use them to verify a pipeline is writing output, never to populate report numbers.

**Why:** Cached data compounds. Yesterday's stale clicks + today's stale sessions + last week's stale rankings = a report that looks fresh but is wrong in three ways simultaneously. One source of truth: the live API.

## Inputs
- **Business ID** from invocation (e.g., `safebath`, `globalhighlevel`)
- **Report type** from invocation (`weekly`, `error`, `ceo`, `ceo-daily`)

## Process

### 1. Load business config (this is config, not data)
Read `~/Projects/agent-command-center/businesses/{id}.yaml` to get:
- `slack.*` — channel IDs
- `seo.ga4_property_id` — for live GA4 query
- `seo.gsc_site_url` — for live GSC query
- `tracking_sheet_id` — for Sheet read/write
- `analytics.conversion_events` — which events count as conversions
- Repo paths (for git-log queries, NOT for reading data files)

### 2. Pull pipeline activity (live, from git)
Use `git log --since={window} --oneline` on each business's repo clone to see what actually shipped. Commit messages are live truth.

- **Window for ceo-daily:** last 24 hours
- **Window for weekly:** last 7 days

If the clone is unavailable (auth failure), report "git history unavailable for {business}" — do not read any cached file as substitute.

### 3. Pull ops-log activity (live, from Slack)
Use `mcp__claude_ai_Slack__slack_read_channel` on #ops-log (C0AQG0DP222).

- **ceo-daily:** last 24h, filter for warnings/errors/failures
- **error:** last 24h, errors only
- **weekly:** last 7 days

### 4. Pull search performance (live, from GSC)
Query the Google Search Console API for `seo.gsc_site_url`.

- **Dimensions:** page, query
- **Metrics:** clicks, impressions, ctr, position
- **Window:** last 28 days AND prior 28 days (for WoW/period deltas)

If GSC credentials aren't available in the current environment:
- Report: `"GSC data unavailable — service account key not configured in trigger environment."`
- Do NOT read `gsc-stats.json` or any `.json` file as substitute.

### 5. Pull traffic (live, from GA4)
Use `mcp__analytics-mcp__run_report` against `seo.ga4_property_id`.

- **Metrics:** sessions, activeUsers, screenPageViews, bounceRate
- **Dimensions:** sessionDefaultChannelGroup, pagePath
- **Window:** last 7 days AND prior 7 days (for deltas)

Also pull conversion events listed in `analytics.conversion_events` (e.g., `cta_click`, `trial_click`, phone clicks for SafeBath).

If the GA4 MCP is not available (remote trigger environment without analytics-mcp):
- Report: `"GA4 data unavailable — analytics-mcp not connected in trigger environment."`
- Do NOT read `ga4-latest.json` or any cached GA4 file.

### 6. Pull Sheet state (live, via Google Workspace)
For Active TODOs, Build Queue, SEO Changelog:
- Use `mcp__google-workspace__read_sheet_values` (local) or Sheets API (remote with service account)
- Read the live Sheet at request time

If Sheet read fails: `"Sheet unavailable — {reason}"`. Do not fall back to anything.

### 7. Verify freshness of every value
Before passing data to stage 02, every metric should be tagged with its source + timestamp:

```
{
  metric: "clicks",
  value: 47,
  source: "GSC API",
  pulled_at: "2026-04-15T19:45:00Z",
  window: "2026-03-13 to 2026-04-10"
}
```

Stage 02 uses `pulled_at` in the report to prove freshness.

## Outputs to Stage 02
- `business` — YAML config
- `report_type` — ceo-daily | weekly | error | ceo
- `live_data` — dict of all live-pulled metrics, each with `source` + `pulled_at`
- `unavailable` — list of data sources that failed (with reason); stage 02 surfaces these in the report

## Tools needed
- `mcp__claude_ai_Slack__slack_read_channel` — Slack history (live)
- `mcp__analytics-mcp__run_report` — live GA4 (local) or GSC API via service account (remote)
- `mcp__google-workspace__read_sheet_values` — live Sheet reads (local)
- Bash `git log` — commit history (live)

## What NOT to read
- `ops-status.json` (cache)
- `gsc-stats.json` (cache)
- `ga4-latest.json` (cache)
- `gsc-pages-with-data-*.json` (cache)
- Any `seo-reports/*.md` (cache)
- Any `data/*.json` that duplicates live API state

These files may exist and may be committed to repos. Ignore them for reporting. If they're useful for other pipelines, fine — but not for this skill.
