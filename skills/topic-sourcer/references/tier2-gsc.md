# Tier 2: GSC Gap Detection

## Source
`gsc-stats.json` — pulled from Google Search Console API with country dimension

## How language-specific queries work
The GSC API supports filtering by country:
- `dimensionFilterGroups` with `dimension: "country"` and `expression: "MEX"` for Mexico
- Countries → Languages:
  - MEX, COL, ARG, ESP → Spanish (es)
  - IND → India English (en-IN)
  - ARE, SAU, EGY, QAT, OMN → Arabic (ar)

## Gap detection
A "gap" is a query where:
- Impressions >= 20 (real search volume)
- No matching page exists in the site for that language
- Query text suggests a topic we could cover

## How to check if a page exists
Search `globalhighlevel-site/posts/*.json` for:
- Title containing the query keywords
- Slug containing the query keywords
- AND the post's `language` field matches the target language

If no match → it's a gap → create a topic.

## Output format
```json
{
  "topic": "gohighlevel precios mexico",
  "source": "tier2-gsc",
  "impressions": 120,
  "position": 35.2,
  "country": "MEX",
  "tier": 2
}
```
