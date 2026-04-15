# Stage 2: Compose Report

## Inputs
From stage 01:
- `business` — YAML config
- `report_type` — ceo-daily | weekly | error | ceo
- `live_data` — every metric tagged with source + pulled_at
- `unavailable` — list of failed data sources (with reason)

## Hard rules

### 1. Never fabricate. Never estimate.
If a number is missing, say "unavailable — {reason}". Do not round, average, or interpolate.

### 2. Live data only (enforced upstream)
Stage 01 is responsible for live pulls. If stage 02 sees data without a `pulled_at` field, refuse to use it. Something upstream violated the no-cache rule.

### 3. Lead with the decision
Every report opens with ONE bold sentence: the single decision or action for this report's audience. Before data, before numbers. If there's no decision, lead with the one concerning signal.

> Example: *"This week: fix the GHL 0.3% CTR — ranking is there, clicks aren't."*

If there's genuinely nothing to decide, the lead is: *"No decisions this week. All metrics within normal range."*

### 4. Show deltas, not absolutes
Every number is this-period vs prior-period. "47 clicks (-12 vs prior 28d)" beats "47 clicks." If no prior period exists yet, say so: "baseline period — no prior comparison."

### 5. End with action
Close with ONE sentence: what are we doing differently because of this report? If the answer is "nothing," say so — then the report can probably be shorter next week.

### 6. Dedupe
One message per business, ever. Never two posts for the same business on the same day. If stage 01 returns partial data, the single post says so — don't post a "no data" then a "full data" later.

## Per report-type

### ceo-daily — proof of life (template: references/ceo-daily.md)
- Narrative paragraphs, 3-6 sentences per business
- Severity tag opens each paragraph: "had a quiet day" / "had a busy day" / "had a concerning day" / "is dark"
- Never suppress — even clean days get posted
- Under 4000 chars total, single message to #ceo

### weekly — deep metrics (template: references/weekly-summary.md)
- ONE message per business, under 3500 chars
- Opens with bolded decision sentence (rule 3)
- Covers in this order:
  1. The decision / headline signal
  2. Output metrics with WoW deltas: clicks, impressions, position, CTR
  3. **Input metrics** — what we shipped this week (pages, optimizations, listings, gaps closed)
  4. **Conversion metrics** — CTA clicks, /trial/ visits, affiliate clicks, phone taps
  5. Top 3 wins + top 3 drops (by city/service name, not URL paths)
  6. Top 3 close-to-page-1 opportunities
  7. Changes in the evaluation window ONLY entries due for review THIS week (not all pending)
  8. Closes with "This week we're doing X" — written action
- Link to Sheet at the end, not inline
- Posts to #ceo only (business channels are archived)

### error — immediate alert (template: references/error-alert.md)
- Short, actionable, under 500 chars
- What broke, which business, last successful run, link to GitHub Actions
- Posts to #ops-log

### ceo — aggregated digest (template: references/ceo-digest.md)
- Silent on clean days (the only report type that suppresses)
- Lists cross-business warnings only
- Superseded by ceo-daily in practice; keep for compatibility

## Suppress rules
- **ceo:** suppress if all ops-log entries in the last 24h are info-level
- **ceo-daily:** NEVER suppress (proof of life)
- **weekly:** NEVER suppress (weekly cadence is the commitment)
- **error:** NEVER suppress (that's the whole point)

## Unavailable data — how to surface it
If stage 01 returned any entries in `unavailable`, add a short paragraph at the end:

> *Data gaps: GA4 unavailable (analytics-mcp not connected in trigger environment). SafeBath /trial/ conversion rate missing.*

Do not silently omit. Bill decides whether to fix the gap.

## Outputs to Stage 03
- `formatted_message` — ready for Slack
- `report_type`
- `suppressed` — true only for `ceo` type with no warnings
- `unavailable` — passed through for logging
