# Stage 3: Post to Slack

## Inputs
- Written posts from stage 02
- Layer 3: `../../references/channel-map.md` — where to post

## Process
1. Post each as a SEPARATE message to #social with prefix:
   - *FB Post 1 — Morning (post ~8am)*
   - *FB Post 2 — Midday (post ~12pm)*
   - *FB Post 3 — Afternoon (post ~3pm)*
   - *FB Post 4 — Evening (post ~6pm)*
2. Log to #ops-log: `[Social Content] Complete. 4 FB posts generated from today's ops activity. Posted to #social.`

## Outputs
- 4 messages in #social
- 1 log entry in #ops-log

## Tools needed
- `mcp__Slack__slack_send_message`
