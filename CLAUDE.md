# Agent Command Center

## What This Is
The central hub for Bill's AI agent workforce. Contains reusable skills (SOPs), team templates, and eventually a visual dashboard for managing agents across all businesses.

## Structure
```
skills/                    — Reusable agent playbooks (SOPs)
  seo-content-pipeline/    — Daily SEO content generation + publishing
  podcast-pipeline/        — Content-to-podcast automation
docs/                      — Architecture docs, planning
```

## How Skills Work
Each skill is a self-contained playbook that any agent team can run. Skills are configurable — when you spin up a new business, you run the setup wizard and the skill adapts to that business's name, niche, service areas, phone numbers, tone, etc.

## Key Context
- Owner: Bill (William Welch) — non-developer, explain in plain English
- Agency: REI Amplifi
- First deployments: SafeBath (SEO pipeline), GlobalHighLevel (podcast pipeline)
- Goal: Productize this into a visual agent workforce manager
- Skills should be reusable across any business vertical
- Every skill needs a setup wizard for non-technical users

## Design Principles
1. **Configure once, run forever** — setup wizard handles all customization
2. **Clone and deploy** — same skill, different business, zero code changes
3. **Shared improvements** — update a skill, all teams using it get the upgrade
4. **Observable** — every agent reports what it did, what failed, and why
5. **Non-technical first** — if Bill can't use it without coding, it's not done
