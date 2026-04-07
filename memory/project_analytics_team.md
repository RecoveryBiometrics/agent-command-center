---
name: Analytics Team — Architecture
description: GA4 analytics pipeline architecture, credentials, sheet IDs, and deployment details for SafeBath + GHL
type: project
---

## What it is
The "brain" of the system — first pipeline that talks to other pipelines. Collects GA4 data, generates insights, dispatches instructions to SEO content, podcast, and directory pipelines.

**Pipeline:** `agent-command-center/pipelines/analytics/` (11 files, Node.js)
**Skill:** `~/.claude/skills/analytics-team/SKILL.md`
**Design plan:** `~/.claude/plans/frolicking-snuggling-quokka.md`

## Credentials
- **Service account:** `safebath-seo@gen-lang-client-0592529269.iam.gserviceaccount.com`
- **GCloud project:** `gen-lang-client-0592529269` (named "SafeBath")
- **GA4 property — SafeBath:** `531047753` (was incorrectly `14299063401` before 2026-04-07)
- **GA4 property — GHL:** `531015433`
- **GA4 ownership:** `bill@reiamplifi.com` (Administrator). `williamcourterwelch@gmail.com` has inherited org-level access only.

## Tracking Sheets
- **SafeBath:** `1vGdGvjm9MXsL_RZSw3zk-ULpqxuhjt73UR7-q5OGbp4`
- **GHL:** `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`

## Deployment
- **SafeBath:** `safebath-website` repo → `weekly-analytics.yml` → Monday 8am ET
- **GHL:** `Claude-notebookLM-GHL-Podcast` repo → `weekly-analytics.yml` → Monday 8am ET

## Key architecture decisions
- Closed loop: high-confidence recommendations auto-dispatch to other pipelines
- Max 3 instructions per pipeline per week
- Dispatches only influence ordering/weighting, never bypass quality checks
- Podcast dispatch via git push (VPS pulls on next cycle)
- All businesses get all data — interpretation adapts by niche

## Adding a new business
1. Add `analytics:` section to its YAML (see `_template.yaml`)
2. Create a tracking sheet, share with service account as Editor
3. Add `GOOGLE_SERVICE_ACCOUNT_KEY` + `SLACK_BOT_TOKEN` secrets to its repo
4. Add `weekly-analytics.yml` workflow
5. Add service account as Viewer on the GA4 property
6. Enable Analytics Data API + Sheets API on the GCloud project if needed
