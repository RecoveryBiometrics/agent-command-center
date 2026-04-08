---
description: Build content from SEO TODOs — reads gaps/opportunities from Sheet, researches, writes, fact-checks, interlinks, and deploys.
invocation: /content-builder
when_to_use: When the user wants to build content from SEO gaps or opportunities, or to run the content builder pipeline.
---

# Content Builder Pipeline

Reads Active TODOs from the business tracking Sheet, builds content for SEO gaps, and deploys it.

## Usage
```
/content-builder                        # run for SafeBath
/content-builder safebath --dry         # dry run (classify + research, don't deploy)
/content-builder safebath --max 2       # process max 2 TODOs
```

## Codebase
- Pipeline: `agent-command-center/pipelines/content-builder/`
- Config: `businesses/{slug}.yaml` → `content_builder:` section
- Reads: Google Sheet "Active TODOs" tab
- Writes: `src/data/local-news/{city}.json` in business project

## Stages (ICM-structured)
1. **01-classify** — Read TODOs from Sheet, parse gap/opportunity type
2. **02-research** — Research keyword via Claude Haiku (~$0.01/keyword)
3. **03-write** — Generate article JSON matching LocalNewsEntry schema
4. **04-check** — Fact check + SEO audit (title, meta, similarity)
5. **05-link** — Add relatedLinks via interlinking pipeline
6. **06-deploy** — Write to city JSON, git commit+push, update Sheet

## References (Layer 3)
- `references/voice.md` — SafeBath content voice rules
- `references/seo-rules.md` — title/meta/slug validation rules
- `references/content-rules.md` — categories, quality thresholds, JSON schema

## How TODOs get here
1. SEO Reporting pipeline runs Tuesdays
2. Writes TODOs to "Active TODOs" tab:
   - Gap: "No page for 'keyword' — X impressions, position Y"
   - Opportunity: "Optimize /slug — position X, Y impressions"
3. Content builder runs Wednesdays, picks up new TODOs

## What it handles vs what stays manual
- **Automated:** Gap → research → write → check → link → deploy
- **Manual:** Opportunity optimization (v1 marks as "Noted"), Investigate items
