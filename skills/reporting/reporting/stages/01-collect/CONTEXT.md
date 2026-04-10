# Stage 1: Collect Data

## Inputs
- **Business ID** from invocation (e.g., `safebath`, `globalhighlevel`)
- **Report type** from invocation (`weekly`, `error`, `ceo`)

## Process

### 1. Load business config
Read `~/Projects/agent-command-center/businesses/{id}.yaml` to get:
- `org.path` — project root (e.g., `~/Developer/projects/safebath/`)
- `slack.*` — channel IDs
- `seo.ga4_property_id` — for live GA4 queries
- `seo.gsc_site_url` — for context
- `tracking_sheet_id` — for Sheet writes
- `analytics.conversion_events` — what conversion events to look for

### 2. Read pipeline status
Read `ops-status.json` from the business data directory:
- SafeBath: `{org.path}/website/ops-status.json`
- GHL: `{org.path}/ghl-podcast-pipeline/data/ops-status.json`

Extract: status (ok/warning/error), content counts, failures, last cycle timestamp.

### 3. Read ops-log (for ceo and error types)
Use `mcp__claude_ai_Slack__slack_read_channel` to read #ops-log (C0AQG0DP222):
- For `ceo`: last 24 hours, filter by business tag
- For `error`: last 24 hours, filter by business tag, errors/warnings only
- For `weekly`: last 7 days, filter by business tag

### 4. Read search performance (for weekly)
Read GSC data file from the business data directory:
- SafeBath: `{org.path}/seo/seo-reports/` (latest gsc-pages-with-data-*.json)
- GHL: `{org.path}/ghl-podcast-pipeline/data/gsc-stats.json`

Extract: totals (clicks, impressions, CTR, position), top pages, top queries.

### 5. Read wins/drops/opportunities/gaps (for weekly)
Check if the seo-reporting pipeline has produced analysis output:
- Look in `~/Projects/agent-command-center/state/{businessId}/seo-analysis.json`
- Or read from the Sheet "Weekly SEO Report" tab via Google Workspace MCP
- This contains: wins, drops, opportunities (position 8-20), gaps (0-click queries)

If no pre-computed analysis exists, compute from raw GSC data:
- **Wins:** Pages that gained 3+ positions with 20+ impressions
- **Drops:** Pages that fell 3+ positions with 20+ impressions
- **Opportunities:** Position 8-20, CTR < 3%, 30+ impressions
- **Gaps:** Queries with 50+ impressions and 0 clicks

### 6. Read traffic data (for weekly)
Try in order:
1. Live GA4 via `mcp__analytics-mcp__run_report` with `ga4_property_id`
   - Metrics: sessions, activeUsers, screenPageViews, bounceRate, averageSessionDuration
   - Dimensions: sessionDefaultChannelGroup (for traffic sources)
   - Date range: last 7 days
2. Fall back to cached `ga4-stats.json` in business data directory

### 7. Read conversion/engagement data (for weekly)
From GA4 data (live or cached), look for:
- CTA clicks (GHL: `cta_click` events)
- Phone clicks (SafeBath: `click` events on tel: links)
- Any events listed in `analytics.conversion_events` from business YAML
- If no conversion data exists, note it — stage 02 will skip that section

### 8. Read content velocity (for weekly)
Business-specific:
- **GHL:** Read `published.json`, `india-published.json`, `spanish-published.json` — count items with dates in last 7 days
- **SafeBath:** Read ops-status.json `articles` count, or content-changelog.json for weekly counts

## Outputs
Pass to stage 02:
- `business` — full YAML config object
- `report_type` — weekly | error | ceo
- `pipeline_status` — from ops-status.json
- `ops_log_entries` — filtered Slack messages
- `search_performance` — GSC totals + top pages/queries
- `wins_drops` — pages going up and down
- `opportunities` — close-to-page-1 pages
- `gaps` — queries needing new pages
- `traffic` — GA4 sessions, users, sources
- `conversions` — nullable, whatever events exist
- `content_velocity` — what was produced this week

## Tools needed
- `mcp__claude_ai_Slack__slack_read_channel` — read ops-log
- `mcp__analytics-mcp__run_report` — live GA4 data (optional, falls back to cached)
- `mcp__google-workspace__read_sheet_values` — Sheet data if needed
- File reads for all JSON data files
