# Stage 4: Fact Check + SEO Audit

## Inputs
- Written article from stage 03
- Existing articles in src/data/local-news/ (for similarity check)
- Layer 3: references/seo-rules.md — validation rules
- Layer 3: references/content-rules.md — quality thresholds

## Process
1. Fact check:
   - City name mentioned in body
   - No placeholder text
   - Minimum body length
   - No duplicate slugs
2. SEO audit:
   - Title ≤60 chars
   - Excerpt 50-160 chars
   - Valid slug format
   - Cross-content similarity <85%
3. If check fails → return to stage 03 with issues (max 3 retries)

## Outputs
- { pass: true/false, issues: string[] }
- If pass: article moves to stage 05
- If fail after 3 retries: TODO marked as failed, skipped
