# Channel Map

**Consolidation policy (2026-04-15):** All reports route to #ceo. Business-specific channels are archived. #ops-log is forensics-only (errors/warnings, not per-push).

## Active channels
- **#ceo** (C0AQAHSQK38) — single source of truth. Daily narrative, weekly summaries, analytics, all businesses.
- **#ops-log** (C0AQG0DP222) — errors/warnings only. Forensics, not notifications. Per-push git hook is killed.

## Archived channels (un-archive when staffing expands)
- **#safebath** (C0AQCHCC2JW) — weekly SafeBath report moved to #ceo
- **#globalhighlevel** (C0AQ95LG97F) — weekly GHL report + SEO Optimizer moved to #ceo
- **#social** (C08AEC99R5K) — FB pipeline dark since 2026-04-07; un-archive after trigger is fixed

## Routing rules
| Report Type | Primary Channel |
|---|---|
| ceo-daily | #ceo |
| weekly | #ceo |
| ceo | #ceo |
| error | #ops-log |

**No dual-posting.** Each report goes to exactly one channel.

## Business YAML — `slack` section
Every business YAML should have:
```yaml
slack:
  ceo_channel: C0AQAHSQK38       # #ceo — where all reports go
  ops_log_channel: C0AQG0DP222   # #ops-log — errors only
  business_channel: null         # archived; set to channel ID if you un-archive
```

If `business_channel` is null, the skill routes to `ceo_channel` for everything non-error.

## When to un-archive a business channel
- Hired a VA or contractor who owns that business
- Want per-business isolation for a specific stakeholder
- Business has enough volume that the daily narrative can't cover it
