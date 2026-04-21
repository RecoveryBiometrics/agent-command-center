---
name: GlobalHighLevel /trial is noindex; /start 301s to master (updated 2026-04-21)
description: /trial/ is noindex podcast conversion page. /start/ is no longer built — 301s to master blog post. robots.txt disallow removed in favor of meta noindex. Do NOT flag /trial/ GSC impressions as a ranking problem.
type: reference
originSessionId: 1f0a9d6b-410c-4e53-bb6d-1ff43eef6dab
---
# /trial and /start architecture on globalhighlevel.com

## The rule (updated 2026-04-21 after Option 2 consolidation)

**`/trial/`** — podcast listener conversion page. Stays live. Served with `<meta name="robots" content="noindex, follow">` via `base_html(noindex=True)` in `build.py`. Same content as before (Extendly, 11 FAQs, CTAs). ~2,820 words. Excluded from sitemap.

**`/start/`** — NO LONGER BUILT. `_redirects` entry 301s `/start` → `/blog/gohighlevel-free-trial-30-days-extended/` (master). All 742 blog-internal CTAs that point at /start/ now flow authority to the master via 301.

**Master search-facing page** — `/blog/gohighlevel-free-trial-30-days-extended/` — authoritative page for ALL trial + promo + discount intent. 4,975 words, 14 H2s, 19 FAQ H3s, Extendly section, FAQPage schema. Indexed and in sitemap.

**robots.txt** — was `Disallow: /trial /free-trial /start`. Those disallow lines were REMOVED 2026-04-21. Google can now crawl /trial/, see the meta noindex, and properly drop it from the index (vs ghost-ranking it from external links, which was the pre-ship problem).

## What this means for GSC analysis (post-consolidation)

- `/trial/` still has `<meta name="robots" content="noindex, follow">` — Google will crawl it, see noindex, and drop it from index within 7-14 days post-deploy. Expect ghost rankings to fade to zero.
- The SEO-facing page for all trial + promo + discount queries is `/blog/gohighlevel-free-trial-30-days-extended/`. Redirect traffic from `/start/`, `/coupon/`, and the old promo blog all consolidate here.
- Do NOT propose to "fix /trial/ ranking." /trial/ is intentionally noindex for podcast attribution only.

## Localized variants (/es/trial/, /in/trial/, /ar/trial/)

Also noindex now — same `base_html(noindex=True)` treatment. Still live as conversion pages for non-English podcast listeners.

Localized `/start/` variants (/es/start/, /in/start/, /ar/start/) are ALSO no longer built — same 301 target as English `/start/`.

## Attribution architecture

- `/trial/` = podcast listener traffic (from show notes links)
- `/start/` = blog CTA traffic (internal links from blog posts)
- Both fire `ghl_click` GA4 event when the user clicks the affiliate button on them
- `pagePath` dimension in GA4 = attribution source

See also: `project_globalhighlevel_trial_start_split.md`
