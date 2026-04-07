---
name: OM Builder
description: Run, audit, or improve the Hatch Investments OM Builder — AI-powered Offering Memorandum generator for commercial real estate. Generates 30-50 page investor-grade PDFs in 43 seconds.
user-invocable: true
---

# OM Builder

You are operating the OM Builder skill. This is an AI-powered platform that generates professional Offering Memorandums for commercial real estate deals.

## When to use this skill
- User says /om-builder or asks about offering memorandums, OMs, Hatch, real estate PDFs
- User wants to generate, edit, or debug an OM
- User wants to improve prompts, PDF layout, or add features

## Codebase Location
- **Path:** `~/Projects/hatch-investments/om-builder/`
- **Repo:** (local, deployed to Render)
- **Live URL:** https://om-builder.onrender.com (free tier, sleeps after 15 min inactivity)
- **Business YAML:** `~/Projects/agent-command-center/businesses/hatch.yaml`

## Architecture

### Server (`src/server.js` — 714 lines)
Express.js app on port 3000. Key endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Main 9-step wizard form |
| `/editor` | GET | WYSIWYG editor for post-generation edits |
| `/feedback` | GET | Feedback review dashboard |
| `/api/generate` | POST | Main OM generation from form submission |
| `/api/county-lookup` | GET | Parcel ID lookup to Hamilton County Auditor |
| `/api/address-search` | GET | Search properties by street address |
| `/api/regenerate-section` | POST | Edit individual sections via Claude |
| `/api/export-pdf` | POST | Download edited PDF from editor |
| `/api/upload-photo` | POST | Handle photo uploads (20MB limit) |
| `/api/classify-photos` | POST | AI photo classification (Claude Sonnet vision) |
| `/api/webhook/ghl` | POST | GoHighLevel webhook (not fully implemented) |
| `/api/feedback` | POST | Collect user feedback on OM quality |
| `/health` | GET | Health check (used by monitoring) |

### OM Generator (`src/generate-om.js` — 210 lines)
Orchestrates generation of 10-11 sections using Claude Haiku 3.5 (max 2000 tokens each):

1. Disclaimer (two-column: main text + sidebar quote)
2. Property Summary (investment thesis + 6-8 highlights)
3. Property Details (with county data if available)
4. Neighborhood Description (demographics, employment, development pipeline)
5. Nearby Parking (6 real facilities with rates)
6. Local Attractions (36 items: 6 categories x 6 each)
7. Economy Section (Fortune 500s, major employers, infrastructure)
8. Financial Summary (NOI, DSCR, cash-on-cash return)
9. Rent Comparables (grouped by unit type, real properties)
10. Company Bio (data-driven firm description)
11. Rent Roll (if provided — unit table with proforma rents)

Safety net: Auto-replaces hallucinated brokerage names (Marcus & Millichap, CBRE, etc.) with actual company name.

### Prompts (`src/prompts.js` — 483 lines)
All prompt templates for Claude. Each returns system context + user prompt. Key rules:
- Professional tone for accredited investor audience
- No markdown headers, no disclaimers, no AI meta-commentary
- Real data only — warns against fabricating addresses/businesses
- Cincinnati-specific knowledge baked in (parking, attractions, employers)

### PDF Generator (`src/generate-pdf.js` — 1,896 lines)
Converts sections into branded PDF using Puppeteer headless Chrome.

**Brand colors:**
- Maroon: `#722F37` (primary)
- Teal: `#2D7D7B` (dividers)
- Grays: `#f7f7f7`, `#e8e8e8`, `#555555`

**Layout:** Landscape 10" x 7.5", matching Hatch's Canva design
- Cover page with hero photo or maroon gradient
- Section headers with maroon bar + diagonal stripe accent
- Divider pages with cinematic full-bleed backgrounds
- Adaptive photo grids (1-4 photos per page)
- Financial tables with actual + proforma columns
- Footer: address left, company center, page number right

### County Scraper (`src/county-scraper.js` — 260 lines)
Fetches real property data from Hamilton County Auditor (wedge.hcauditor.org):
- `scrapeCountyData(parcelId)` — 25+ fields (year built, rooms, assessed value, abatements, etc.)
- `searchByAddress(address)` — Returns matching properties (up to 25 results)
- Optional — if it fails, the deal still generates without county data

### Frontend
- `public/index.html` (140KB) — 9-step dark-themed wizard form with real-time county lookup
- `public/editor.html` (125KB) — WYSIWYG editor for post-generation section editing
- `public/feedback.html` (14KB) — Feedback review interface

## Key Data Files
- `templates/company-info.json` — Key Property Partners default (Adam Curry + Andrew Kroeger)
- `output/` — Generated OMs (markdown + PDF), photos, feedback.json
- `samples/` — Reference PDFs from real Hatch deals

## Deployment
- **Platform:** Render (render.yaml in repo root)
- **Build:** `npm install && npx puppeteer browsers install chrome`
- **Start:** `npm start`
- **Env vars:** `ANTHROPIC_API_KEY`, `NODE_ENV`, `SLACK_BOT_TOKEN`, `PUPPETEER_CACHE_DIR`
- **Dependencies:** express, @anthropic-ai/sdk, puppeteer, sharp, multer, dotenv

## Slack Integration
- Posts to `#ops-log` and `#hatch-investments` channels
- Uses SLACK_BOT_TOKEN (Bot Token API)

## Cost
- ~$0.35 per OM (Sonnet vision for photo classification + Haiku for text generation)
- Charged to client at $9.00 per OM (96% margin)

## Client Context
- **Company:** Key Property Partners (Keller Williams Advisors Realty)
- **Contact:** Adam Curry — adam@keypropertypartners.com, (513) 935-0021
- **Portfolio:** 220 transactions, 1,301 doors, $94M sales volume
- **Location:** Cincinnati, OH (Hamilton County focus)

## Platform Pricing (full 6-service vision)
- Platform Only: $1,197/mo base + usage
- Platform + Consultation: $1,947/mo base + usage
- 6 planned services: OM Builder (built), Public Records, Mailer, Newsletter, SEO Blog, Local SEO (not started)
- Full pricing config: `config/platform-pricing-config.json`

## Common Tasks
- "Generate an OM" → Open https://om-builder.onrender.com or run locally with `npm start`
- "Fix a prompt" → Edit `src/prompts.js`, find the section function
- "Change PDF layout" → Edit `src/generate-pdf.js`, find the section in `buildHTML()`
- "Add a new section" → Add prompt in prompts.js, add generation call in generate-om.js, add HTML in generate-pdf.js
- "Check feedback" → Read `output/feedback.json` or visit `/feedback`
- "Update company info" → Edit `templates/company-info.json`
