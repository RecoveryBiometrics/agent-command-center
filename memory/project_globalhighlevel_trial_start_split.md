---
name: GHL /trial + /start landing page split
description: Why globalhighlevel.com has two identical affiliate landing pages — podcast vs blog attribution
type: project
originSessionId: f347abf0-0a41-4041-bb7d-6506e70a4814
---
`globalhighlevel.com/trial/` and `globalhighlevel.com/start/` are intentionally identical landing pages. Both stack GHL + Extendly affiliates. Do NOT consolidate them.

**Why:** Podcast apps (Spotify, Apple Podcasts, etc.) strip referrers, so podcast-driven traffic lands in "(direct)/(none)" in GA4 and GHL's FirstPromoter dashboard — indistinguishable from blog-driven traffic. The two-page split uses `page_path` as the attribution key instead of referrer.

- `/trial/` → podcast show-notes traffic (show notes link stays `/trial` forever — already baked into published episodes)
- `/start/` → blog post CTAs and site nav buttons (build.py `_ga_snippet` detects both paths for `cta_click`)

Each page's GHL buttons carry `utm_campaign=podcast-{hero,skip,bottom}` or `utm_campaign=blog-{hero,skip,bottom}`. GHL's affiliate dashboard Campaign filter reads these for a second attribution layer.

Both pages are excluded from sitemap and disallowed in robots.txt (thin affiliate content, would compete with blog posts in Google).

**How to apply:** If you ever refactor `build_trial_page()` in `globalhighlevel-site/build.py`, keep the two-page pattern. `_build_affiliate_landing(slug, campaign)` is the shared builder — call it twice. Built 2026-04-15.
