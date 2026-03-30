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
1. Bill reviewed dashboard — fixed Podcast Pipeline showing no agents, added Blog Production + Core Pipeline teams
2. Added clickable agent detail panels with full duties, inputs, outputs, tools, cost
3. **Deployed dashboard to Vercel** — live at https://dashboard-pied-three-98.vercel.app
4. **Restructured to Lego Model:**
   - 26 reusable Roles (individual Lego pieces) in lego-pieces/roles/
   - 5 Team Templates (assembled sets) in lego-pieces/team-templates/
   - Team Instances (deployed teams tied to businesses with schedules)
5. **Built Org Chart:** CEO → 3 VPs → 8 Directors → Teams → Roles. 3 dashboard views (Org Chart, Businesses, Skills & Roles)
6. Cleaned up businesses: removed fake GHL Automator, merged podcast+blog, corrected IONOS attribution
7. **Created 5 global Claude Code skills** in ~/.claude/skills/:
   - /seo-content-pipeline, /podcast-pipeline, /new-project, /deploy-team, /org-status
8. **Symlinked skills** — one source of truth in ~/.claude/skills/, every project links to it. Update once, changes everywhere.
9. Updated all project CLAUDE.md files with Org Position + Skills Used sections
10. Fixed VS Code workspace — all 8 projects + Global Skills folder in sidebar
11. Shelved visual builder — focus on operational excellence first

### What was DONE (2026-03-30):
1. Built **Health view** — default dashboard tab showing critical/warning/info/healthy alerts
2. Auto-detects: not-running businesses, idle teams, skill gaps, no-team businesses
3. Red badge on Health tab shows count of items needing attention
4. Deployed to Vercel — live
5. **Started Slack setup:**
   - Bill has Reiamplifi Slack workspace (bill@reiamplifi.com)
   - Slack connector connected in Claude Desktop
   - Need to create Slack app at api.slack.com/apps for Claude Code MCP access
   - Stopped at: "Create New App → From scratch → Name: Agent Command Center → Reiamplifi workspace"

### What to do NEXT (in order):
1. **FINISH SLACK SETUP** — go to api.slack.com/apps, create "Agent Command Center" app, set permissions, install to workspace, add MCP to Claude Code
2. **Create Slack channels** — #ceo-briefing, #safebath, #globalhighlevel, #hatch
3. **Get Hatch deployed** — revenue is waiting (Bill working on this in separate terminal)
4. **Clone SEO pipeline to a 2nd business** — prove the Lego model works
5. **Set up GitHub MCP** — agents can see across all repos
6. **Write remaining skills** — GHL Integration, OM Generation
7. **Pull real agent status** — connect dashboard to GitHub Actions for live last-run times

### Big Picture Vision
- Lego model: Roles snap into Teams, Teams deploy to Businesses, Skills update once everywhere
- Dashboard = war room (live at Vercel, shareable URL)
- Slash commands = operational SOPs (/org-status, /deploy-team, /new-project)
- Slack = communication layer (give orders, get reports)
- Visual builder shelved until 5+ clients need self-serve
