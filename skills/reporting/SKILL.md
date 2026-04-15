---
description: Weekly reports, error alerts, and CEO digests for any business. ICM-structured with staged context loading.
invocation: /report
when_to_use: When the user wants a pipeline report, when a trigger needs a weekly summary, or when an error needs escalation.
---

# Reporting Skill

Generate reports from pipeline activity, search console data, and analytics. One skill for all businesses.

## Usage
```
/report safebath weekly    # Weekly summary: wins, drops, opportunities, gaps, traffic
/report ghl weekly         # Same for GHL
/report safebath error     # Immediate error alert (usually from a trigger)
/report safebath ceo       # CEO digest — only posts if warnings/errors exist
/report all ceo-daily      # Daily narrative across ALL businesses, 7am ET → #ceo
```

## Stages

Run these in order. Each stage has its own CONTEXT.md with inputs/process/outputs.

1. **01-collect** — Gather data: ops-status, GSC, GA4, pipeline state, ops-log
2. **02-compose** — Build the right report type, suppress if nothing to report
3. **03-deliver** — Route to Slack channels + Google Sheet

## Report Types

### weekly (Mondays)
The only report most people need. Shows what changed this week:
- What's going up (pages gaining rank)
- What's going down (pages dropping)
- Opportunities (high impressions, close to page 1)
- Gaps (queries with no matching page)
- Traffic overview (GA4)
- Content produced this week
- CTA / conversion engagement

### error (immediate)
Fires when a pipeline fails. Short, actionable:
- What broke and why
- Which business and pipeline
- Last successful run

### ceo (errors-only digest)
Aggregates ops-log entries across businesses. **Silent on clean days.** Only posts when there are warnings or errors worth escalating.

### ceo-daily (plain-English narrative, daily)
Amazon WBR-style. One paragraph per business, written like a human wrote it. Says what ran, what it produced, and if it produced nothing, why. **Proof of life.** Silence = broken, not green. Use this while the system is fragile; graduate to `ceo` (silent-on-clean) when pipelines are trustworthy.

Template: `stages/02-compose/references/ceo-daily.md`
Schedule: daily 7am ET → #ceo
Replaces: per-push ops-log spam, daily SafeBath essay, duplicate analytics posts.

## References (Layer 3 — stable, shared)
- `references/channel-map.md` — Per-business Slack channel routing
- `references/report-schema.md` — Canonical data shape (extensible for conversions)
- `references/suppress-rules.md` — When to stay silent vs when to post

## Report templates (Layer 3 — per report type)
- `stages/02-compose/references/weekly-summary.md` — Weekly report structure
- `stages/02-compose/references/error-alert.md` — Error alert structure
- `stages/02-compose/references/ceo-digest.md` — CEO digest structure

## Config
Each business has a YAML at `~/Projects/agent-command-center/businesses/{id}.yaml` with:
- `slack.business_channel` — where weekly reports go
- `slack.ceo_channel` — where CEO digests go
- `slack.ops_log_channel` — where error alerts go
- `seo.ga4_property_id` — for live GA4 queries via MCP
- `seo.gsc_site_url` — for GSC context
- `tracking_sheet_id` — for writing report snapshots
- `org.path` — where to find ops-status.json and data files

## Adding a new business
1. Business YAML must have `slack`, `seo`, and `org.path` sections
2. Pipeline must write `ops-status.json` to its data directory
3. That's it — the skill reads config and data from the YAML paths

## Design principles
- **Silent on success.** No one needs "everything's fine" messages.
- **Weekly over daily.** One actionable report beats 7 ignored ones.
- **Data already exists.** This skill composes — it doesn't collect raw data. GSC, GA4, and pipeline state files are produced by existing pipelines.
- **Conversions-ready.** Schema has a nullable `conversions` section. When GA4 events get added to websites, reports automatically include them.
