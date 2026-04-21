---
name: GlobalHighLevel /trial and /start are noindex BY DESIGN
description: /trial/ and /start/ on globalhighlevel.com are affiliate redirects, disallowed in robots.txt and excluded from sitemap. Do NOT flag their GSC pos/impressions as a ranking problem — that's Google surfacing them despite the disallow.
type: reference
originSessionId: 1f0a9d6b-410c-4e53-bb6d-1ff43eef6dab
---
# /trial and /start architecture on globalhighlevel.com

## The rule

`/trial/` and `/start/` exist as conversion surfaces for affiliate redirects, NOT as SEO ranking pages. They are intentionally:

- **Disallowed in `robots.txt`**: `Disallow: /trial`, `Disallow: /free-trial`, `Disallow: /start`
- **Excluded from `sitemap.xml`**: neither root path appears as a `<loc>`
- Per `build.py:1582` comment: *"/trial is an affiliate redirect — excluded from sitemap and disallowed in robots.txt"*

## What this means for GSC analysis

- `/trial/` appearing in GSC at pos ~47 with high impressions and 0 clicks is **not a ranking bug**. Google shows the URL in SERPs because other indexed pages (blog posts, nav) link to it, but can't crawl the content to rank it properly. The "ghost ranking" is expected.
- Do NOT propose to "fix /trial/ ranking." Actions on /trial/ itself are wasted effort.
- The actual SEO-facing page for trial queries is `/blog/gohighlevel-free-trial-30-days-extended/` (+ its localized siblings). That post IS indexed, sitemap-listed, and ranking.

## Scope of the disallow

The robots.txt rule `Disallow: /trial` only blocks URLs starting with `/trial` (root). It does NOT block:
- `/es/trial/`, `/in/trial/`, `/ar/trial/` — localized versions (different prefix)
- `/es/start/`, `/in/start/`, `/ar/start/` — same

Those localized versions ARE indexable and were pinged via Indexing API on 2026-04-20.

## Attribution architecture

- `/trial/` = podcast listener traffic (from show notes links)
- `/start/` = blog CTA traffic (internal links from blog posts)
- Both fire `ghl_click` GA4 event when the user clicks the affiliate button on them
- `pagePath` dimension in GA4 = attribution source

See also: `project_globalhighlevel_trial_start_split.md`
