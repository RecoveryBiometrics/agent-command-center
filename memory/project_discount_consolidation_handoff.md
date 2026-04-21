---
name: DISCOUNT CONSOLIDATION — shipped 2026-04-21 (Option 2)
description: Discount + trial + promo content consolidated onto one master page on globalhighlevel.com. Ship executed 2026-04-21. Day-30 measurement gate 2026-05-21.
type: project
originSessionId: 1f0a9d6b-410c-4e53-bb6d-1ff43eef6dab
---
# Discount Consolidation — SHIPPED 2026-04-21

Executed the Option 2 consolidation plan. All trial + promo + discount intent funnels to ONE authority blog post. Say "resume the discount consolidation" to check on progress or rerun measurement.

## What shipped (evidence)

| Change | Commit | Where |
|---|---|---|
| Master blog post expanded to 4,975 words with Extendly section + ported /coupon/ + promo content | `2fcf7d2` | `posts/gohighlevel-free-trial-30-days-extended.json` |
| 301 redirects for /coupon/, /start/, promo blog, legacy URLs → master | `2fcf7d2` | `globalhighlevel-site/_redirects` |
| robots.txt disallow removed; meta noindex added via `base_html(noindex=True)` | `2fcf7d2` | `robots.txt`, `build.py` |
| Stale `/trial/` and `/coupon/` internal links updated to master | `2fcf7d2` | `build.py`, `unsolicited-sms-...json` |
| `/coupon/` and `/start/` removed from build + promo blog JSON deleted (so Cloudflare 301s fire) | `3788bf1` | `build.py`, deleted `posts/gohighlevel-promo-code-discount-2026-real-ways-to-save.json` |

Repo: `RecoveryBiometrics/Claude-notebookLM-GHL-Podcast` branch `main`.

## Architecture (post-ship)

**SEARCH-FACING (indexed, sitemap included):**
- `/blog/gohighlevel-free-trial-30-days-extended/` — THE master page for ALL trial + promo + discount intent
  - Title: "GoHighLevel 30-Day Free Trial, Promo Codes & Discounts 2026: Every Way to Save"
  - 14 H2 sections, 19 FAQ H3s, 13 Q&As in FAQPage schema, 7 Extendly mentions
  - Receives 742 internal links via /start/ 301 redirect (blog→/start/→master)
  - Extendly CTA: `getextendly.com?deal=vqzoli&fp_sid=master-discount-guide`

**NOT-IN-SEARCH (noindex, preserve for conversion flow):**
- `/trial/` — podcast listener conversion page. Same content as before; now has `<meta name="robots" content="noindex, follow">`. Full 11-FAQ + Extendly page remains.
- `/es/trial/`, `/in/trial/`, `/ar/trial/` — localized podcast conversion pages, same noindex treatment

**301 REDIRECTS (fire from _redirects):**
- `/start`, `/coupon`, `/promo`, `/promo-code`, `/discount`, `/coupon-code`, `/free-trial` → master
- `/blog/gohighlevel-promo-code-discount-2026-real-ways-to-save` → master

## Baseline GSC numbers (pre-ship, measure against at day 30)

Pulled 2026-04-21, window `2026-03-22 → 2026-04-20`:

| URL | Queries | Impressions | Clicks |
|---|---|---|---|
| `/trial/` (blocked ghost) | 22 | 157 | 0 |
| `/blog/gohighlevel-free-trial-30-days-extended/` | 16 | 65 | 0 |
| `/coupon/` | 12 | 25 | **2** |
| `/blog/gohighlevel-promo-code-discount-2026-real-ways-to-save/` | 10 | 25 | 0 |
| `/blog/how-to-add-coupon-codes-.../` | 8 | 8 | 0 |
| `/blog/how-to-create-coupons-.../` | 5 | 6 | 0 |
| **Combined** | | **287** | **2** |

## Day-30 measurement gate (May 21, 2026)

**Success criteria:**
- Master blog post >200 impressions AND >5 clicks (absorbs 127 ghost imp + 65 current + 25 promo imp + redirects)
- Master blog post average position <15 (improvement from current 28)
- `/trial/` search visibility → ~0 (Google drops it post-noindex crawl)
- `/coupon/`, `/start/`, promo blog return 301s in GSC URL Inspection

**How to measure:**
```bash
# Re-run the 10 validation tests from the pre-ship audit:
cat /tmp/tests2.js  # or grab from the memory-linked skill if stored there
cd ~/Projects/agent-command-center/pipelines/seo-reporting && node /tmp/tests2.js
```

Or invoke the weekly `/report` — which now runs (pipeline was fixed this same day, see commits `1f66bc9`, `6608575`, `d697a58`).

## Other fixes shipped same day

1. **Weekly SEO Report pipeline** — was silently failing for 2+ weeks (GSC permission error). Fixed by swapping `GOOGLE_SERVICE_ACCOUNT_KEY` to `seo-agent@safebath-seo-agent.iam.gserviceaccount.com` (which is now Owner on both GSC properties). Manual verification run 24747543884 succeeded. Automatic next run: Tuesday 9:07 ET.
2. **Failure alerts** — added `if: failure()` Slack alerts to weekly-seo-report.yml and weekly-analytics.yml (content-builder already had it). Routes to #ops-log channel C0AQG0DP222. Commit `d697a58`.
3. **Sheets API + Drive API** enabled in project `safebath-seo-agent`. SA granted writer access to GHL tracking sheet `1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`.

## What to watch in the first 24 hours

- Cloudflare deploy propagation — `/coupon/`, `/start/`, old promo blog should all return 301 (`curl -I`)
- Google Indexing API ping on master blog post (queued post-deploy verification)
- No new errors on pipelines (weekly-seo-report, weekly-analytics, content-builder)

## What to watch day 3-14

- GSC URL Inspection on master: should show updated `lastCrawlTime` post-ping
- GSC URL Inspection on `/trial/`: coverageState should shift from "Crawled - currently not indexed" (ghost) → dropped entirely over ~7-14 days
- Trial-intent queries should start appearing on the master's GSC page report

## What NOT to re-propose

- ~~Keep two masters (trial + promo separate)~~ — dismissed, consolidation is cleaner, 742 internal links now concentrate on ONE page
- ~~Keep `/trial/` disallowed in robots.txt~~ — switched to meta noindex (crawlable, droppable) which is the correct modern SEO pattern
- ~~Add a `/session-end` skill that needs invocation~~ — future work; use a SessionStart hook instead (Skills First Rule #3 fix, deferred)

## Related memories

- `project_globalhighlevel_trial_start_split.md` — original /trial vs /start attribution rationale (still valid)
- `reference_globalhighlevel_robots_architecture.md` — NEEDS UPDATE: says /trial/ and /start/ are disallowed in robots.txt, but now they're meta-noindex (and /start/ is deleted, just a 301)
- `project_verticals_session_handoff.md` — separate workstream, Day-14 gate ~Apr 30
