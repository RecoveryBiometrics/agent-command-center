# Stage 1: Build Link Graph

## Inputs
- SafeBath `src/lib/constants.ts` → all counties, cities, services (via lib/parse-constants.js)
- SafeBath `src/data/local-news/*.json` → all articles per city
- SafeBath `src/data/city-wiki/*.json` → directory data per city
- Layer 3: `references/cluster-rules.md` → adjacency map, link limits

## Process
1. Parse constants.ts to get all location nodes (city pages, county pages, service pages)
2. Read all local-news JSON files to get article nodes
3. Build edges:
   - Geographic: same-county cities link to each other
   - Adjacent: cross-county cities link per adjacency map
   - Service: city pages link to service pages
   - Content: articles link to their city page
4. Write complete graph as JSON

## Outputs
- `src/data/link-graph.json` — { generatedAt, nodes: {...}, edges: [...] }
