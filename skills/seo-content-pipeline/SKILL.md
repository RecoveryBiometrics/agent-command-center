# SEO Content Pipeline

## What This Skill Does
Fully automated daily SEO content engine. Generates local news articles tied to your business niche, discovers and verifies real local businesses for a directory, audits quality, mines Google Search Console for new page opportunities, and publishes everything automatically. Sends you a daily executive email and weekly SEO performance report.

## Who This Is For
Any local service business or agency that wants:
- Daily fresh content published to their website automatically
- A verified local business directory that builds authority
- Weekly SEO reports with rankings, indexing, wins, drops, and opportunities
- Zero manual work after setup

## Proven Results
- First deployed on SafeBath Grab Bar (safebathgrabbar.com)
- 1,427+ pages generated and indexed
- 366 verified business listings
- Daily content pipeline running since March 2026
- Weekly SEO reports with attribution analysis

---

## The 6-Agent Pipeline

### Daily Pipeline (runs every day at configured time)

**Agent 1: Researcher**
- Scrapes real upcoming events from Eventbrite, Patch.com, and AllEvents.in
- Targets configured cities in configured service areas
- Returns: event name, date, location, description, source URL
- Max 5 events per city, deduplicated by title

**Agent 2: Fact Checker (Research)**
- Validates all events are future-dated
- Filters out past events, junk data, navigation text
- Self-healing: retries up to 3 times if validation fails

**Agent 3: Copywriter**
- Writes 2-3 paragraph articles for each event
- Naturally ties event to your business niche (configurable tie-in)
- Adds CTA with your business name, city, and phone number
- Deduplicates against existing articles in same city

**Agent 4: Fact Checker (Copy)**
- Checks for duplicate/overused phrasing across cities
- Similarity threshold: 85% (flags if articles are too similar)
- Self-healing: copywriter revises and re-checks (max 3 attempts)

**Agent 5: SEO Auditor**
- Validates: title length (<60 chars), meta description (120-160 chars), slug format, schema readiness, H1 format
- Auto-applies fixes for common issues
- Self-healing: re-audits after fixes (max 3 attempts)

**Agent 6: Engineer**
- Writes JSON files to configured data directory
- Commits to git, pushes to main branch
- Triggers auto-deploy (Vercel, Cloudflare, etc.)

### Supporting Agents

**Business Discovery (runs daily alongside content)**
- Discoverer: Uses Gemini with grounded web search to find real local businesses
- Verifier: Re-confirms each business exists and is currently operating
- Categorizer: Assigns business types (configurable categories)
- Engineer: Merges verified businesses into directory data
- Quality Auditor: Scores each listing 0-100 (phone, website, address, description checks)
- Places Enricher: Adds Google Places data (ratings, hours, photos)

**GSC Keyword Miner (runs daily)**
- Fetches search queries from Google Search Console (last 28 days)
- Finds queries with 50+ impressions but 0 clicks (missing landing pages)
- Recommends new city/service page combinations
- Auto-updates page generation config

**Weekly SEO Report (runs once per week)**
- Fetches Google Search Console performance data (28-day windows)
- Checks indexing status via URL Inspection API (200 pages/run)
- Identifies: wins (up 3+ positions), drops (down 3+), opportunities (positions 8-20), gaps (impressions but no clicks)
- Attributes page movements to deployed SEO changes with confidence levels
- Flags false correlations (bulk movements = likely algorithm update)
- Sends plain-English email summary

### Reporting

**Daily Email**
- What moved today (new content, new businesses, new pages)
- Where we stand (total counts, coverage percentage)
- What each agent did (detailed breakdown)
- What didn't happen and why

**Weekly SEO Email**
- Your numbers this week (clicks, impressions, CTR, avg position)
- Google indexing update (indexed vs waiting)
- What's improving / what slipped
- Almost on page 1 (opportunities)
- Search terms we're missing (gaps)
- What's driving these results (attribution)
- Work in progress (changes still evaluating)

---

## Configuration (Setup Wizard)

When deploying this skill to a new business, the setup wizard collects:

### Business Info
- `BUSINESS_NAME` — Your business name (e.g., "SafeBath Grab Bar")
- `BUSINESS_NICHE` — What you do in plain English (e.g., "grab bar installation and bathroom safety")
- `BUSINESS_WEBSITE` — Your website URL
- `BUSINESS_CTA_TEMPLATE` — Your call-to-action format (e.g., "{business} serves {city}. Call {phone} for same-week scheduling.")

