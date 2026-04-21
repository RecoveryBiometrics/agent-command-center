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
| Trailing-slash redirect variants added (Netlify treats `/coupon` vs `/coupon/` as distinct) | `db585b5` | `_redirects` |
| Localized `/es/start/`, `/in/start/`, `/ar/start/` → localized trial blog masters | `7f622a5` | `_redirects` |

Repo: `RecoveryBiometrics/Claude-notebookLM-GHL-Podcast` branch `main`.

## Pain points hit during ship (document so future sessions don't repeat)

**Pain 1 — Netlify credit limit pause silently dropped commits.** Commits pushed while Netlify team was over credit limit got queued but NEVER deployed — even after upgrading, the queued deploys were dropped. Fix: always check Netlify deploy history after push; upgrade Netlify before shipping big changes.

**Pain 2 — Cloudflare CDN cached pre-deploy 200s for 7 days (s-maxage=604800) on URLs that got removed.** Purge cache API cleared the CDN edge but files still showed 200 from origin. Root cause: origin still had files until commit 3788bf1 actually deployed.

**Pain 3 — Netlify `_redirects` treats trailing-slash variants as distinct.** `/coupon 301` does NOT match `/coupon/`. Both forms need explicit rules. Confirmed by observing `/coupon → 301` but `/coupon/ → 200`. Fix: always add both `/foo` and `/foo/` entries in `_redirects`.

**Pain 4 — Weekly SEO Report was silently failing for 2+ weeks** (GSC permission error). Found via `gh run list --workflow weekly-seo-report.yml`. Fix: SA swap in secret + add Slack failure alerts (commit `d697a58`) so future silent failures can't hide.

**Pain 5 — Cloudflare API token scopes matter.** P2P-project token had `Zone.Read` but not `Zone.Cache Purge.Purge`. Created a new dedicated token `ghl-cache-purge` stored at `~/.secrets/cloudflare-globalhighlevel-token` with only the Cache Purge scope for globalhighlevel.com.

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
- `reference_globalhighlevel_robots_architecture.md` — updated 2026-04-21 to reflect meta-noindex architecture
- `project_verticals_session_handoff.md` — separate workstream, Day-14 gate ~Apr 30

---

# OPEN ITEMS AT SESSION END (2026-04-21 evening)

When you resume, these are the only loose threads:

## Verify within 24-48 hours

1. **Last commit (`7f622a5`) deployed to live** — adds localized `/es/start/`, `/in/start/`, `/ar/start/` → language-specific trial blog 301s. Verify:
   ```bash
   for u in /es/start/ /in/start/ /ar/start/; do
     curl -sI "https://globalhighlevel.com${u}" | head -1
   done
   ```
   All three should show `301`. If not, that commit didn't deploy — force via Netlify "Trigger deploy" button.

2. **Indexing API pings** from today (5 URLs incl. master, /trial/, /coupon/, /start/, old promo blog) — Google should have crawled them within 24h. Check with:
   ```bash
   ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/venv/bin/python <<'EOF'
   from google.oauth2 import service_account
   from googleapiclient.discovery import build
   from pathlib import Path
   creds = service_account.Credentials.from_service_account_file(
       str(Path.home() / ".secrets/safebath-seo-agent-c5d8ed814401.json"),
       scopes=["https://www.googleapis.com/auth/webmasters"])
   import google.auth.transport.requests
   client = creds
   # use URL Inspection API on the 5 URLs, compare lastCrawlTime to 2026-04-21 ping times in ~/.claude/skills/indexing-api/state/pings.jsonl
   EOF
   ```

## Opportunity flagged but NOT addressed today (worth picking up soon)

**AI-agent content cluster is quietly winning.** In the GSC analysis we did today, 3 of the top 5 traffic-earning blog posts are AI-agent topics:
- `build-ai-agents-faster-gohighlevel-template-library-guide` — 4 clicks / 987 impressions pos 9
- `how-to-build-ai-agents-in-gohighlevel-agent-studio-guide` — 9 sessions (GA4)
- `automate-client-support-ask-ai-agent-studio-gohighlevel` — **1,612 impressions** pos 9, only 2 clicks (CTR problem — perfect candidate for FAQ treatment like we just did on the trial master)
- Plus `how-to-use-mcp-server-gohighlevel-ai-integration` at pos 2 for "mcp gohighlevel"

Potential next move: build an AI-agent hub page, run the same consolidation pattern. Could be the next master-blog-style ship. Say "resume the AI-agent cluster" to pick up.

## Items for your attention (not mine)

1. **Your uncommitted WIP in podcast-pipeline** (survived across 5 stash/pop cycles today, so it's intact):
   - Modified: `CLAUDE.md`
   - Modified: `ghl-podcast-pipeline/dashboard/app.py`
   - New untracked: `ghl-podcast-pipeline/dashboard/templates/system.html`
   
   Not mine to commit. Decide: commit if done, stash properly if mid-thought.

2. **Netlify credit limit** — upgraded today (caused 3 of your commits to silently fail-deploy this afternoon). Monitor usage — if builds get throttled or paused again, upgrade tier or reduce build frequency.

## Deferred skill work (not urgent)

1. **SessionStart hook** for drift detection — would show `git status` across the 3 known repos at each session start so uncommitted work doesn't pile up. Discussed earlier today; deferred.
2. **Cache purge automation** — CF token at `~/.secrets/cloudflare-globalhighlevel-token` (scope: Zone.Cache Purge.Purge for globalhighlevel.com). Could wire into the `/indexing-api` skill OR a new `/deploy-assist` skill so future ships auto-purge CF cache. Not urgent since the token exists and is documented.
3. **Netlify build hook** — not created today. Only needed if auto-deploy silently fails again. Bill decided to create only if needed.

## Measurement gate: 2026-05-21 (Day 30)

Re-run the 10 validation tests from today's audit. Compare to baseline above. All numbers are in the "Baseline GSC numbers" section of this file.
