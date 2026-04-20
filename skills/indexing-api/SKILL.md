---
name: indexing-api
version: 1.0.0
description: "Pings Google Indexing API on new/updated URLs to force same-day discovery. Use when shipping hub pages, verticals, or any URL that can't wait 3-7 days for Google's sitemap re-fetch cycle."
invocation: /indexing-api
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
triggers:
  - ping google indexing
  - force google to crawl
  - submit urls to google
  - request indexing api
  - google discovery
  - new url hasn't been crawled
  - url is unknown to google
---

# /indexing-api — Force Google to discover URLs same-day

Google's sitemap re-fetch cycle is 3-7 days. For new hub/pillar/vertical pages, that lag means "Submitted - currently not indexed" verdicts persist and the Day-14 measurement gate fails by default. The Indexing API bypasses the sitemap wait by telling Google "crawl this URL now." Normally results in a crawl within minutes to hours.

This skill owns the **judgment** of which URLs deserve a ping, when, and what to do with results. It delegates **execution** to a deterministic Python tool (`indexing_api.py`) that has no opinions.

## The rule

**A ping is a crawl request, not an index guarantee.** Pinging a thin or duplicate page still results in "Crawled - currently not indexed." Don't ping low-quality URLs to inflate numbers — ping URLs that should rank and would otherwise wait weeks for discovery.

Corollary: every ping is audited. If >50% of pings from a deploy end up "Crawled - currently not indexed" 7 days later, that's a content-quality signal. Surface it.

## Invocation (parameterized)

```
/indexing-api --urls <u1> <u2> ...             # ad-hoc one-offs
/indexing-api --business <id> --source deploy-diff
                                               # diff against last build manifest
/indexing-api --business <id> --source gsc-unknown
                                               # every URL currently "unknown to Google"
/indexing-api --business <id> --source verdict-neutral-stale --days 7
                                               # "crawled not indexed" older than N days
/indexing-api --audit --days 30                # ping → eventual index rate
/indexing-api --retry-failures                 # re-ping last run's 4xx/5xx
/indexing-api --verify --since <YYYY-MM-DD>    # URL-Inspect recent pings to confirm crawl
```

## Phase 0 — Load context (resolver fires)

Before any ping, read in order:

1. **`~/.claude/skills/indexing-api/state/pings.jsonl`** — last 30 days of ping history. Used to dedupe (don't re-ping URL already pinged in last 48h unless `--retry-failures`).
2. **`~/.claude/skills/indexing-api/state/verifications.jsonl`** — 24h-later URL Inspection verdicts for past pings. Used to compute ping → index rate.
3. **`agent-command-center/businesses/<id>.yaml`** — get `gsc_site_url` (for source=gsc-unknown) and verify `sitemap_url` is set.
4. **`~/.secrets/safebath-seo-agent-c5d8ed814401.json`** — the service account JSON. Must have Indexing API scope (`https://www.googleapis.com/auth/indexing`).

**Pre-flight checks (STOP if any fail, don't silently skip):**
- Service account file exists and is readable
- Service account has been granted Owner on the GSC property (not just User)
- Indexing API is enabled in the service account's Google Cloud project

If the SA doesn't yet have Owner permission, surface a clear error with the 2-step fix:
1. Enable API: `https://console.cloud.google.com/apis/library/indexing.googleapis.com`
2. Add `seo-agent@safebath-seo-agent.iam.gserviceaccount.com` as **Owner** in GSC → Settings → Users and permissions

## Phase 1 — Source the URL list

**Issue:** Different situations call for different URL sets. Hardcoding breaks the method-call test.

**Context:** The `--source` flag routes to a different URL-gathering strategy. Each strategy is named, purposeful, and implementable:

| Source | How to gather | When to use |
|---|---|---|
| `--urls` | Arg list | Ad-hoc: today's hub + pillar fix |
| `deploy-diff` | Compare current `posts/*.json` manifest to previous build's manifest. Diff = new or modified URLs. | Every auto-deploy. Most common case. |
| `gsc-unknown` | URL Inspection API over sitemap, filter `coverageState == "URL is unknown to Google"` | Weekly cleanup of orphaned pages |
| `verdict-neutral-stale` | URL Inspection, filter `verdict == NEUTRAL` with `lastCrawlTime > N days` | Re-push pages Google crawled but didn't index; test if content updates helped |

**Mechanism:** Run the strategy, collect URLs, dedupe, filter out anything already pinged in last 48h (unless `--retry-failures`).

**Action:** Output URL list to stdin of the deterministic tool.

**Verification:** Count check. If URL count = 0, exit cleanly with "nothing to ping." If > 200 (daily API limit), chunk and warn.

## Phase 2 — Invoke the deterministic tool

**Issue:** Actual HTTP POST to Google must be reliable and auditable.

**Context:** The tool at `~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/scripts/indexing_api.py` is dumb. It takes URLs via stdin or `--urls`, reads the SA key, POSTs each to `https://indexing.googleapis.com/v3/urlNotifications:publish` with body `{"url": ..., "type": "URL_UPDATED"}`, logs to JSONL. No retry logic, no source resolution, no judgment.

**Mechanism:**
```bash
printf '%s\n' "${URL_LIST[@]}" | \
  ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/venv/bin/python \
  ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/scripts/indexing_api.py
```

**Action:** Capture the JSONL output, one line per URL with `{url, status_code, response, ts}`.

**Verification:** Every URL got a response. 2xx = accepted, 4xx = probably auth/permission, 5xx = Google-side.

## Phase 3 — Record results and surface failures

**Issue:** Results must be persisted for auditing and so future pings can dedupe.

**Context:** `state/pings.jsonl` is append-only. Every ping ever made gets a line.

**Mechanism:**
- Append each tool result line to `state/pings.jsonl` with added context (business_id, source, invoked_by).
- Count successes / failures.
- If any 4xx failure = auth issue: post to Slack #ops-log with the exact fix.
- If any 5xx = Google flaky: retry once after 30s delay, then give up.
- If all success: silent (no Slack noise for happy path).

**Action:** Slack alert only on failure. Write summary to stdout.

**Verification:** Read back the last N lines of `pings.jsonl`, confirm all intended URLs were written.

## Phase 4 — Verify (async, 24h later)

**Issue:** A 200 from Indexing API means "accepted." It does NOT mean "crawled," let alone "indexed." Need a deferred check.

**Context:** URL Inspection API can confirm `lastCrawlTime` moved forward post-ping.

**Mechanism:**
- `--verify --since YYYY-MM-DD` re-inspects every pinged URL from that date
- For each, compare inspection `lastCrawlTime` vs. ping `ts`. If crawl post-dates ping → success.
- Write verdict to `state/verifications.jsonl`.

**Action:** Weekly cron runs `/indexing-api --verify --since <7 days ago>` and generates a summary: "ping → crawl rate: X%, ping → index rate: Y%."

**Verification:** Summary counts agree with raw JSONL.

## Phase 5 — Audit mode

**Issue:** Need a way to evaluate whether pinging is helping vs. wasted effort.

**Context:** `state/pings.jsonl` + `state/verifications.jsonl` = complete history.

**Mechanism:** `--audit --days 30` reads both, joins on URL, computes:
- Total pings
- % accepted (2xx from Indexing API)
- % crawled within 48h (from verifications)
- % indexed within 7 days (from verifications)
- Bottom 10 URLs: pinged but "Crawled - currently not indexed" — flag for content review

**Action:** Human-readable report to stdout. Optionally post to Slack #ops-log weekly.

## Persistent state

```
~/.claude/skills/indexing-api/state/
├── pings.jsonl            # append-only ping log
├── verifications.jsonl    # 24h+ later URL Inspection verdicts
└── last-run.json          # {ts, business_id, source, url_count, success_count}
```

**`pings.jsonl` schema (one JSON per line):**
```json
{
  "url": "https://example.com/page/",
  "ts": "2026-04-20T14:30:00Z",
  "status_code": 200,
  "response": {"urlNotificationMetadata": {...}},
  "business_id": "globalhighlevel",
  "source": "deploy-diff",
  "invoked_by": "auto-deploy-commit" 
}
```

**`verifications.jsonl` schema:**
```json
{
  "url": "https://example.com/page/",
  "ping_ts": "2026-04-20T14:30:00Z",
  "verified_ts": "2026-04-21T14:30:00Z",
  "verdict": "PASS",
  "coverageState": "Submitted and indexed",
  "lastCrawlTime": "2026-04-20T15:45:00Z",
  "crawl_happened_after_ping": true
}
```

## Self-improving rules

After every session involving this skill, check and update:

1. **>50% of pings returned 403/401?** → Service account lost Owner permission. Add a Phase 0 early-exit with the fix instructions. Update this section with date + what happened.
2. **>30% of pings end up "Crawled - currently not indexed" after 7 days?** → Content-quality issue, not API issue. The ping worked; the content didn't deserve index. Surface the URL list for review, don't hide it.
3. **User corrected a URL choice?** → Update the `--source` router in Phase 1 with the missing case.
4. **Daily 200-URL quota hit before noon?** → Add priority ranking in Phase 1 (hub/pillar > blog > tag pages).
5. **Verification phase skipped for >30 days?** → Add a cron reminder to the verticals or reporting pipeline.

**Change log (append as learned):**
- 2026-04-20 v1.0.0 — Initial build. Prompted by Day-14 verticals gate and 8 live-but-unknown URLs on globalhighlevel.com.

## Method-call test (10 invocations, 10 correct outputs)

1. `/indexing-api --urls https://a.com/p` → 1 ping, 1 log entry
2. `/indexing-api --urls https://a.com/p1 https://a.com/p2` → 2 pings
3. `/indexing-api --business globalhighlevel --source deploy-diff` → varies with commit diff
4. `/indexing-api --business safebath --source deploy-diff` → same skill, different business
5. `/indexing-api --business globalhighlevel --source gsc-unknown` → N pings for orphaned URLs
6. `/indexing-api --business globalhighlevel --source verdict-neutral-stale --days 7` → crawl-not-indexed retries
7. `/indexing-api --retry-failures` → re-pings last run's 4xx/5xx
8. `/indexing-api --verify --since 2026-04-13` → URL Inspection deltas, no new pings
9. `/indexing-api --audit --days 30` → summary report, no pings
10. `/indexing-api --urls X --dry-run` → shows what would ping, doesn't actually

Same skill. Ten arguments. Ten correct outputs. Passes the method-call test.