### Service Areas
- `SERVICE_STATES` — States you operate in (e.g., "PA,DE,MD,NV,SC")
- `SERVICE_COUNTIES` — Counties within those states
- `SERVICE_CITIES` — Cities to generate content for (or "auto" to pull from county data)
- `PHONE_NUMBERS` — Phone number per state/region (supports multiple)
- `CITIES_PER_RUN` — How many cities to process per daily run (default: 8)

### Content Style
- `CONTENT_TIEINS` — How to naturally connect local events to your business (e.g., for grab bars: "Whether you're heading to {event} or staying home, bathroom safety matters year-round.")
- `CONTENT_TONE` — Writing style (e.g., "friendly, local, helpful — not salesy")
- `ARTICLE_LENGTH` — Target length per article (default: "2-3 paragraphs")
- `MAX_SIMILARITY_PERCENT` — Uniqueness threshold across cities (default: 85)

### Directory (Business Discovery)
- `DIRECTORY_ENABLED` — Whether to run business discovery (true/false)
- `BUSINESS_CATEGORIES` — Types of businesses to discover (e.g., "senior center, pharmacy, VNA, home health aide")
- `DISCOVERY_CITIES_PER_RUN` — Cities to discover businesses in per day (default: 10)
- `GOOGLE_PLACES_API_KEY` — For enrichment (ratings, hours, photos) — optional

### SEO Reporting
- `GSC_ENABLED` — Whether to mine Google Search Console (true/false)
- `GOOGLE_SERVICE_ACCOUNT_KEY` — Service account for GSC + URL Inspection APIs
- `REPORT_EMAIL` — Where to send reports
- `REPORT_SCHEDULE` — Day of week for weekly report (default: "Tuesday")

### Infrastructure
- `DEPLOY_TARGET` — Where the site is hosted (vercel/cloudflare/github-pages/other)
- `DATA_DIRECTORY` — Where content JSON files live in the repo
- `GIT_BRANCH` — Branch to commit to (default: "main")
- `DAILY_SCHEDULE` — Cron time for daily pipeline (default: "6:00 AM ET")
- `WEEKLY_SCHEDULE` — Cron time for weekly report (default: "Tuesday 9:00 AM ET")

### Notifications
- `SMTP_USER` / `SMTP_PASS` — Gmail SMTP for email reports
- `SLACK_WEBHOOK_URL` — Optional Slack channel for updates
- `REPORT_RECIPIENTS` — Comma-separated email addresses

---

## Environment Variables Required

```env
# Business
BUSINESS_NAME=
BUSINESS_NICHE=
BUSINESS_WEBSITE=
BUSINESS_CTA_TEMPLATE=

# Service Areas
SERVICE_STATES=
PHONE_DEFAULT=
PHONE_OVERRIDES=  # JSON: {"NV": "(725) 425-7383", "SC": "(854) 246-2882"}

# AI Services
ANTHROPIC_API_KEY=         # Claude API for copywriting + SEO audit
GOOGLE_GENAI_API_KEY=      # Gemini for business discovery

# Google (for SEO reporting)
GOOGLE_SERVICE_ACCOUNT_KEY=  # Base64 encoded service account JSON
GOOGLE_PLACES_API_KEY=       # Optional, for business enrichment

# Email
SMTP_USER=
SMTP_PASS=
REPORT_RECIPIENTS=

# Optional
SLACK_WEBHOOK_URL=
```

---

## Deploying to a New Business

1. Run the setup wizard: `node setup-wizard.js`
2. Answer the questions (business name, niche, service areas, etc.)
3. Wizard generates your `.env` file and `config.json`
4. Set up GitHub Actions workflows (wizard creates these)
5. Connect your Google Search Console service account
6. First run: `node run.js --test` (processes 1 city, doesn't commit)
7. Go live: push to GitHub, Actions take over

---

## State Files
- `pipeline-state.json` — Tracks city offset (cycles through all cities)
- `wiki-state.json` — Tracks business discovery offset
- `content-changelog.json` — Audit trail of all content changes
- `quality-scores.json` — Business listing quality scores (0-100)
- `corrections-pending.json` — Quality fixes awaiting confirmation

## Self-Healing
- Every agent retries up to 3 times on failure
- If a city fails all retries, it's skipped for that day and retried next cycle
- Fact checkers catch bad data before it publishes
- SEO auditor auto-fixes common issues
- Quality auditor flags listings that degrade over time

## Cost Per Business
- Claude API (Haiku): ~$0.03/day
- Gemini API: ~$0.02/day
- Google Places: Free tier covers most usage
- Total: ~$1.50/month per business in AI costs
