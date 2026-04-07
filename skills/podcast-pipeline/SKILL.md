---
name: Podcast Pipeline
description: Run, audit, or deploy the podcast + blog production pipeline for any business. Covers content discovery, audio generation, SEO metadata, transcription, publishing, multi-language blog writing, SEO optimization, and analytics.
user-invocable: true
---

# Podcast Pipeline

You are operating the Podcast Pipeline skill. This is a fully automated content-to-podcast system with multi-language blog generation, SEO optimization, and analytics.

## When to use this skill
- User says /podcast-pipeline or asks about podcast production, episode generation, blog posts, or content automation
- User wants to audit, debug, or improve any part of the podcast pipeline
- User wants to deploy this pipeline to a new business
- User asks about India blogs, Spanish blogs, SEO optimization, or analytics

## Loading Business Config
When operating on a business, ALWAYS read its config first:
1. Read `~/Projects/agent-command-center/businesses/{business-id}.yaml`
2. All config (Transistor show ID, Slack channels, affiliate links, etc.) comes from that file

## Codebase Locations

### General Pipeline (open-source product)
- **Path:** `~/Developer/projects/podcast-pipeline/`
- **Repo:** RecoveryBiometrics/content-autopilot
- **Scripts:** `run.py`, `scheduler.py`, `setup.py`
- **Scrapers:** `scripts/scrapers/{web,youtube,rss,manual}.py`
- **Core:** `scripts/{notebooklm,seo,upload,transcribe,blog}.py`

### GHL Production Pipeline (deployed on VPS)
- **Path:** `~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/`
- **Repo:** RecoveryBiometrics/Claude-notebookLM-GHL-Podcast
- **VPS:** IONOS ($2/mo), 74.208.190.10, SSH key `~/.ssh/ionos_ghl`
- **Service:** systemd unit `ghl-podcast`, user `williamcourterwelch`
- **Working dir on VPS:** `/home/williamcourterwelch/Claude_notebookLM_GHL_Podcast/ghl-podcast-pipeline`

### GHL Website (static blog)
- **Path:** `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/`
- **Hosting:** Cloudflare Pages (auto-deploys on git push)
- **Build:** `build.py` generates static HTML from post JSONs
- **URL:** globalhighlevel.com

## The Full VPS Cycle (25 hours, via systemd)

Each cycle runs these steps in order:

1. **Analytics** (`analytics.py`) — Pull Transistor download data, update topic weights
2. **GSC Topics** (`gsc-topics.py`) — Analyze Google Search Console data, flag low-CTR pages, auto-generate blog topics for English/Spanish/India
3. **SEO Optimizer** (`8-seo-optimizer.py`) — Weekly: rewrite titles/descriptions for 10 pages/week, 28-day cooldown per page, auto-retries once
4. **Retry Failed** (`retry-failed.py`) — Retry any failed episodes from last cycle
5. **Podcast Production** (`run-pipeline.py`) — Generate 20 episodes:
   - Content Scraper → tries sources in order: website → YouTube → RSS → manual topics → auto-discovery
   - Audio Producer → NotebookLM generates two-host conversation (MP4)
   - SEO Writer → Claude writes title (50-70 chars), description (150-250 chars), 5-8 keyword tags
   - Transcriber → Gemini transcribes with speaker labels (optional)
   - Publisher → Uploads to Transistor.fm, auto-distributes to Spotify/Apple/Amazon
6. **English Blog** (`5-blog.py`) — 20 SEO blog posts (800-1200 words each):
   - Agent 1 (Researcher): DuckDuckGo + Reddit for real data
   - Agent 2 (Writer): Claude Haiku writes post with TOC, FAQ, pro tips, podcast embed
   - Agent 3 (Fact Checker): Validates claims before publishing
7. **India Blog** (`6-india-blog.py`) — 5 India-focused blog posts:
   - Written natively in English with Indian context (NOT translations)
   - Pricing in ₹ rupees + USD (GHL Starter ~₹8,000/mo, Agency ~₹24,700/mo)
   - Payment methods: Razorpay, PayU, UPI (NOT Stripe)
   - Communication: WhatsApp (NOT SMS)
   - Competitors: Zoho CRM, Freshworks (Indian companies)
   - Compliance: GST, DPDP Act
   - Target cities: Mumbai, Bangalore, Delhi/NCR, Hyderabad, Pune, Chennai
   - Research subreddits: IndiaMarketing, india, GoHighLevel
   - Fact check rules: validates regional accuracy, catches American phraseology
   - Output category: "GoHighLevel India"
