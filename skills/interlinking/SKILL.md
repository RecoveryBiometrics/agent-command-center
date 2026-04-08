---
description: Build and maintain internal links across all SafeBath pages — link graph, city neighbors, article relatedLinks, link health audit.
invocation: /interlinking
when_to_use: When the user wants to rebuild internal links, add neighbor data, retrofit articles, or audit link health.
---

# Interlinking Pipeline

Builds and maintains internal links across all business pages.

## Usage
```
/interlinking                            # full run for SafeBath
/interlinking safebath --stage graph     # just rebuild link graph
/interlinking safebath --stage inject    # just update article relatedLinks
/interlinking safebath --audit-only      # just run link health audit
```

## Codebase
- Pipeline: `agent-command-center/pipelines/interlinking/`
- Config: `businesses/{slug}.yaml` → `interlinking:` section
- Reads: SafeBath `src/lib/constants.ts`, `src/data/local-news/`, `src/data/city-wiki/`
- Writes: `src/data/link-graph.json`, `src/data/city-neighbors.json`, article JSON files

## Stages (ICM-structured)
1. **01-graph** — Build link graph from constants.ts (cities, counties, services, articles)
2. **02-neighbors** — Generate city-neighbors.json for RelatedCities React component
3. **03-inject** — Add relatedLinks to article JSON files
4. **04-audit** — Check for orphan pages, broken links, over-linking

## References (Layer 3)
- `references/cluster-rules.md` — geographic adjacency map, link limits, cluster definitions

## React components (in SafeBath project)
- `src/components/RelatedCities.tsx` — renders nearby city pills on city pages
- `src/components/RelatedLinks.tsx` — renders related links on article pages
- `src/lib/city-neighbors.ts` — data loader for city-neighbors.json

## Key numbers (SafeBath)
- 167 cities, 10 counties, 7 services
- 1,002 neighbor links
- 3 relatedLinks per article
