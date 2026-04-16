---
name: Reporting Pipeline — Session Handoff (2026-04-15)
description: Current live state of CEO Daily + Weekly SEO triggers. Read this to resume reporting work without rediscovering. Contains trigger IDs, env IDs, SA details, pending blockers.
type: project
originSessionId: 67b5bfa1-1a7a-417e-9f26-c43d89efe7c4
---
## Magic phrase to resume

Bill types: **"resume the reporting work"** → any Claude session finds this memory and picks up from the state below.

## What's live

### CEO Daily Narrative
- **Trigger ID:** `trig_017gYGfVmviqWCdR8vpD1jTt`
- **Cron:** `0 11 * * *` UTC = 7am EDT / 6am EST (DST caveat — bump to `0 12 * * *` in Nov)
- **Environment:** `env_01TDtHFibihP4mCg7C5cZnxC` (`reiamplifi-google`)
- **Posts to:** #ceo (C0AQAHSQK38)
- **Format:** Amazon WBR plain-English narrative, one paragraph per business
- **Rule:** never suppress (proof of life), dedup per business per day
- **Data:** git log + #ops-log Slack + live GA4 sessions (via service account)

### Weekly SEO Report
- **Trigger ID:** `trig_01GqvHa2Kmbz9SjwjJme6hcq`
- **Cron:** `0 13 * * 2` UTC = Tue 9am EDT
- **Environment:** `env_01TDtHFibihP4mCg7C5cZnxC` (same)
- **Posts to:** #ceo only (business channels archived)
- **Format:** one message per business, lead with bolded decision, WoW deltas, input metrics, end with "this week we're doing X"
- **Data:** live GSC + GA4 via service account

## Skill (single source of truth)

`agent-command-center/skills/reporting/stages/*/CONTEXT.md`. Trigger prompts `cat` these at runtime — edit the skill, all triggers update.

- `01-collect/CONTEXT.md` — LIVE data only rule (no cached .json files)
- `02-compose/CONTEXT.md` — report structure rules
- `02-compose/references/{ceo-daily,weekly-summary,error-alert,ceo-digest}.md` — per-type templates

## Secret plumbing

- **Service account:** `seo-agent@safebath-seo-agent.iam.gserviceaccount.com`
- **Key in env var:** `GOOGLE_SERVICE_ACCOUNT_KEY_B64` (base64-encoded JSON)
- **GCP project:** `safebath-seo-agent` (project# `888724847234`), under williamcourterwelch@gmail.com (no org)
- **APIs enabled:** Search Console API, Google Analytics Data API
- See `reference_claude_ai_env_vars.md` for wiring + rotation steps

## Pending blockers (Bill's browser, 2 min)

1. **GHL GSC 403** — add `seo-agent@safebath-seo-agent.iam.gserviceaccount.com` as Restricted user on `sc-domain:globalhighlevel.com` in Search Console (logged in as williamcourterwelch@gmail.com)
2. **GHL GA4 403** — add the SA as Viewer on GA4 property `531015433`
3. *(low priority)* SafeBath GSC — upgrade SA from siteRestrictedUser to siteFullUser for query-level data

Once those two are granted, live data is complete for both businesses in all reports.

## Consolidation state

- Active Slack channels: **#ceo** (all reports) + **#ops-log** (errors only)
- Archived: #safebath, #globalhighlevel, #social
- Per-push git hook in safebath-website: silenced (commit `519953e`)
- SEO Optimizer per-page Slack spam: silenced (commit `02e51ac`)

## Known-good test results (2026-04-15)

- Manual fire of Weekly SEO trigger posted real live-data report to #ceo
- SafeBath: 23 clicks, 1,894 impressions (+366), GA4 22 sessions
- GHL: 50 clicks, 15,156 impressions (launch window); GA4 blocked pending permission
- Service account key works; env var mechanism works; dedup works

## What Bill pushed back on (feedback captured)

- Don't propose workarounds when a clean answer exists (docs first)
- Don't over-claim with "done" without evidence — led to CLAUDE.md Evidence Contract addition
- The Sheet is load-bearing for /todo-agent, /analytics-team, content-builder — don't kill Sheet writes
