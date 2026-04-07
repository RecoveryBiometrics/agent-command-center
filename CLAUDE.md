# Agent Command Center

Central hub for all REI Amplifi AI agent operations. Contains reusable skills, business configs, pipeline code, and a visual dashboard.

## Structure

```
businesses/     — one YAML per business (single source of truth for config)
pipelines/      — the actual code that runs the pipelines
dashboard/      — Next.js visual dashboard (live on Vercel)
```

**Skills live globally at `~/.claude/skills/`** (not in this repo). They are Claude Code instruction files that reference the pipelines and YAMLs here.

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

| Business | Skill | Runs On | Schedule |
|----------|-------|---------|----------|
| SafeBath | SEO Content Pipeline | GitHub Actions | Daily 6am ET |
| SafeBath | SEO Reporting | GitHub Actions | Weekly Tues 9am ET |
| GlobalHighLevel | Podcast Pipeline | IONOS VPS | 24/7, 25-hour cycles |

## Design Principles

1. **Skills first** — every new capability is built as a reusable skill BEFORE it gets wired into a trigger, pipeline, or script. If it does something useful, it's a skill. Then triggers reference that skill's logic.
2. Configure once, run forever — setup handles all customization
3. Clone and deploy — same skill, different business, zero code changes
4. Edit once, updates everywhere — skills are shared, not copied. Never bake logic directly into a trigger prompt without a matching skill.
5. Every business gets a Google Sheet tracker (SEO changelog, TODOs) — keeps token usage low

## Owner

Bill (William Welch) — non-developer. Explain everything in plain English.
Agency: REI Amplifi. Dashboard: https://dashboard-pied-three-98.vercel.app
