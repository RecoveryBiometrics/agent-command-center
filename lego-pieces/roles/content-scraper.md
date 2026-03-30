# Content Scraper
**Title:** Source Finder

## What This Role Does
Discovers content from multiple sources. Tries each in priority order.

## Duties
- Tries content sources in configured priority order until it finds unpublished content
- Website mode: crawls full site, specific section, or sitemap (up to 500 pages)
- YouTube mode: extracts transcripts from channel videos via yt-dlp
- RSS mode: parses RSS/Atom feeds, fetches full article if summary too short
- Manual mode: reads from topics list or CLI flag, researches via web search
- Auto-discovery mode: searches web + Reddit for fresh topics when other sources exhausted
- Caches all discovered content to prevent re-processing
- Skips any content that's already been published as an episode

## Inputs
Configured content sources (website URL, YouTube channel, RSS feed, topic list, or niche keyword)

## Outputs
Content object with: title, body text, source URL, source type

## Tools
- Web scraper
- yt-dlp
- RSS parser
- DuckDuckGo search
