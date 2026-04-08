---
name: Org Status + CEO Briefing
description: Quick status check across all businesses, teams, and agents. Also serves as the CEO daily briefing when posted to Slack.
user-invocable: true
---

# Org Status + CEO Briefing

You are running an organization-wide status check. Pull data from all projects and report what's happening across the entire AI workforce.

This skill has two modes:
1. **Terminal mode** (default) — user invokes `/org-status`, results display in terminal
2. **Slack briefing mode** — when called with "post to slack" or "ceo briefing", post a formatted briefing to #ceo (channel ID: C0AQAHSQK38) and log to #ops-log (channel ID: C0AQG0DP222)

## When to use this skill
- User says `/org-status` or asks "what's going on" or "status update" or "what needs attention"
- User says "ceo briefing" or "post status to slack" or "morning briefing"
- Start of any session where user wants to know the state of things
- Referenced by Pipeline Doctor trigger for morning briefing runs

## How to check status

### 1. Business registry (source of truth)
Read ALL YAML files in `~/Projects/agent-command-center/businesses/` (skip `_template.yaml`). For each business, check its `status` and `teams` fields. Do NOT hardcode which businesses exist — always read the directory dynamically.

For org chart and roles, read `~/Projects/agent-command-center/dashboard/src/data/workforce.ts`.

Also check the ops registry at `~/Developer/projects/ops/projects.yml` — this is what scheduled triggers use.

### 2. Live checks per platform

**GitHub Actions projects (SafeBath, etc.):**
- Check recent runs: `cd {project-path} && gh run list --limit 5`
- Check pipeline state: read `pipeline-state.json` or equivalent state file
- Check quality scores if available
- Check last content: `git log --oneline -5`
- SafeBath (all pipelines): `~/Developer/projects/safebath/` — repo: RecoveryBiometrics/safebath-website
- SafeBath SEO changelog: check Google Sheet "SEO Changelog" tab (not a local file)

**IONOS VPS projects (GlobalHighLevel):**
- Check scheduler state: read `logs/scheduler-state.json` (if synced locally)
- Check published episodes: read `data/published.json` (last few entries)
- Check SEO optimizer (VPS/podcast only): read `data/seo-changelog.json`
- Check SEO content pipeline (GitHub Actions): verify Google Sheet "SEO Changelog" tab has recent entries
- Check analytics: read `data/topic-weights.json`
- Path: `~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/`
- VPS: 74.208.190.10, SSH key `~/.ssh/ionos_ghl`

**Render projects (Hatch OM Builder):**
- Check if Render service is running: `curl -s https://om-builder.onrender.com/health`
- Path: `~/Projects/hatch-investments/om-builder/`

**Mailer Dashboard:**
- Path: `~/Developer/projects/marketing/mailer-dashboard/`
- Status: in development, not deployed

**Recovery Biometrics:**
- Path: `~/Developer/projects/recovery-biometrics/app/`
- Status: paused

**Bass Forecast:**
- Config: `~/Projects/agent-command-center/businesses/bass-forecast.yaml`
- Docs: `~/Projects/agent-command-center/businesses/bass-forecast-docs/`
- Status: building (90-day retainer)

### 3. Report format
Present status as:

```
ORG STATUS — [date]

LIVE & RUNNING
- [business]: [last run] — [key metric] — [any errors]

NEEDS ATTENTION
- [anything that failed, is overdue, or needs action]

BUILDING / IN DEVELOPMENT
- [projects actively being built]

NOT RUNNING / PAUSED
- [projects on hold with reason]

NEXT ACTIONS
- [specific things that should happen next]
```

## Key metrics to surface
- Did today's pipelines run successfully?
- Any agent failures or retries?
- Quality scores trending up or down?
- Indexing rate improving?
- Any businesses that should have teams but don't?
- Any scheduled triggers that haven't fired?
- Any "New" items in the Active TODOs tab that need human attention?
- NotebookLM auth status (expires ~every 2 weeks)
- SLACK_BOT_TOKEN set in all environments?

## Backup drift check
Compare local skills and memory against the repo backup. Flag any drift:
```bash
diff -rq ~/.claude/skills/ ~/Projects/agent-command-center/skills/ 2>/dev/null | grep -v .DS_Store
diff -rq ~/.claude/projects/-Users-kerapassante-Projects/memory/ ~/Projects/agent-command-center/memory/ 2>/dev/null | grep -v .DS_Store
```
If any files differ, flag it as "NEEDS ATTENTION: skills/memory backup out of sync" and sync them.

## Deployment summary (for reference)

| System | Platform | Schedule | Path |
|--------|----------|----------|------|
| SafeBath Content | GitHub Actions | Daily 6am ET | ~/Developer/projects/safebath/ (safebath-website repo) |
| SafeBath Directory | GitHub Actions | Daily 6am ET | ~/Developer/projects/safebath/ (safebath-website repo) |
| SafeBath SEO Report | GitHub Actions | Weekly Tues 9am ET | ~/Developer/projects/safebath/ (safebath-website repo) |
| SafeBath Analytics | GitHub Actions | Weekly Mon 8am ET | ~/Developer/projects/safebath/ (safebath-website repo) |
| SafeBath Sales | GHL + Vercel | Always on | ~/Developer/projects/safebath/ (safebath-website repo) |
| GHL Podcast | IONOS VPS (systemd) | 25-hour cycles | ~/Developer/projects/marketing/podcast-pipeline |
| GHL SEO Optimizer | IONOS VPS | Weekly (7-day gate) | ~/Developer/projects/marketing/podcast-pipeline |
| GHL Analytics | GitHub Actions | Weekly Mon 8am ET | ~/Developer/projects/marketing/podcast-pipeline (Claude-notebookLM-GHL-Podcast repo) |
| Hatch OM Builder | Render | On demand | ~/Projects/hatch-investments/om-builder |
| Mailer Dashboard | Not deployed | — | ~/Developer/projects/marketing/mailer-dashboard |

