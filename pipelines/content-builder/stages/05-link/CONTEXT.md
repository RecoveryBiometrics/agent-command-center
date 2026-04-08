# Stage 5: Generate Internal Links

## Inputs
- Article from stage 04 (passed checks)
- Interlinking pipeline's clusters.js (for neighbor/service lookups)
- SafeBath constants.ts (for city/service data)

## Process
1. Find 2-3 related pages for relatedLinks:
   - Nearby city page (geographic cluster)
   - Relevant service page (based on category)
   - Same-category article in nearby city
2. Add relatedLinks array to the article

## Outputs
- Article with populated relatedLinks
- Passed to stage 06 (deploy)
