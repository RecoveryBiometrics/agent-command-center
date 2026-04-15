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
| weekly | #ceo | `business.slack.ceo_channel` |
| ceo-daily | #ceo | `business.slack.ceo_channel` |
| error | #ops-log | `business.slack.ops_log_channel` |
| ceo | #ceo | `business.slack.ceo_channel` |

**Consolidation rule:** All reports route to #ceo (single source of truth) except errors, which route to #ops-log for forensics. Business-specific channels (#safebath, #globalhighlevel, #social) are archived — everything Bill needs to see lands in #ceo.

Use `mcp__claude_ai_Slack__slack_send_message` for each post.

**Length enforcement.** If any single message is over 3900 chars, it's too verbose. Do NOT split into multiple messages — that creates the unreadable 5-message dump problem. Instead:
- Tighten the narrative
- Move details to the Google Sheet
- Post a 3-bullet summary + Sheet link

Exception: `ceo-daily` is capped at 4000 chars by the template itself; if it overflows, the composer must trim per-business paragraphs.

### 3. Write to Sheet (weekly only)
Use `mcp__google-workspace__append_table_rows` to write a summary row to the business tracking sheet.
- Sheet ID: `business.tracking_sheet_id`
- Tab: "Weekly Report"
- Row: [date, clicks, impressions, ctr, position, sessions, users, content_count, wins, drops, opportunities, gaps]

If the "Weekly Report" tab doesn't exist, create it with headers first.

### 4. Log completion
Do NOT post completion confirmations to Slack. They create noise. Log to stdout only:
- `[{business_name}] [{report_type}] Posted to #{channel_name}`
- Or: `[{business_name}] [{report_type}] Suppressed — all clean`

## Outputs
- Confirmation of what was posted and where
- Sheet row written (if weekly)

## Tools needed
- `mcp__claude_ai_Slack__slack_send_message` — post to Slack channels
- `mcp__google-workspace__append_table_rows` — write Sheet row
- `mcp__google-workspace__read_sheet_values` — check if tab exists
