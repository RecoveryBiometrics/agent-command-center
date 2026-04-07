---
name: SEO Content Pipeline
description: Run, audit, or deploy the daily SEO content pipeline for any business. Covers event scraping, article writing, fact checking, SEO auditing, business discovery, directory management, and weekly SEO reporting.
user-invocable: true
---

# SEO Content Pipeline

You are operating the SEO Content Pipeline skill. This is a fully automated daily content engine used across multiple businesses.

## When to use this skill
- User says /seo-content-pipeline or asks about SEO content, local content, event scraping, directory listings, or weekly SEO reports
- User wants to audit, debug, or improve any part of the SEO pipeline
- User wants to deploy this pipeline to a new business

## Loading Business Config
When operating on a business, ALWAYS read its config first:
1. Read `~/Projects/agent-command-center/businesses/{business-id}.yaml`
2. All config comes from that file — do NOT ask the user for values that are already in the YAML

## Codebase Locations

### Shared Pipeline Code (central, all businesses use this)
- **SEO Content:** `~/Projects/agent-command-center/pipelines/seo-content/`
- **Directory:** `~/Projects/agent-command-center/pipelines/directory/`
- **SEO Reporting:** `~/Projects/agent-command-center/pipelines/seo-reporting/`
- Run locally: `node index.js --business {slug}`
- Run in CI: GitHub Actions checks out agent-command-center and runs with `BUSINESS_PROJECT_PATH` set
- Change the pipeline once, every business gets the update on next run

### SafeBath (primary deployment)
- **Website + All Pipelines:** `~/Developer/projects/safebath/` (Next.js 15, Vercel)
- **Repo:** RecoveryBiometrics/safebath-website (the ONE repo — content, directory, and SEO reporting all run here)
- **Legacy SEO repo:** RecoveryBiometrics/safebath (planned for archival — weekly report moving to safebath-website)
- **Live URL:** safebathgrabbar.com
- **Tracking Sheet:** SEO changelog + analytics logged to Google Sheet via `tracking_sheet_id` in YAML

## The SEO Content Pipeline (6 agents, runs daily)

### Scripts in `pipelines/seo-content/`
| File | Purpose |
|------|---------|
| `index.js` | Main entry point, orchestrates the full pipeline |
| `config.js` | Loads business YAML, resolves paths, handles CI vs local, loads TRACKING_SHEET_ID |
| `researcher.js` | Scrapes Eventbrite, Patch.com, AllEvents.in for real local events |
| `copywriter.js` | Writes 2-3 paragraph articles tying events to business niche |
| `fact-checker.js` | Pass 1: validates future dates. Pass 2: checks cross-city uniqueness (85% threshold) |
| `seo-audit.js` | Validates titles (<60 chars), meta descriptions (120-160 chars), slugs, schema. Auto-fixes |
| `engineer.js` | Writes JSON to data dir, logs change to Google Sheet, git commit, git push. Auto-deploys (async) |
| `sheet.js` | Logs article changes to Google Sheet "SEO Changelog" tab (Sheet-first, JSON fallback) |
| `changelog.js` | Legacy: tracks page changes in local JSON file (superseded by sheet.js) |
| `email.js` | Daily pipeline summary via Gmail OAuth |
| `cities.js` | City parsing and URL slug generation |

