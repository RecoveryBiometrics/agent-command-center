# Channel Map

Channel IDs are read from each business's YAML (`slack.*` section). This file documents the shared channels and routing rules.

## Shared channels (all businesses)
- **#ops-log** (C0AQG0DP222) — error alerts land here alongside business channel
- **#ceo** (C0AQAHSQK38) — CEO digest posts here (errors/warnings only)

## Per-business channels (from YAML)
- **SafeBath** → #safebath (C0AQCHCC2JW)
- **GHL** → #globalhighlevel (C0AQ95LG97F)

## Routing rules
| Report Type | Primary Channel | Also Post To |
|---|---|---|
| weekly | business_channel | — |
| error | business_channel | ops_log_channel |
| ceo | ceo_channel | — |

## Adding a new business
Just add a `slack:` section to the business YAML:
```yaml
slack:
  ops_log_channel: C0AQG0DP222
  ceo_channel: C0AQAHSQK38
  business_channel: C_NEW_CHANNEL_ID
```
The skill reads these at runtime. No changes to this file needed.
