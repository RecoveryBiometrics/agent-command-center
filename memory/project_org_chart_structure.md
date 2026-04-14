---
name: REI Amplifi org chart structure (Brands × Departments × Roles)
description: The canonical three-layer organizational structure for everything REI Amplifi builds. Mirrors how multi-brand companies like P&G, Unilever, Disney, and Amazon organize. Use this as the directory and naming convention for code paths, business configs, and Miro boards.
type: project
originSessionId: 48fd5669-d3e5-4873-9eb6-625d47d0b3c8
---
# REI Amplifi org chart structure

## The three-layer structure

```
  REI AMPLIFI (the company)
  │
  ├─ BRANDS (the business units)
  │   • GlobalHighLevel
  │   • SafeBath
  │   • Ice Machines
  │   • REI Amplifi (parent agency)
  │   • Bass Forecast (pending, contract not signed)
  │   • Hatch Investments (mothballed)
  │
  └─ DEPARTMENTS (shared functions that serve all brands)
      • Editorial    publishes written content (blogs, posts, hubs)
      • Audio        produces podcast episodes
      • Operations   physical infrastructure (ice machines, install routes)
      • Analytics    measures everything across all brands
      • Strategy     plans, decides, sets rules (Bill, mostly)
      
      Each department contains ROLES.
```

This is the standard matrix organization model used by P&G (the inventor of brand management in 1930s), Unilever, Disney, Amazon, and most multi-brand companies.

## Why this structure

Bill clarified on 2026-04-14 that he conceptualizes REI Amplifi as a real company with departments, not as a flat collection of pipelines. Brands sit on top. Departments do the work across all brands. Roles inside each department do specific tasks.

For a solo operator with AI agents, this maps directly: each "role" is implemented by an AI agent or pipeline stage. Brands × roles becomes a manageable matrix instead of a tangle of per-business code.

When Bill eventually hires a human (virtual assistant, contracted writer, specialist), they slot into the same org chart, the same role. They do not have to learn a new system.

## Department list and what each does

### Editorial Department (formerly the proposed "content-platform")

Produces all written content for any brand. The pipeline that takes a topic from any source and turns it into a published, fact-checked, link-wired blog post.

**Roles inside Editorial:**
- Researcher: pulls per-market SERP + Reddit
- Writer (per language): drafts the post following the brand's article template
- Editor: fact-checks, strips banned phrases, validates pricing, enforces voice rules
- Link Builder: wires internal links per brand's interlinking rules
- Publisher: saves the post, commits to the brand's repo, triggers deploy
- Distribution: indexing API submission, social drafts queued for human review

### Audio Department

Currently produces podcast episodes for the GHL brand. Could expand to other brands if the audio thesis proves out.

**Roles inside Audio:**
- Scraper: pulls source content (currently help.gohighlevel.com)
- NotebookLM Producer: generates audio via Playwright automation
- SEO Writer: produces title, description, tags
- Transcriber: Gemini transcription of audio
- Publisher: uploads to Transistor

This department continues to live in the existing ghl-podcast-pipeline codebase until a future migration.

### Operations Department

Physical infrastructure businesses. Currently the Ice Machines brand.

**Roles inside Operations:**
- Site Scout: maps gap database, identifies placement opportunities
- Service Partner Liaison: coordinates contracted route partner
- Pricing Optimizer: dynamic pricing logic per machine per condition
- Financial Tracking: per-LLC accounting, Stripe reconciliation

### Analytics Department

Measures everything across all brands. Already exists as a shared pipeline at agent-command-center/pipelines/analytics/.

**Roles inside Analytics:**
- GSC Pull: per-brand Search Console data
- GA4 Pull: per-brand Analytics 4 data
- Trend Detector: identifies anomalies
- Insights Writer: generates plain-language explanations
- Dispatcher: routes recommendations to other departments as Active TODOs

### Strategy Department

Bill, mostly. Decision-making, escalations, plan changes, rule changes. Memory files capture these decisions for persistence across Claude sessions.

## Naming decisions made and rejected

During the 2026-04-14 design session, the following names were considered for what became the Editorial Department:

- **publisher**: rejected because it suggested only the OUTPUT step
- **press**: rejected as too poetic
- **articles**: rejected because too narrow (focused on output, not process)
- **content-platform**: rejected because "content" is too vague (could mean videos, ads, social, anything)
- **newsroom**: rejected because requires journalism jargon to decode
- **bureau**: rejected as obscure
- **beats**: rejected as journalism jargon

**Editorial Department** chosen because:
- Maps to a real company department
- Self-explanatory without metaphor
- Other departments (Audio, Operations, Analytics, Strategy) emerge naturally
- Roles inside are recognizable to anyone

## Code path

```
  agent-command-center/
  ├── brands/                          (proposed rename from "businesses/")
  │   ├── globalhighlevel.yaml
  │   ├── safebath.yaml
  │   ├── ice-machines.yaml
  │   ├── reiamplifi.yaml
  │   ├── bass-forecast.yaml           (status: pending)
  │   └── hatch.yaml                   (status: mothballed)
  │
  └── departments/
      ├── editorial/                   (NEW, the publisher pipeline)
      │   ├── roles/
      │   │   ├── researcher/
      │   │   ├── writer/
      │   │   ├── editor/
      │   │   ├── link-builder/
      │   │   ├── publisher/
      │   │   └── distribution/
      │   ├── style-guide.md
      │   └── README.md
      │
      ├── audio/                       (existing podcast pipeline migrates here later)
      ├── operations/                  (NEW, ice machine intel + finance)
      ├── analytics/                   (existing pipeline moves here)
      └── strategy/                    (mostly docs, decisions, memory)
```

The rename of `businesses/` to `brands/` is proposed but NOT yet executed. Memory files and existing YAMLs still reference `businesses/`. When the migration happens, it should be a single coordinated rename.

## Migration order

```
  Phase 1: Build Editorial Department from scratch with TRADES
           pipeline as the first internal customer
  
  Phase 2: Migrate the podcast blog writing into Editorial
           (Phase 1 must validate first)
  
  Phase 3: Migrate SafeBath content production into Editorial
  
  Phase 4: Onboard new brands (one YAML file each)
```

## On adding new brands or departments

When a new brand is onboarded:
1. Create `brands/[new-brand].yaml`
2. Specify which departments serve this brand
3. Per-department config in the YAML (e.g., editorial config: which template, which markets, where to deploy)

When a new department is added (rare):
1. Create `departments/[new-dept]/`
2. Add roles inside
3. Update brand YAMLs to enable the new department where relevant

## Related memory files

- `project_trades_pipeline.md` — the Editorial Department's first internal customer
- `project_single_source_of_truth.md` — the YAML + shared pipelines + skills + Sheets architecture
- `feedback_no_done_for_you_work.md` — operating rule that informs how Editorial routes customers
- `feedback_no_licensing_the_moat.md` — the moat rule that keeps Editorial code internal
