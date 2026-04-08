# Stage 2: Research Keyword

## Inputs
- Classified TODO from stage 01 (type: "gap", keyword, impressions)
- SafeBath constants.ts (via lib/parse-constants.js) — to check existing pages
- Layer 3: references/voice.md (for brand context)

## Process
1. Check if any existing page already targets this keyword (cannibalization check)
2. Determine page type:
   - Location keyword ("grab bars Coatesville PA") → location article
   - Service keyword ("grab bar installation walk-in shower") → service content
3. Generate content brief via Claude Haiku:
   - What the topic is
   - Who needs it
   - Common questions
   - Local angle (if location keyword)
4. Cost: ~$0.01 per keyword

## Outputs
- Content brief: { pageType, keyword, brief, targetCity, targetService }
- Passed to stage 03 (write)
