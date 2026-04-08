# Stage 3: Write Content

## Inputs
- Content brief from stage 02
- Layer 3: references/voice.md — tone and style
- Layer 3: references/seo-rules.md — title, meta, slug constraints
- Layer 3: references/content-rules.md — article JSON schema, categories

## Process
1. Generate content matching the article JSON schema
2. Follow voice rules from voice.md
3. Ensure title <60 chars, excerpt 50-160 chars, body 200+ chars
4. Include city name 2+ times in body for location content
5. Pick appropriate category

## Outputs
- Article object matching LocalNewsEntry schema (with relatedLinks empty — filled by stage 05)
- Passed to stage 04 (check)
