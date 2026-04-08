# Stage 6: Deploy Content

## Inputs
- Finished article from stage 05 (with relatedLinks)
- Business project path from YAML config
- Google Sheet tracking_sheet_id

## Process
1. Write article to src/data/local-news/{city-slug}.json (append to existing)
2. Update TODO status in Sheet to "Done" with notes
3. Log to SEO Changelog tab
4. Git add, commit, push
5. Post summary to Slack

## Outputs
- Updated article JSON file in business project
- Updated Sheet rows
- Git commit pushed (triggers Vercel deploy)
- Slack notification
