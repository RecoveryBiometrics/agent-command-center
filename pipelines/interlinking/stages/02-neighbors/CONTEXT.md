# Stage 2: Generate City Neighbors

## Inputs
- `src/data/link-graph.json` from Stage 1
- Layer 3: `references/cluster-rules.md` → neighbor count, adjacency map

## Process
1. For each city node in the graph, find neighbors:
   - First: other cities in the same county
   - Then: cities in adjacent counties (per adjacency map)
   - Cap at 6 total neighbors
2. Write a simple lookup file for the React component

## Outputs
- `src/data/city-neighbors.json` — { "city-slug": { sameCounty: [...], nearbyCounty: [...] } }
- Read by `src/components/RelatedCities.tsx` at build time
