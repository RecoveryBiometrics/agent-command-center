# Content Rules

## Categories
- safety-tip — bathroom safety advice, fall prevention
- local-news — local events with safety tie-in
- community — community resources, senior services
- seasonal — seasonal safety (winter ice, summer heat)
- stats — local statistics, demographics

## Quality thresholds
- Max similarity to existing content: 85%
- Max retry attempts per TODO: 3
- Minimum impressions for new page: 50 (below this, not worth building)

## Article JSON schema
```json
{
  "id": "2026-04-08-001",
  "title": "string (max 70 chars)",
  "slug": "string (lowercase-hyphenated)",
  "date": "2026-04-08",
  "excerpt": "string (50-160 chars, used as meta description)",
  "body": "string (min 200 chars, mentions city 2+ times)",
  "category": "safety-tip | local-news | community | seasonal | stats",
  "sourceUrl": "string (optional)",
  "relatedLinks": [{ "text": "string", "href": "/path" }]
}
```
