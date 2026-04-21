---
name: RESUME DISCOUNT CONSOLIDATION — one-page strategy
description: Session handoff for consolidating trial + promo/discount queries on globalhighlevel.com onto one master page. Say "resume the discount consolidation" to pick up.
type: project
originSessionId: 1f0a9d6b-410c-4e53-bb6d-1ff43eef6dab
---
# Resume the discount consolidation

When Bill says "resume the discount consolidation," load this file. Plan agreed 2026-04-20, NOT yet executed. Next step is execution.

## The decision (agreed, not yet done)

Consolidate all GHL discount + free trial search intent onto ONE master page:
**`/blog/gohighlevel-promo-code-discount-2026-real-ways-to-save/`**

Reason: GSC data on 2026-04-20 showed 6 URLs fighting for the same queries, splitting signal, earning 287 total impressions and 2 clicks in 30 days.

## Baseline numbers (for measuring whether consolidation works)

Pulled 2026-04-20 from GSC (`sc-domain:globalhighlevel.com`), 30-day window `2026-03-21 → 2026-04-19`:

| Page | Queries | Impressions | Clicks |
|---|---|---|---|
| `/trial/` (blocked ghost) | 22 | 157 | 0 |
| `/blog/gohighlevel-free-trial-30-days-extended/` | 16 | 65 | 0 |
| `/coupon/` | 12 | 25 | **2** |
| `/blog/gohighlevel-promo-code-discount-2026-real-ways-to-save/` (master) | 10 | 25 | 0 |
| `/blog/how-to-add-coupon-codes-in-gohighlevel-booking-discounts/` | 8 | 8 | 0 |
| `/blog/how-to-create-coupons-in-gohighlevel-boost-conversions/` | 5 | 6 | 0 |
| `/start/` | 0 | 0 | 0 |
| **Combined** | | **287** | **2** |

**Post-consolidation success metric:** master page earns >100 impressions AND >5 clicks per month by day 30. If not, re-examine.

## The execution plan (agreed, not done)

### Change 1: Master post content edits

File: `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/posts/gohighlevel-promo-code-discount-2026-real-ways-to-save.json`

Current structure: 1,633 words, 12 headers (6 H2 + 6 H3). Existing H2s/H3s cover ~60% of the queries.

**Update title + H1** from:
> "GoHighLevel Promo Code 2026: 3 Real Ways to Save"

To:
> "GoHighLevel Promo Code, Discount & Free Trial 2026: Every Way to Save"

**Update meta description** to include discount + free trial wording.

**Add 5 new H3s to existing FAQ section**:

1. **"Is there a GoHighLevel discount code?"** — captures `ghl discount code`, `gohighlevel discount code`, `go high level discount code`, `highlevel discount code`
2. **"Is there a GoHighLevel coupon code?"** — captures `gohighlevel coupon code`, `go high level coupon code`
3. **"How long is the GoHighLevel free trial?"** — captures `gohighlevel free trial duration 2026` (pos 10 — very pushable)
4. **"What's the difference between the 14-day and 30-day GoHighLevel trial?"** — captures `gohighlevel 14-day trial` + reinforces 30-day wedge
5. **"Is GoHighLevel free? / Does GoHighLevel have a free account?"** — captures `is gohighlevel free`, `gohighlevel free account`

Total after: ~2,300 words, 17 headers. Within Attia-spec target.

**Add FAQPage JSON-LD schema** at bottom of html_content for the 10 total FAQ questions.

### Change 2: 301 redirects

Need to add to site's routing/redirect mechanism (Cloudflare or netlify `_redirects` — check `globalhighlevel-site/_redirects` which exists per earlier dir listing):

```
/coupon/                                        /blog/gohighlevel-promo-code-discount-2026-real-ways-to-save/  301
/blog/gohighlevel-free-trial-30-days-extended/  /blog/gohighlevel-promo-code-discount-2026-real-ways-to-save/  301
```

**Preserve hreflang alternates** — the trial blog post's Spanish/Hindi/Arabic siblings stay (they target non-English markets). Update their `<link rel="alternate" hreflang="en">` to point to the master.

### Change 3: Remove robots.txt disallow + add meta noindex to /trial/ and /start/

File: `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/robots.txt`

Current (has ghost problem):
```
Disallow: /trial
Disallow: /free-trial
Disallow: /start
```

Remove those three lines.

File: `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/build.py`

In the trial and start page builders, add:
```html
<meta name="robots" content="noindex, follow">
```

This lets Google crawl, sees noindex, drops from index. Ghost ranking ends.

