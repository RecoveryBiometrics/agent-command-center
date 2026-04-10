# Stage 3: Deliver Report

## Inputs
From stage 02:
- `formatted_message` — Slack-ready text
- `report_type` — weekly | error | ceo
- `suppressed` — if true, do nothing
- `sheet_data` — structured row for Sheet (weekly only)
- `business` — full config with channel IDs

## Process

### 1. Check suppression
If `suppressed` is true, log "Report suppressed — nothing to deliver" and stop.

### 2. Post to Slack
Route based on report type:

| Report Type | Channel | Channel ID Source |
|---|---|---|
| weekly | Business channel | `business.slack.business_channel` |
| error | Business channel + #ops-log | `business.slack.business_channel` + `business.slack.ops_log_channel` |
| ceo | #ceo | `business.slack.ceo_channel` |

Use `mcp__claude_ai_Slack__slack_send_message` for each post.

If the message is over 3900 characters, split into multiple messages:
- First message: key metrics + wins/drops
- Second message: opportunities + gaps + traffic + content

### 3. Write to Sheet (weekly only)
Use `mcp__google-workspace__append_table_rows` to write a summary row to the business tracking sheet.
- Sheet ID: `business.tracking_sheet_id`
- Tab: "Weekly Report"
- Row: [date, clicks, impressions, ctr, position, sessions, users, content_count, wins, drops, opportunities, gaps]

If the "Weekly Report" tab doesn't exist, create it with headers first.

### 4. Log completion
Post a one-liner to #ops-log:
- `[{business_name}] [Weekly Report] Posted to #{channel_name}`
- Or: `[{business_name}] [CEO Digest] Suppressed — all clean`
- Or: `[{business_name}] [Error Alert] Posted to #{channel_name} + #ops-log`

## Outputs
- Confirmation of what was posted and where
- Sheet row written (if weekly)

## Tools needed
- `mcp__claude_ai_Slack__slack_send_message` — post to Slack channels
- `mcp__google-workspace__append_table_rows` — write Sheet row
- `mcp__google-workspace__read_sheet_values` — check if tab exists
