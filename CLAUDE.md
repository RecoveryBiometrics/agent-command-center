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

## RESUME HERE — Next Session Priority Order

### What was DONE (2026-03-28):
1. Mapped all 7 projects across ~/Projects/ and ~/Developer/projects/
2. Created CLAUDE.md files for 3 projects that were missing them (podcast-pipeline, mailer-dashboard, safebath root)
3. Created master project tracker in Claude memory (all 8 projects now tracked)
4. Wrote 2 reusable skills as SKILL.md playbooks:
   - **SEO Content Pipeline** — SafeBath's 6-agent daily pipeline + directory + weekly SEO reports, fully configurable (30+ variables)
   - **Podcast Pipeline** — Content Autopilot's 5-step pipeline + 3-agent blog system, fully configurable
5. Built the **visual dashboard** (Next.js) showing all businesses, teams, agents, skills
6. Dashboard builds clean and runs at localhost:3000

### What was DONE (2026-03-29):
1. Bill reviewed the dashboard — fixed Podcast Pipeline showing no agents
2. Added Blog Production Team (3 agents) to GlobalHighLevel
3. Added Core Pipeline Team (3 agents) to Podcast Pipeline Engine
4. Added **rich agent detail** to every agent: duties list, inputs, outputs, self-healing, tools, cost
5. Built **clickable agent detail panel** — slide-out from right with full agent profile
6. All 25+ agents now have complete job descriptions viewable from the dashboard

### What to do NEXT (in order):
1. **Deploy dashboard** — push to GitHub, deploy to Vercel so it has a real URL
3. **Build setup wizards** — interactive scripts inside each skill that generate .env + config for a new business
4. **Connect to Slack** — install Claude for Slack, add Slack MCP server
5. **Set up GitHub MCP** — so agents can see across all repos
6. **Write remaining skills** — GHL Integration, OM Generation
7. **Make dashboard live** — pull real agent status from GitHub Actions, show actual last-run times
8. **Daily Slack reports** — scheduled agents post morning briefings to a #ceo-briefing channel

### Big Picture Vision
- This becomes an **Agent Workforce Manager** product
- Skills = reusable SOPs that deploy to any business
- Teams = templates you clone across businesses
- Dashboard = war room showing all agents everywhere
- Slack = communication layer (give orders, get reports)
- Eventually: visual skill builder (drag-and-drop like n8n), skill marketplace, multi-tenant for clients
