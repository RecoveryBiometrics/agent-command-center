# Suppress Rules

When to stay silent vs. when to post. The whole point is reducing noise.

## Rules by report type

### weekly
**Never suppress.** Always post the weekly report, even if it's a quiet week. The user needs the rhythm of knowing what's happening — or not happening — with their search performance.

### error
**Never suppress.** Error alerts exist to interrupt. If there's an error, post it.

### ceo
**Suppress when all clean.** If every ops-log entry from the last 24 hours is info-level (no warnings, no errors), do not post. Nobody needs a message that says "everything's fine."

Only post when:
- At least one entry is level "warning" or "error"
- A pipeline hasn't reported in longer than its `max_gap_hours` (from projects.yml)

### Daily pipeline reports (legacy — being removed)
**Always suppress.** The old pattern of posting after every cycle is being replaced by the weekly report. Pipelines should write `ops-status.json` and stay quiet unless something breaks.

## Design principle
If a message doesn't change what someone does today, don't send it.
