# Daily Reporter
**Title:** Executive Daily Briefing

## What This Role Does
Generates a plain-English daily report for the CEO covering what every agent did, what went wrong, what's next, and what didn't happen (with reasons).

## Duties
- Pulls data from: content changelog, wiki generator state, quality scores, pipeline state, local news stats, directory stats
- Calculates coverage metrics (% of cities covered, days to full coverage)
- Categorizes changes by agent source
- Writes CEO-readable summary with sections: Bottom Line, Where We Stand, What Each Agent Did, What Didn't Happen, Strongest Cities, Change Summary
- Sends via Gmail API (OAuth refresh token) and Slack webhook
- Subject line summarizes the day in one line

## Inputs
Pipeline state files, content changelog, directory data

## Outputs
Email to CEO + Slack message (same content)

## Tools
- Gmail API (OAuth refresh token via `GOOGLE_OAUTH_CREDENTIALS`)
- Slack webhook (via `SLACK_WEBHOOK_URL`)
- Node.js (reads JSON data files)

## Cost
$0 (Gmail API free tier)