### Agent Flow
1. **Researcher** → Scrapes events (8 cities/day, max 5 events per city, deduplicated by title)
2. **Fact Checker #1** → Validates events are future-dated, filters junk. Retries up to 3x.
3. **Copywriter** → Writes articles with CTA using correct phone per region. Deduplicates against existing articles.
4. **Fact Checker #2** → Checks cross-city uniqueness (85% similarity threshold). Sends back for revision if too similar.
5. **SEO Auditor** → Validates titles, meta descriptions, slugs, schema, H1. Auto-fixes common issues.
6. **Engineer** → Writes JSON to configured data directory, merges with existing articles (append, don't replace). Logs each city batch to Google Sheet "SEO Changelog" tab so the SEO reporting pipeline can attribute ranking changes to content updates.

### Analytics Dispatch Integration
The content pipeline reads dispatch instructions from the analytics team on startup:
- `config.js` checks for `state/{businessId}/analytics-dispatch.json`
- `index.js` calls `applyDispatch()` which reorders the city queue based on:
  - `prioritize_cities` — moves matching cities to the front of the batch
  - `avoid_cities` — removes cities from the queue (saturated or low-converting)
  - `prioritize_categories` — weights content categories (logged, not yet acted on by copywriter)
- After the pipeline completes, the dispatch file is cleared
- If no dispatch file exists, the pipeline runs normally (zero risk)

### Configuration
- CITIES_PER_RUN (default 8)
- MAX_SIMILARITY_PERCENT (default 85)
- MAX_RETRY_ATTEMPTS (default 3)
- Phone overrides by county (from YAML)
- City slug prefix
- Content categories: safety-tip, local-news, community, seasonal, stats

## The Directory Pipeline

### Scripts in `pipelines/directory/`
| File | Purpose |
|------|---------|
| `index.js` | Main entry — `--history` for wiki track, `--businesses` for discovery track |
| `config.js` | Loads business YAML config |
| `fetch-all-wiki.js` | Fetches Wikipedia REST API for city summaries/demographics/history |
| `generate-history.js` | Generates city history JSON files |
| `fill-missing-history.js` | Fills gaps in wiki data |
| `agents/discoverer.js` | Gemini 2.0 Flash with grounded web search — finds real local businesses |
| `agents/verifier.js` | Re-confirms each business exists and is currently operating |
| `agents/categorizer.js` | Assigns business types from configured category list |
| `agents/engineer.js` | Merges verified businesses into city wiki JSON files |
| `agents/auditor.js` | Scores listings 0-100 (phone, website, address, description checks) |
| `agents/researcher-agent.js` | Fact-checking and correction |
| `agents/quality-report.js` | Summary statistics |
| `agents/places-enricher.js` | Adds Google Places data (ratings, hours, photos) |
| `deep-fact-check.js` | Deep verification of listings |
| `verified-corrections.js` | Curated correction overrides |
| `verify-and-clean.js` | Cleanup pass |

### Two Tracks
- **Track 1 (History):** `node index.js --history [--all|--city SLUG]` — Wikipedia data → city JSON
- **Track 2 (Businesses):** `node index.js --businesses [--all|--city SLUG]` — Gemini discovery → verification → categorization → merge

### Rate Limits
- 15 requests/min, 4000ms delay, max 15 calls per city
- CITIES_PER_RUN default 10

## The SEO Reporting Pipeline (weekly)

### Scripts in `pipelines/seo-reporting/`
| File | Purpose |
|------|---------|
| `index.js` | Main entry point |
| `config.js` | Loads business YAML config, loads trackingSheetId |
| `auth.js` | Google service account auth (webmasters, analytics, spreadsheets.readonly) |
| `sheet.js` | Reads "SEO Changelog" from Sheet + writes weekly summary to "Weekly SEO Report" tab |
| `fetch-gsc.js` | Pull Google Search Console data (28-day window) |
| `fetch-ga4.js` | Pull Google Analytics 4 metrics (optional, graceful failure) |
| `inspect.js` | Check URL indexing status via URL Inspection API (200 pages/run) |
| `analyze.js` | Find wins (up 3+), drops (down 3+), opportunities (positions 8-20), gaps (impressions but no clicks) |
| `interpret.js` | Connects GSC movement to changelog entries from Sheet (async, Sheet-first) |
| `review.js` | Validates interpretations, flags false correlations |
| `report.js` | Generates markdown report + client email (async, reads pending changes from Sheet) |
| `todos.js` | Extracts opportunities/gaps/drops as TODOs, writes to "Active TODOs" Sheet tab, formats Slack action items |
| `email.js` | Send report via email |
| `slack.js` | Post formatted report to Slack business channel |

### SEO Reporting Flow (shared pipeline)
- Fetches GSC/GA4 data → reads "SEO Changelog" tab from Google Sheet → connects ranking changes to content updates → generates report → posts to Slack
- Writes weekly summary (clicks, impressions, CTR, position, indexed, wins, drops) to "Weekly SEO Report" Sheet tab
- Writes opportunities, gaps, and unexplained drops to "Active TODOs" tab (deduped)
- Posts a separate "Action Items" Slack message with human-required vs agent-handled classification
- Falls back to `SEO-CHANGELOG.md` markdown file if Sheet unavailable
- Reports saved to `seo-reports/` (dated markdown), state in `seo-data/`

### Directory Pipeline — Analytics Dispatch
The directory pipeline (`pipelines/directory/`) also reads dispatch instructions:
- `config.js` checks for `state/{businessId}/directory-dispatch.json`
- `index.js` reorders city list based on `prioritize_regions` instructions
- Clears dispatch file after run

## GitHub Actions (SafeBath)

### Daily Content Pipeline (`.github/workflows/daily-content-pipeline.yml`)
- **Schedule:** Daily 6am ET (10:00 UTC)
- **Steps:**
  1. Content pipeline — scrape events, write articles, auto-deploy
  2. Business discovery — verify and add new businesses to directory
  3. GSC keyword miner — find new landing page opportunities
  4. Places API enrichment — add ratings, hours, photos to listings
  5. Quality audit — auto-fix listing issues
  6. Commit changes, ping Google sitemap, send Slack report

### Weekly SEO Report (`.github/workflows/weekly-seo-report.yml`)
- **Schedule:** Every Tuesday 9am ET (13:00 UTC)
- **Steps:** Fetch GSC → Inspect indexing → Analyze → Report → Slack

## SafeBath Website Architecture
- **Framework:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Pages:** 1,427+ geo-targeted location pages, 366+ directory listings
- **Key files:**
  - `src/lib/constants.ts` — Single source of truth: locations, services, business info, phone routing
  - `src/lib/directory.ts` — Deduplicates ~1000 raw listings into ~366 unique entries
  - `src/data/city-wiki/` — 167 city JSON files
  - `src/data/local-news/` — Daily pipeline article data
  - `src/app/api/ghl-webhook/route.ts` — GoHighLevel CRM webhook
  - `src/ai/flows/` — Genkit AI content generation flows

## Currently Deployed
- **SafeBath** — Daily content + directory + weekly SEO reports (GitHub Actions + Vercel)
- Check `~/Projects/agent-command-center/businesses/` — any YAML with `seo-content-team` in its `teams:` section

## Cost Per Business
~$1.50/month (Claude Haiku + Gemini)

## Common Tasks
- "Audit the SafeBath pipeline" → Read safebath.yaml, check pipeline-state.json and quality-scores.json in the business project
- "Why did a city get skipped?" → Check pipeline state offset + logs for retry failures
- "Add a new service area" → Update the business YAML's service_areas section, reset pipeline state offset
- "Check directory quality" → Run quality-report.js, look at auditor scores
- "Check indexing status" → Run inspect.js, compare indexed vs pending pages
- "Deploy to new business" → Use /deploy-team (reads from YAML, sets up everything)
