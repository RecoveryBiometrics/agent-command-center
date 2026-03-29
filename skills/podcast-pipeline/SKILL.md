# Podcast Pipeline

## What This Skill Does
Fully automated podcast production. Takes any content source (website articles, YouTube videos, RSS feeds, manual topics, or auto-discovered topics) and produces published podcast episodes with optional SEO blog posts. Runs on autopilot once configured.

## Who This Is For
Any business, agency, or content creator that wants:
- A podcast published to Spotify, Apple Podcasts, Amazon Music automatically
- Natural two-host conversation format (not robotic TTS)
- Optional SEO blog post for every episode
- Content sourced from existing assets (website, YouTube, RSS) or generated fresh
- Zero manual work after setup

## Proven Results
- First deployed for GlobalHighLevel.com (GHL tutorial podcast)
- 380+ podcast followers
- 80+ episodes published
- Running since early 2026
- Cost: ~$21-41/month total

---

## The Pipeline (5 Steps + Optional Blog)

### Step 1: Content Discovery
Tries sources in configured priority order until it finds unpublished content:

**Source A: Website Scraper**
- Crawls your website for articles (full site, specific section, or sitemap)
- Extracts main content, strips nav/footer/scripts
- Caches discovered articles, skips already-published URLs

**Source B: YouTube Scraper**
- Pulls transcripts from your YouTube channel
- Uses yt-dlp for video discovery and subtitle extraction
- Skips already-published videos

**Source C: RSS Feed**
- Parses any RSS/Atom feed
- Extracts full article content (fetches from link if summary is too short)

**Source D: Manual Topics**
- Reads from a topics list (JSON file or CLI flag)
- Optionally researches each topic via web search before generating

**Source E: Auto-Discovery (fallback)**
- When all other sources exhausted, searches the web for new topics
- Generates 12 search queries based on your niche
- Searches DuckDuckGo + Reddit for fresh angles
- Prevents duplicates (70% word overlap threshold)

### Step 2: Audio Generation (NotebookLM)
- Sends content to Google NotebookLM
- NotebookLM generates a natural two-host podcast conversation
- Audio saved as MP4
- Free tier: 3 episodes/day | Plus ($20/mo): 20 episodes/day

### Step 3: SEO Metadata (Claude API)
- Claude writes an optimized episode title (50-70 chars, varied phrasing)
- Writes a compelling description (150-250 chars)
- Generates 5-8 keyword tags
- Falls back to original title if Claude API not configured

### Step 4: Transcription (Gemini — optional)
- Gemini transcribes the audio with speaker labels
- Enables search within podcast apps
- Improves accessibility
- ~$0.05/day

### Step 5: Publish to Transistor.fm
- Uploads audio to Transistor's hosting
- Creates episode with SEO title, description, tags, transcript
- Transistor auto-distributes to: Spotify, Apple Podcasts, Amazon Music, Google Podcasts
- Returns share URL and embed HTML

### Step 6: Blog Post (optional, 3-agent system)

**Agent 1: Researcher**
- Searches DuckDuckGo for related content (top 5 results)
- Searches targeted subreddits + general Reddit
- Compiles research for the writer

**Agent 2: Writer (Claude)**
- Writes 800-1200 word SEO blog post
- Includes: H2/H3 headings, table of contents, pro tip callout, FAQ section, podcast embed
- Naturally places affiliate link CTA (if configured)
- Assigns category from configured list

**Agent 3: Fact Checker (Claude)**
- Validates: no fabricated statistics, correct product/company names, accurate pricing claims
- Checks for legal/compliance issues
- Custom fact-check rules supported
- Returns corrected HTML + list of issues found

### Static Site Generator
- Builds blog from published post JSON files
- Generates: homepage, individual posts, category pages, sitemap, robots.txt, llms.txt
- Configurable theme (dark/light), accent color, Google Font
- Deploys to Cloudflare Pages, Vercel, GitHub Pages, or any static host

---

## Configuration (Setup Wizard)

### Podcast Info
- `PODCAST_NAME` — Your podcast name
- `PODCAST_NICHE` — Topic/niche (e.g., "real estate investing", "GHL tutorials")
- `EPISODES_PER_DAY` — Max episodes per batch (default: 3, max 20 with Plus)

