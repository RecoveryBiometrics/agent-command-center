# Agent Command Center — Routing

## What do you want to do?

### Run a pipeline
| Pipeline | Path | Schedule | Business |
|----------|------|----------|----------|
| Daily SEO content + directory | `pipelines/seo-content/` | Daily 6am ET | SafeBath |
| Weekly SEO reporting | `pipelines/seo-reporting/` | Tuesdays 9am ET | SafeBath |
| Weekly analytics | `pipelines/analytics/` | Mondays 8am ET | SafeBath, GHL |
| Content builder (from TODOs) | `pipelines/content-builder/` | Wednesdays 6am ET | SafeBath |
| Interlinking | `pipelines/interlinking/` | After content changes | SafeBath |
| Directory discovery | `pipelines/directory/` | Daily 6am ET | SafeBath |

All pipelines run with `node index.js --business {slug}`.

### Configure a business
Business YAMLs live in `businesses/`. One YAML per business = complete config.
- `safebath.yaml` — live, all pipelines active
- `globalhighlevel.yaml` — live, podcast + analytics
- `hatch.yaml` — live, OM builder (on-demand, not a pipeline)

### Read the instructions for a pipeline
Every pipeline has a `CONTEXT.md` at the root and at each stage.
Open the pipeline folder → read CONTEXT.md → it tells you what the stages do.
ICM-structured pipelines (content-builder, interlinking, social-content) also have `references/` with stable rules.

### Use a skill manually
Skills live at `~/.claude/skills/`. The repo copy at `skills/` is a backup.
| Skill | What it does |
|-------|-------------|
| `/seo-content-pipeline` | Run daily SEO content engine |
| `/content-builder` | Build content from SEO TODOs |
| `/interlinking` | Rebuild internal links + audit |
| `/analytics-team` | Analyze GA4, surface insights |
| `/social` | Generate FB posts from ops activity |
| `/pipeline-doctor` | Diagnose and fix failing pipelines |
| `/org-status` | Status check across all businesses |
| `/todo-agent` | Execute TODOs from Sheet |
| `/podcast-pipeline` | Run podcast + blog production |
| `/deploy-team` | Deploy a team template to a business |
| `/om-builder` | Generate offering memorandums |
| `/new-project` | Start a new business project |

### Check on something
- Pipeline health → `/org-status` or check `#ops-log` in Slack
- SEO performance → tracking Sheet → "Weekly SEO Report" tab
- What's been built → `git log` in the business repo
- Active TODOs → tracking Sheet → "Active TODOs" tab

### Add a new business
1. Copy `businesses/_template.yaml`, fill it in
2. Run `/new-project` to set up repo + Sheet + Slack channel
3. Run `/deploy-team` to wire up pipelines
