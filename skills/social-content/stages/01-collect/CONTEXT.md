# Stage 1: Collect Ops Activity

## Inputs
- #ops-log channel (C0AQG0DP222) — last 24 hours

## Process
1. Read the last 24 hours of #ops-log
2. Extract structured data:
   - Pipeline runs (which pipelines, which businesses, success/failure)
   - Content deployed (article count, podcast episodes, blog posts, translations)
   - Failures, fixes, reverts
   - Cross-business patterns
   - Interesting numbers (page counts, city counts, etc.)
3. If ops-log is light, note that — stages 02 will adapt

## Outputs
- Structured summary of ops activity with real numbers
- Passed to stage 02 (write)

## Tools needed
- `mcp__Slack__slack_read_channel`
