# Interlinking Pipeline

Builds and maintains internal links across all SafeBath pages. Runs after content changes or on-demand.

## Stages
1. **Graph** — Build link graph from constants.ts + data files (nodes = pages, edges = links)
2. **Neighbors** — Generate city-neighbors.json for template-level "Nearby Cities" linking
3. **Inject** — Add relatedLinks to article JSON files for content-level linking
4. **Audit** — Check for orphan pages, broken links, over-linking

## Usage
```
node index.js --business safebath              # full run: graph → neighbors → inject → audit
node index.js --business safebath --stage graph # just rebuild the graph
node index.js --business safebath --audit-only  # just run the auditor
```

## Config
Business YAML `interlinking:` section controls max links per page, neighbor count, etc.

## Key files it reads
- `src/lib/constants.ts` → all locations, counties, services (parsed as JSON by lib/parse-constants.js)
- `src/data/local-news/*.json` → all articles
- `src/data/city-wiki/*.json` → directory data

## Key files it writes
- `src/data/link-graph.json` → full link graph (nodes + edges)
- `src/data/city-neighbors.json` → neighbor map for RelatedCities component
- `src/data/local-news/*.json` → updated articles with relatedLinks (inject stage only)
