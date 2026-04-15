# CEO Daily Narrative Template

**Format:** Amazon WBR-inspired plain-English narrative. One post per day to #ceo, covering all businesses. Bill reads it with coffee at 7am ET.

**Philosophy**
- Full sentences. No bullets, no dashboards, no emoji soup.
- Every pipeline must "report in" — silence = broken. Proof of life beats silent-on-success while the system is fragile.
- If a pipeline produced nothing, say so AND say **why** (cooldown / no opportunities / no new events / error). Zero-output with a valid reason is fine. Zero-output with no reason is a red flag.
- Anomalies get a sentence. Clean runs get acknowledged in one line.
- Same shape every day. Comparability > novelty.

## Structure

```
*CEO Daily — {Weekday, Month Day}*

{Per-business paragraph, 3–6 sentences. See rules below.}

{Per-business paragraph for next business...}

{Cross-cutting anomalies paragraph — only if anything is dark, stale, or diverging.}

{Analytics one-liner — yesterday's sessions per business.}

{Closing line: "Nothing else worth your attention today." OR "One thing to decide: {X}."}
```

## Per-business paragraph rules

Each business gets one paragraph. Must answer:
1. **Did the pipeline(s) run?** Name the pipeline and the time.
2. **What did it produce?** Real numbers. "3 new listings in Thorndale, PA" not "some listings."
3. **If nothing produced, why?** Cite the specific reason from ops-status.json (cooldown, no events, threshold not met, error).
4. **Anything worth watching?** Pattern forming (e.g., "4th day in a row with no new articles"), drop-off, sync gap.
5. **Severity tag:** Open with "had a quiet day" / "had a busy day" / "had a concerning day" / "is dark" so Bill can skim.

## Anomalies paragraph

Only include if at least one of these is true:
- Any pipeline's last run >24h ago (for daily pipelines) or >7d (for weekly)
- Live site diverges from origin (VPS sitemap mismatch, Cloudflare stale)
- Any pipeline errored in the last 24h
- Any trigger hasn't fired in its expected window

Write in plain English. Example:
> "FB Social is dark. Last post was April 7. The trigger is supposed to fire daily at 8:07am ET. Either the trigger died or the script is failing silently. Recommend investigating before tomorrow's post window."

## Analytics one-liner

One sentence per business with a GA4 property. Yesterday's sessions + organic %.
> "SafeBath 26 sessions yesterday (85% organic). GHL 169 sessions (28% organic, 96% new visitors — retention is still weak)."

## Closing

- If nothing needs action: "Nothing else worth your attention today."
- If something needs a decision: "One thing to decide: {specific question}."
- Never say "all systems green" or similar. Silence = green.

## Hard rules

- **Plain English only.** No bullet lists inside paragraphs. No tables. No emoji except at severity tags if necessary.
- **Real numbers only.** If a number is missing, say "no data yet" — don't estimate.
- **Under 4000 chars** (Slack single-message limit). If longer, it's too verbose — tighten the per-business paragraphs.
- **Name the pipeline by its real name** (e.g., "podcast pipeline Cycle #5", "content pipeline", "business discovery"). Bill knows these.
- **Absolute dates, not relative.** "April 7" not "last week."
- **Open with the weakest business first** if there's anything concerning. Lead with what needs attention.

## Example (mocked from real data, 2026-04-15)

```
*CEO Daily — Wednesday, April 15*

GHL had a busy day but a concerning one. The podcast pipeline finished Cycle #5 overnight with 4 India blogs, 5 Spanish blogs, and 1 failure that's being investigated. 669 new posts auto-deployed at 1:40pm. However, pipeline health flagged three warnings: the VPS working tree has 4 unexpected entries, the live sitemap is 38 URLs behind origin, and the last successful deploy was 142 hours ago against an expected daily cadence. Cloudflare may be serving stale. This is the biggest item on the list.

SafeBath had a quiet day. The daily pipeline ran at 8:01am and pushed news + directory updates. Business discovery, quality auditor, and GSC miner all ran cleanly. No new articles published — the cities in today's batch had no new events on Eventbrite, Patch, or AllEvents, which is now the 4th consecutive day. If this runs to 7 days I'll flag it as a source-health issue rather than a batch-cycle explanation.

FB Social is dark. Last post was April 7. The trigger is supposed to fire daily at 8:07am ET. Either the trigger died or the script is failing silently. Recommend investigating before tomorrow's post window.

SafeBath 26 sessions yesterday (85% organic). GHL 169 sessions (28% organic, 96% new visitors — retention is still weak).

One thing to decide: whether to pause GHL auto-deploys until the VPS sync gap is resolved, or keep deploying and clean up after.
```

## Input data (from stage 01)

The composer needs, per business:
- `ran_at` — timestamps of every pipeline run in the last 24h
- `outcome` — ok / warning / error
- `count` — what was produced (posts, listings, optimizations)
- `reason` — if count is 0, why
- `last_successful_run` — for detecting silence
- `health_warnings` — VPS/origin/Cloudflare sync status
- `yesterday_sessions` + `organic_pct` — from GA4
- `trigger_last_fired` — for each daily trigger, when it last ran

If any of these are missing, the composer says so explicitly — never fabricates.
