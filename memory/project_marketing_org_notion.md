---
name: Marketing Org Notion Hub
description: The single Notion page + 3 linked databases that map every business, pipeline, and agent. Built 2026-04-13.
type: project
originSessionId: a406e05f-429c-4b08-b1d1-b96571eb04aa
---
**Marketing Org page:** https://app.notion.com/34192a787a9d80e7b010fd938da31366

Three live linked databases under it (all in workspace where Claude integration is authorized):
- **Businesses DB** — `collection://25a038a4-f912-406e-9c99-6bf07038c83b` — 5 rows (GHL, SafeBath, Power to the People, Hatch, REI Amplifi)
- **Pipelines DB** — `collection://45442b73-aa7e-48f1-95cf-6ae154dda5b1` — 6 rows (Daily VPS, Weekly Analytics, Weekly Report, Weekly Content Builder, SEO Optimizer, OM Builder)
- **Agents DB** — `collection://93a17697-76cc-4ecf-91ba-5a479f90c12a` — 16 rows (every skill in `~/.claude/skills/`)

All linked by two-way relations. Agents DB has Stage column (01-source through 07-orchestrate + product) reflecting proposed ICM folder reorg.

**Sub-page:** "🏢 The Team (Org Chart)" — reframes agents as job titles in 7 departments. Cleanest visual we built.

**Why:** User wanted GHL-workflow-builder-style live visual; Notion can't do that natively. DBs + org-chart page are the best-fit Notion can deliver. For true visual workflow editor → n8n self-hosted on IONOS VPS (not yet installed; SSH key in skill file is stale).

**How to apply:** When user asks about "the system" or "my agents/pipelines/businesses" — read from these DBs first instead of re-discovering from skill files. Update the DBs when skills/businesses change.

**Pending merges flagged in Agents DB Merge Target column:**
- seo-content-pipeline + content-builder → 02-produce/content
- reporting + org-status → 06-report/weekly
- new-project + deploy-team → 07-orchestrate/setup