## Cost summary (for reference)
- SafeBath (Vercel + APIs): ~$20/mo
- GHL (VPS + Transistor + NotebookLM + APIs): ~$42/mo
- Hatch (Render free tier): $0/mo
- **Total production: ~$62/mo**

## Slack Briefing Mode (CEO Briefing)

When invoked in briefing mode (user says "ceo briefing", "post to slack", or called from Pipeline Doctor trigger):

1. Gather all the same data as terminal mode
2. Also read the last 24 hours of #ops-log (channel ID: C0AQG0DP222) for pipeline activity, deploys, failures
3. Format as a Slack message and post to #ceo (channel ID: C0AQAHSQK38):

```
*CEO Daily Briefing — [date]*

*SafeBath:* [what ran, what succeeded, content produced, any failures]. Last run: [time].
*GHL Podcast:* [cycle status, episodes, blogs, any failures]. Last cycle: [time].
*Hatch:* [health status, OMs generated]. [any issues].

*Action items:* [list, or "None — all systems green."]
```

Keep it short — this is read on a phone. One paragraph per business, bold headers, no tables.

4. Log to #ops-log: `[Org Status] CEO Briefing posted to #ceo covering [N] businesses.`

In terminal mode, skip the Slack posting — just display the full org status report.

## Pipeline Health Collection (runs in briefing mode)

When running in Slack briefing mode, ALSO collect structured pipeline health data and write it to the Pipeline Health sheet. This is the daily "did everything run?" check.

### Data sources

Read `~/Developer/projects/ops/projects.yml` — iterate every business's `pipelines:` block. For each pipeline, check status based on its `type`:

**`github-actions` pipelines:**
```bash
gh run list --repo {pipeline.repo} --workflow {pipeline.workflow} --limit 1 --json status,conclusion,startedAt,updatedAt,name
```
- `conclusion: "success"` → status: ✅ success
- `conclusion: "failure"` → status: ❌ FAILED
- `status: "in_progress"` → status: 🔄 running
- No runs found → status: ⚠️ no runs
- Calculate duration from startedAt → updatedAt

**`systemd` (VPS) pipelines:**
```bash
ssh -i ~/.ssh/ionos_ghl williamcourterwelch@74.208.190.10 "cat /home/williamcourterwelch/Claude_notebookLM_GHL_Podcast/ghl-podcast-pipeline/logs/scheduler-state.json"
```
- Parse `lastCycleEnd` timestamp
- If age > `max_gap_hours` (from YAML, default 30) → status: ❌ OVERDUE
- Otherwise → status: ✅ success
- For `seo-optimizer`: also check `data/seo-changelog.json` last entry date

**`web-service` pipelines:**
```bash
curl -s {pipeline.url}{pipeline.health_check}
```
- HTTP 200 → status: ✅ healthy
- Otherwise → status: ❌ DOWN

### Write to Google Sheet

After collecting all pipeline statuses, write to the **"Pipeline Health" tab** in the REI Amplifi Tracker sheet.

- Sheet ID: read `ops_sheet_id` from `projects.yml` (`1LKbt9n9xfPv76-9kpOM8oxv8jFMXMlWGSukCDWTD8pA`)
- Use `mcp__google-workspace__append_table_rows` to add one row per pipeline
- Columns: Date | Business | Pipeline | Platform | Schedule | Status | Last Run | Duration (min) | Notes

Example rows:
```
2026-04-08 | SafeBath | Daily Content & Directory | github-actions | daily 6am ET | ✅ success | 2026-04-08 06:02 | 14 | 
2026-04-08 | SafeBath | Weekly Analytics | github-actions | mondays 8am ET | ⏳ waiting | 2026-04-07 08:01 | 12 | next: Mon Apr 13
2026-04-08 | GHL | Content Production | systemd | every 25 hours | ✅ success | 2026-04-08 03:42 | — | 
2026-04-08 | Hatch | OM Builder | web-service | on-demand | ✅ healthy | — | — | 
```

### Enhanced Slack format

When posting to #ceo-briefing, include the pipeline health block at the top of the message:

```
*Pipeline Health — [date]*

*SafeBath* (3 pipelines)
  Daily Content & Directory    ✅ ran 6:02am, 14 min
  Weekly Analytics             ⏳ waiting (next: Mon Apr 13)
  Weekly SEO Report            ⏳ waiting (next: Tue Apr 14)

*GHL* (3 pipelines)
  Content Production           ✅ last cycle 3:42am
  SEO Optimizer                ⏳ waiting (next eligible: Apr 8)
  Weekly Analytics             ⏳ waiting (next: Mon Apr 13)

*Hatch*
  OM Builder                   ✅ healthy (on-demand)

[All green | N issues need attention]
```

Then follow with the regular CEO briefing content (business summaries, action items).

### "Waiting" logic for scheduled pipelines

For pipelines that run on a schedule (not continuous or on-demand):
- If the last run was successful and the next scheduled run hasn't arrived yet → show ⏳ waiting with next run date
- If the last run was successful and was today → show ✅ with the time
- If the last run failed → show ❌ regardless of schedule
- Calculate "next run" from the `schedule` field in YAML (e.g., "mondays 8am ET" → next Monday)

### Auto-scaling

This reads `projects.yml` dynamically. When a new business or pipeline is added to the registry, it automatically appears in the next health check. No code changes needed.
