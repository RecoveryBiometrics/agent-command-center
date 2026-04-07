---
name: Single Source of Truth Architecture
description: Business YAML registry + shared pipelines + global skills — how config, code, and instructions are centralized
type: project
---

As of 2026-04-07, the project is structured as a "franchise model" with three central sources of truth:

1. **Business Registry** — `agent-command-center/businesses/*.yaml` — one YAML per business with ALL config
2. **Shared Pipelines** — `agent-command-center/pipelines/{seo-content,directory,seo-reporting,analytics}/` — ONE copy of pipeline code, run with `--business {slug}`
3. **Global Skills** — `~/.claude/skills/` — 7 skill files that document every pipeline, script, and tool

**Folder structure:**
- `~/Projects/agent-command-center/` — the brain (YAMLs, pipelines, dashboard)
- `~/Projects/hatch-investments/` — live OM Builder app (Render)
- `~/Developer/projects/safebath/` — SafeBath website (Vercel + GitHub Actions) — repo: `RecoveryBiometrics/safebath-website`
- `~/Developer/projects/marketing/podcast-pipeline/` — GHL podcast pipeline (IONOS VPS)
- `~/Developer/projects/marketing/mailer-dashboard/` — mailer (in development)
- `~/Developer/projects/ops/` — trigger routing config (projects.yml)

**SafeBath repos (IMPORTANT — was a source of confusion):**
- `RecoveryBiometrics/safebath-website` — the REAL repo. Next.js site, content pipeline, directory pipeline, all daily work runs here.
- `RecoveryBiometrics/safebath` — legacy SEO data store (weekly report only). Planned for archival once weekly report moves to safebath-website.
- The YAML `org.github` now points to `safebath-website` (fixed 2026-04-07).

**Google Sheet integration (wired 2026-04-07):**
- Each business has a tracking sheet (`tracking_sheet_id` in YAML)
- Content pipeline WRITES to "SEO Changelog" tab after creating articles
- SEO reporting pipeline READS "SEO Changelog" tab to connect changes to GSC/GA4 movement
- Analytics pipeline WRITES to "Analytics" tab
- Both seo-content and seo-reporting have Sheet-first with markdown fallback

**Skills (7 total):** `/seo-content-pipeline`, `/podcast-pipeline`, `/pipeline-doctor`, `/deploy-team`, `/om-builder`, `/new-project`, `/org-status`

**Standard tracker sheet tabs (every business gets all 7):**
1. SEO Changelog — content pipeline writes after creating articles
2. Analytics — analytics pipeline writes weekly
3. Active TODOs — analytics pipeline writes suggestions
4. Build Queue — ideas/things to build for this business
5. Directory Log — directory pipeline writes
6. Weekly SEO Report — reporting pipeline writes
7. Costs — track actuals over time

**Franchise-wide sheet:** REI Amplifi Tracker (`1LKbt9n9xfPv76-9kpOM8oxv8jFMXMlWGSukCDWTD8pA`) — Build Queue + Costs tabs for cross-business items.

**How to apply:**
- Adding a new business: copy `_template.yaml`, fill in, run `/new-project`, create tracker sheet with all 7 tabs, share with service account
- Changing pipeline behavior: edit ONE file in `pipelines/`, all businesses get it
- Adding/changing a script: MUST update the matching skill in the same session (enforced in Projects/CLAUDE.md)
- NEVER hand-edit `workforce.ts` — edit the YAML instead
- Ops `projects.yml` is for trigger routing only — primary config is in the YAMLs
- SafeBath has TWO repos — always check `safebath-website` first, that's where everything runs
