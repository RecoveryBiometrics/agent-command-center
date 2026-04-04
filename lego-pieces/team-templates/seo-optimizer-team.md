# SEO Optimizer Team
**Skill:** SEO Content Pipeline

## What This Team Does
Takes pages flagged by the SEO Reporting Team (low CTR, almost-page-1) and executes fixes — researches competitors, rewrites titles/descriptions, expands content, fact-checks, and deploys. Tracks results in a Google Sheet and auto-retries once if a rewrite doesn't improve CTR after 28 days.

## Roles (in pipeline order)
1. **GSC Analyst** → Reads flagged pages, prioritizes by opportunity score (impressions × CTR gap × position weight), picks top 10 per weekly run
2. **Researcher** → Scrapes DuckDuckGo + Reddit for competitor titles, content depth, and user questions
3. **Content Writer** → Rewrites titles (<60 chars) and descriptions (<155 chars) for low-CTR pages; adds 300-600 words of new H2 sections + FAQ for almost-page-1 pages
4. **Fact Checker** → Validates no fabricated claims, checks char limits, ensures HTML structure, auto-fixes soft issues
5. **Engineer** → Saves updated post JSON, updates cooldown tracker, sends Slack before/after notification, logs to Google Sheet

## Schedule
- Weekly (every 7 days)
- 10 pages per run
- 28-day cooldown per page before re-evaluation
- Auto-retry once if CTR didn't improve

## Deployed To
- **GlobalHighLevel** — IONOS VPS, weekly (runs inside podcast pipeline scheduler)

## To Deploy to a New Business
Run `/deploy-team` and select "SEO Optimizer Team"