### Content Sources (pick one or more, tried in priority order)
- `CONTENT_SOURCE_TYPES` — Comma-separated: website,youtube,rss,manual,discover
- `WEBSITE_URL` — Your website to scrape
- `WEBSITE_CRAWL_MODE` — full / section / sitemap
- `WEBSITE_SECTION` — Specific section path (e.g., "/blog")
- `YOUTUBE_CHANNEL_URL` — Your YouTube channel
- `RSS_FEED_URL` — Any RSS/Atom feed URL
- `REDDIT_SUBREDDITS` — Subreddits relevant to your niche (for discovery + research)

### Publishing
- `TRANSISTOR_API_KEY` — From transistor.fm account settings
- `TRANSISTOR_SHOW_ID` — Numeric ID from show dashboard

### Blog (optional)
- `ENABLE_BLOG` — true/false
- `SITE_URL` — Your blog domain
- `SITE_NAME` — Blog title
- `SITE_TAGLINE` — Blog tagline
- `SITE_CATEGORIES` — Comma-separated content categories
- `SITE_THEME` — dark / light
- `SITE_ACCENT_COLOR` — Hex color for buttons/links
- `SITE_FONT` — Google Font name
- `AFFILIATE_LINK` — Optional CTA link placed in blog posts

### Scheduling
- `CYCLE_HOURS` — Hours between automated runs (default: 25, synced to NotebookLM reset)
- `RUN_MODE` — manual / auto

### Quality
- `ENABLE_TRANSCRIPTION` — true/false
- `FACT_CHECK_RULES` — Custom rules for the fact checker (e.g., "never mention competitor X")
- `TARGET_MARKET` — Region for fact-check accuracy (e.g., "United States")

### Notifications
- `ENABLE_EMAIL` — true/false for daily run summaries
- `SMTP_USER` / `SMTP_PASS` — Gmail SMTP
- `REPORT_RECIPIENTS` — Email addresses for summaries

---

## Environment Variables Required

```env
# Podcast
PODCAST_NAME=
PODCAST_NICHE=
EPISODES_PER_DAY=3

# Content Sources (configure whichever you use)
CONTENT_SOURCE_TYPES=website,youtube,rss,manual,discover
WEBSITE_URL=
WEBSITE_CRAWL_MODE=full
YOUTUBE_CHANNEL_URL=
RSS_FEED_URL=

# Audio
# NotebookLM auth via: python3 -m notebooklm login (browser-based, one-time)

# Publishing
TRANSISTOR_API_KEY=
TRANSISTOR_SHOW_ID=

# AI Services
ANTHROPIC_API_KEY=       # Claude for SEO metadata + blog writing
GOOGLE_AI_API_KEY=       # Gemini for transcription (optional)

# Blog (optional)
ENABLE_BLOG=false
SITE_URL=
SITE_NAME=
SITE_THEME=dark
SITE_ACCENT_COLOR=#f59e0b

# Scheduling
CYCLE_HOURS=25
RUN_MODE=manual

# Notifications (optional)
ENABLE_EMAIL=false
SMTP_USER=
SMTP_PASS=
```

---

## Deploying to a New Business

1. Run the setup wizard: `python3 setup.py`
2. Answer the questions (podcast name, niche, content sources, etc.)
3. Wizard generates your `.env` file
4. Authenticate NotebookLM: `python3 -m notebooklm login` (one-time browser login)
5. Test run: `python3 run.py --topic "Your First Topic"`
6. Verify episode on Transistor.fm dashboard
7. Go live: `python3 scheduler.py` (or deploy to server with `nohup`)

---

## Data Files
- `data/published.json` — Log of all published episodes (prevents re-processing)
- `data/articles-cache.json` — Website scraper cache
- `data/youtube-cache.json` — YouTube video cache
- `data/rss-cache.json` �� RSS item cache
- `data/discovered-topics.json` — Auto-discovered topics
- `data/audio/` — Generated MP4 audio files
- `site/posts/` — Blog post JSON files
- `logs/scheduler.log` — Scheduler activity log
- `logs/scheduler-state.json` — Last run timestamp

## Cost Per Business
| Service | Monthly Cost |
|---------|-------------|
| Transistor.fm | $19 |
| NotebookLM Free | $0 (3 eps/day) |
| NotebookLM Plus | $20 (20 eps/day) |
| Claude API (Haiku) | ~$1 |
| Gemini (transcription) | ~$1.50 |
| Blog hosting (Cloudflare) | $0 |
| **Total (Free tier)** | **~$21.50/mo** |
| **Total (Plus tier)** | **~$41.50/mo** |