**Don't canonical /trial/ or /start/ to the master** — they're distinct conversion pages with their own purpose. Just noindex them.

### Change 4: Clean up ambiguous how-to posts

Files:
- `posts/how-to-add-coupon-codes-in-gohighlevel-booking-discounts.json`
- `posts/how-to-create-coupons-in-gohighlevel-boost-conversions.json`

These are about USING GHL's internal coupon feature (for agency owners' own bookings/stores). Different audience than "discount searchers." Fix:

- Update title: prepend "Using GoHighLevel's Coupon Feature" or similar to disambiguate
- Update first H2 to clarify topic is using GHL's feature
- No redirect — keep them indexed, just tighten scope

### Change 5: Ping Google via /indexing-api after deploy

Already built this skill today (2026-04-20). Invocation:

```bash
~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/venv/bin/python \
  ~/Developer/projects/marketing/podcast-pipeline/ghl-podcast-pipeline/scripts/indexing_api.py --urls \
  "https://globalhighlevel.com/blog/gohighlevel-promo-code-discount-2026-real-ways-to-save/" \
  "https://globalhighlevel.com/trial/" \
  "https://globalhighlevel.com/start/" \
  "https://globalhighlevel.com/coupon/" \
  "https://globalhighlevel.com/blog/gohighlevel-free-trial-30-days-extended/"
```

SA must have Indexing API scope and Owner on GSC property (both granted 2026-04-20).

## What's NOT changing (decided, don't rethink)

- Spanish / Hindi / Arabic sibling trial posts — keep separate, serve different markets:
  - `gohighlevel-prueba-gratis-30-dias-como-empezar` (ES)
  - `gohighlevel-free-trial-india-30-days-setup-guide` (IN)
  - `gohighlevel-free-trial-arabic-30-days-guide` (AR)
- `/trial/` and `/start/` landing pages — keep as conversion surfaces, noindex them (don't delete)
- Existing 6 H2s on the master — they work, don't rewrite

## Evidence commands to re-verify state before executing

```bash
# Is robots.txt still blocking /trial and /start?
curl -s https://globalhighlevel.com/robots.txt | grep -iE 'disallow.*(trial|start)'

# Any meta robots tag on /trial/ yet?
curl -s https://globalhighlevel.com/trial/ | grep -i 'meta.*robots'

# Fresh GSC impressions per URL (re-run to compare vs baseline above)
cp /tmp/per-page.js ~/Projects/agent-command-center/pipelines/seo-reporting/_tmp.js && \
  cd ~/Projects/agent-command-center/pipelines/seo-reporting && node _tmp.js
```

## File locations to edit

| Change | File |
|---|---|
| Master post edits | `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/posts/gohighlevel-promo-code-discount-2026-real-ways-to-save.json` |
| robots.txt | `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/robots.txt` |
| noindex meta for /trial /start | `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/build.py` (find /trial and /start page builders) |
| Redirects | `~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/_redirects` |
| Ambiguous how-to titles | Two JSON files in `posts/` (listed above) |

## Ship checklist

1. Edit master post (Change 1)
2. Add redirects (Change 2)
3. Update robots.txt + build.py (Change 3)
4. Update how-to post titles (Change 4)
5. Build: `cd globalhighlevel-site && python3 build.py`
6. Commit + push (Cloudflare/Netlify auto-deploys)
7. Verify live: check master URL, check /coupon/ 301s, check /trial/ has meta noindex
8. Ping Indexing API (Change 5)
9. Note ship date in this memory as "EXECUTED {date}"

## Measurement gate (day 30 post-ship)

Run fresh GSC per-page query. Compare to baseline above. Success = master earns >100 impressions and >5 clicks in 30 days post-ship. If yes → port pattern to ES/IN/AR siblings. If no → content wasn't the gap, revisit assumptions.

## Open questions / flags

- `/start/` currently earns 0 impressions. After removing robots.txt disallow + adding noindex, should stay 0 (no content to rank). If it suddenly earns impressions, something's wrong with the noindex deployment.
- `gohighlevel official website` (22 imp, pos 9.5 on /trial/) is brand-navigation intent, not discount. After /trial/ goes noindex, this query will either drop entirely OR shift to the homepage. Monitor but don't optimize for it.

## Related memories
- `project_globalhighlevel_trial_start_split.md` — the /trial vs /start attribution architecture (keep)
- `reference_globalhighlevel_robots_architecture.md` — robots.txt + noindex design (UPDATE after ship — currently says /trial and /start are disallowed; will need correction once we switch to meta noindex)
- `project_verticals_session_handoff.md` — separate workstream, don't confuse
