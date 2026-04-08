# Stage 4: Audit Link Health

## Inputs
- `src/data/link-graph.json` from Stage 1
- `src/data/city-neighbors.json` from Stage 2
- `src/data/local-news/*.json` — articles with relatedLinks

## Process
1. Check for orphan pages: cities with 0 inbound internal links
2. Check for over-linked pages: cities with >15 outbound links
3. Check for broken links: relatedLinks pointing to slugs that don't exist
4. Check reciprocal links: if A links to B, does B link back?
5. Generate summary report

## Outputs
- Console report with issues found
- Posts summary to Slack (if configured)
- Returns { orphans, overLinked, broken, missingReciprocal } for logging
