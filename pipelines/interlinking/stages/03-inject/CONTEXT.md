# Stage 3: Inject Related Links into Articles

## Inputs
- `src/data/link-graph.json` from Stage 1
- `src/data/local-news/*.json` — existing article files
- Layer 3: `references/cluster-rules.md` → max 3 relatedLinks per article

## Process
1. For each article, generate 2-3 relatedLinks:
   - Link to a nearby city's page (geographic cluster)
   - Link to the most relevant service page (based on article category)
   - Link to a same-category article in a nearby city (content cluster)
2. Add relatedLinks array to each article object
3. Write updated JSON back to file

## Outputs
- Updated `src/data/local-news/*.json` files with relatedLinks field
- Rendered by `src/components/RelatedLinks.tsx`
