---
name: Trigger Inventory
description: Current state of all Claude remote routines/triggers + correct doc-verified limits.
type: project
originSessionId: 67b5bfa1-1a7a-417e-9f26-c43d89efe7c4
---
## Trigger state as of 2026-04-16

### Enabled (2)
1. `trig_017gYGfVmviqWCdR8vpD1jTt` — **CEO Daily Narrative** — daily 7am ET (cron `0 11 * * *` UTC). Plain-English WBR-style narrative to #ceo. Uses `reiamplifi-google` env. Slack + Google Drive MCP. Never suppress — silence = broken.
2. `trig_01GqvHa2Kmbz9SjwjJme6hcq` — **Weekly SEO Report — All Projects** — Tuesdays 9am ET (cron `0 13 * * 2` UTC). Pulls live GSC + GA4 per business via service account. Posts per-business to #ceo. Uses `reiamplifi-google` env. Slack MCP.

### Disabled (6) — available to re-enable or delete
- `trig_014XvhZtxg6nUYvCjx1QHx41` — Pipeline Doctor (every 4h) — could re-enable
- `trig_011Vkd3QzUSRK7BvhXchPez1` — Pipeline Health + CEO Briefing — superseded by CEO Daily
- `trig_015qGHVkam5Z6Fgy5MgfonbY` — Daily FB Posts All 4 — dark since Apr 7
- `trig_01LqzwXPLezYaFmJEwbMy7PP` — Daily FB Posts original — superseded
- `trig_01R6cncrBz4VDFVScZ1kV4uz` — FB Posts Midday+Evening — superseded
- `trig_01W3Wdcq2TTi9SFRFdxhthVA` — Content Monitor — superseded by Pipeline Doctor

## Doc-verified limits (checked 2026-04-16 against code.claude.com/docs/en/routines)

**There is NO documented cap on the number of enabled routines.** Bill's account currently has 8 routines stored (2 enabled, 6 disabled) — proof the previous "3 enabled max" memory was wrong.

The actual limits per Anthropic docs:
- **Daily run cap per account** — visible at claude.ai/code/routines or claude.ai/settings/usage. Hits the same usage pool as interactive sessions. Overage available for orgs with extra usage enabled in Billing.
- **Cron minimum interval** — 1 hour. Anything faster is rejected.
- **GitHub event triggers** — per-routine + per-account hourly caps (only relevant if you use GitHub event triggers, which Bill currently doesn't).
- **Plan eligibility** — Pro, Max, Team, Enterprise. All support routines.

**How to apply:** Don't refuse to add a routine because of an "enabled cap" — it doesn't exist. Daily-runs cap is what to monitor. New routines are free to create.

## DST caveat (HARD)
Cron is UTC. `0 11 * * *` = 7am EDT during daylight saving (Mar-Nov), = 6am EST in winter. To keep CEO Daily at 7am local year-round, switch to `0 12 * * *` when ET moves to EST (~Nov 2). Same logic applies to Weekly SEO Report.

## Delete-via-API blocked
RemoteTrigger API has no delete action. To permanently remove a disabled trigger, go to https://claude.ai/code/scheduled
