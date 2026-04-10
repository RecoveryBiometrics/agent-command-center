# Agent Command Center

Central hub for all REI Amplifi AI agent operations. Contains reusable skills, business configs, pipeline code, and a visual dashboard.

## Structure

```
businesses/     — one YAML per business (single source of truth for config)
pipelines/      — the actual code that runs the pipelines
skills/         — backup of all skills (source of truth is ~/.claude/skills/)
memory/         — backup of all memory files (source of truth is ~/.claude/projects/.../memory/)
dashboard/      — Next.js visual dashboard (live on Vercel)
```

**Skills live in TWO places:** `~/.claude/skills/` (Claude Code reads from here) AND `skills/` in this repo (backup). When updating a skill, update BOTH. If they ever drift, the global copy is what Claude uses — the repo copy is the backup.

## How It Works

- **Business YAMLs** configure each business — which teams it uses, service areas, phone numbers, Slack channels, tracking sheet ID.
- **Pipelines** are the code that runs for each business. They load config from the YAML via `--business {slug}`.
- **Skills** (in `~/.claude/skills/`) are instruction files that tell Claude how to operate each pipeline.
- A business YAML never contains logic. A skill never contains business-specific data.

## Key Commands

- `/org-status` — quick status check across all businesses
- `/deploy-team` — deploy a team template to a business
- `/new-project` — start a new business project

## Live Deployments

| Business | Pipeline | Runs On | Schedule |
|----------|----------|---------|----------|
| SafeBath | SEO Content | GitHub Actions | Daily 6am ET |
| SafeBath | SEO Reporting | GitHub Actions | Weekly Tues 9am ET |
| SafeBath | Content Builder | GitHub Actions | Weekly Wed 6am ET |
| SafeBath | Analytics | GitHub Actions | Weekly Mon 8am ET |
| GHL | Podcast (35 posts/cycle: EN/ES/IN/AR) | IONOS VPS | 24/7, 25h cycles |
| GHL | SEO Reporting | GitHub Actions | Weekly Tues 9am ET |
| GHL | Content Builder | GitHub Actions | Weekly Wed 6am ET |
| GHL | Analytics | GitHub Actions | Weekly Mon 8am ET |

## Skills

| Skill | Purpose |
|-------|---------|
| `/report` | Weekly reports, error alerts, CEO digests (silent on success) |
| `/localize` | Classify language + topic, localize CTAs/pricing |
| `/topics` | 3-tier topic sourcing (GHL docs, GSC gaps, market verticals) |
| `/social` | Social posts from ops activity |
| `/org-status` | Status check across all businesses |
| `/deploy-team` | Deploy team template to a business |
| `/todo-agent` | Execute Sheet TODOs (SEO, content, investigation) |
| `/content-builder` | Build pages from SEO gaps/opportunities |
| `/pipeline-doctor` | Diagnose + fix pipeline failures |
| `/analytics-team` | GA4 analysis, insights, dispatch |

## Design Principles

1. **Skills first** — every new capability is built as a reusable skill BEFORE it gets wired into a trigger, pipeline, or script. If it does something useful, it's a skill. Then triggers reference that skill's logic.
2. Configure once, run forever — setup handles all customization
3. Clone and deploy — same skill, different business, zero code changes
4. Edit once, updates everywhere — skills are shared, not copied. Never bake logic directly into a trigger prompt without a matching skill.
5. Every business gets a Google Sheet tracker with 7 standard tabs (SEO Changelog, Analytics, Active TODOs, Build Queue, Directory Log, Weekly SEO Report, Costs)

## Owner

Bill (William Welch) — non-developer. Explain everything in plain English.
Agency: REI Amplifi. Dashboard: https://dashboard-pied-three-98.vercel.app
