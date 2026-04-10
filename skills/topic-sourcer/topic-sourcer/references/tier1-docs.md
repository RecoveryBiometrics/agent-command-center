# Tier 1: GHL Documentation Source

## Source
`articles-cache.json` — scraped from help.gohighlevel.com/support/solutions

## Record format
```json
{
  "id": "155000005065",
  "title": "Getting Started - Launch an SMS Campaign",
  "url": "https://help.gohighlevel.com/support/solutions/articles/155000005065",
  "category": "Getting Started",
  "subcategory": "SMS Campaigns",
  "body": "Full article text...",
  "scraped": "2026-03-10T..."
}
```

## How to use for non-English blogs
1. Read the article's title, URL, and body text
2. Pass to the blog writer with instructions to ADAPT (not translate):
   - Cover the same GHL feature
   - Add local pricing, payment methods, communication tools
   - Include local business scenarios
   - Write in natural target language (not translated English)
3. The writer's primary source is the article body — this is the trust layer
4. Store `articleId` in the published record to track coverage

## Priority weighting
- Check `topic-weights.json` for download/traffic data on related English content
- Articles about popular features (automation, WhatsApp, funnels, CRM) rank higher
- Articles with long body text provide better source material for adaptation
- Skip articles with body < 500 chars (too thin to adapt meaningfully)
