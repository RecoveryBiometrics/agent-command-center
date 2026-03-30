# Keyword Miner
**Title:** Opportunity Finder

## What This Role Does
Mines Google Search Console for missed opportunities and recommends new pages.

## Duties
- Fetches all search queries from GSC (last 28 days, up to 1,000)
- Groups queries by city + service keyword
- Identifies queries with 50+ impressions but 0 clicks (no landing page exists)
- Checks if matching pages were recently created (avoids duplicating recent work)
- Recommends new city/service page combinations to generate
- Auto-updates page generation config for new pages on next build

## Inputs
Google Search Console query data (last 28 days)

## Outputs
List of new page recommendations, auto-updated page config

## Tools
- Google Search Console API
- Content changelog