8. **Spanish Blog** (`7-spanish-blog.py`) — 5 Latin American Spanish blog posts:
   - Written natively in Latin American Spanish (NOT European Spanish, NOT translations)
   - Uses "tu" (informal), natural phrasing
   - Payment methods: MercadoPago, Conekta (Mexico), PayU (Colombia), Transbank (Chile)
   - Communication: WhatsApp Business API (5-10x email engagement)
   - Competitors: Clientify (main Spanish CRM), HubSpot
   - Markets: Mexico, Colombia, Argentina, Spain, Chile, Peru, Ecuador
   - Fact check rules: validates natural Spanish vs literal translation, regional accuracy
   - Output category: "GoHighLevel en Espanol"
9. **Site Build** (`build.py`) — Regenerate static site:
   - Homepage, posts, categories, sitemap, robots.txt, llms.txt
   - Internal Linker: `inject_internal_links()` cross-links 5 related posts per article
10. **Deploy** — git push triggers Cloudflare Pages rebuild
11. **Batch Blog** (`batch-blog.py`) — Optional: process multiple blog posts at once

### Supporting Scripts
- **`classify-posts.py`** — Auto-categorize new posts
- **`design-homepage.py`** — Homepage design generator
- **`setup-drive-auth.py`** — Google Drive auth setup

## Output Per Cycle
- 20 podcast episodes (English)
- 20 English blog posts
- 5 India blog posts
- 5 Spanish blog posts
- Up to 10 SEO title/description rewrites per week

## Key Data Files
- `data/published.json` — All episodes + blog status
- `data/gsc-stats.json` — Google Search Console data (28 days)
- `data/gsc-topics.json` — Flagged pages for SEO optimizer
- `data/seo-changelog.json` — Before/after SEO changes log
- `data/topic-weights.json` — Hot keywords from analytics
- `data/india-topics.json` — Pending India blog topics
- `data/spanish-topics.json` — Pending Spanish blog topics
- `data/ops-status.json` — Status for Pipeline Doctor monitoring
- `logs/scheduler-state.json` — Cycle state
- `logs/scheduler.log` — Full logs

## Slack Integration
- `#ops-log` (C0AQG0DP222) — All pipeline events
- `#ceo` (C0AQAHSQK38) — Daily CEO digest
- `#globalhighlevel` (C0AQ95LG97F) — Detailed daily report
- Uses SLACK_BOT_TOKEN (Bot Token API)

## Configuration Variables
When deploying to a new business:
- PODCAST_NAME, PODCAST_NICHE, EPISODES_PER_DAY (default: 3)
- CONTENT_SOURCE_TYPES (comma-separated: website,youtube,rss,manual,discover)
- WEBSITE_URL, WEBSITE_CRAWL_MODE, YOUTUBE_CHANNEL_URL, RSS_FEED_URL
- TRANSISTOR_API_KEY, TRANSISTOR_SHOW_ID
- ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY
- ENABLE_BLOG, ENABLE_TRANSCRIPTION
- SITE_URL, SITE_NAME, SITE_THEME, SITE_ACCENT_COLOR
- CYCLE_HOURS (default: 25), RUN_MODE (manual/auto)
- AFFILIATE_LINK (all GHL links must include `fp_ref=amplifi-technologies12`)
- TARGET_MARKET (e.g., "Indian real estate agents")
- FACT_CHECK_RULES (custom per language/market)

## Currently Deployed
- **GlobalHighLevel.com** — IONOS VPS ($2/mo), 24/7, 20 episodes/day
  - 1,565 articles, 380+ followers, affiliate model
  - Analytics: GA4 531015433, GSC for globalhighlevel.com
  - Transistor Show ID: 75382
  - Google Drive folder: 1xGOysDgcGGQRPdd1pE0gV--zgA5TiBhS

## Cost Per Business
- Free tier: ~$21.50/mo (Transistor $19 + Claude ~$1 + Gemini ~$1.50)
- Plus tier: ~$41.50/mo (add NotebookLM Plus $20 for 20 eps/day)

## Key Gotchas
- NotebookLM auth expires ~every 2 weeks (session at `~/.notebooklm/storage_state.json`)
- `public/` directory is gitignored (build output, never track)
- VPS scripts are NOT a git checkout — sync manually via scp
- 28-day GSC cooldown per page (don't re-flag before changes take effect)
- All GHL links must include `fp_ref=amplifi-technologies12`
- India/Spanish blogs auto-generate new topics when pending list < 10

## Common Tasks
- "Check podcast pipeline status" → Look at data/published.json, logs/scheduler-state.json, logs/scheduler.log
- "Why did an episode fail?" → Check scheduler.log for error, then check which step failed
- "Run the Spanish blog" → Run `7-spanish-blog.py` with topic or from pending list
- "Write an India blog about X" → Run `6-india-blog.py` with that topic
- "Check SEO optimizer" → Look at data/seo-changelog.json for before/after
- "What topics are trending?" → Check data/topic-weights.json (from Transistor analytics)
- "Add a new content source" → Update CONTENT_SOURCE_TYPES in .env, add source-specific config
- "Deploy to new business" → Run setup.py wizard, authenticate NotebookLM, test with --topic flag, start scheduler
