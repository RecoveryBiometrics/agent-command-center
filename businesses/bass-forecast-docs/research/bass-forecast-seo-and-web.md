# Bass Forecast — SEO & Web Presence

> Last updated: 2026-04-03
> Source: Public web research. Nothing fabricated. Gaps noted explicitly.

---

## Site Structure — bassforecast.com

**~400+ URLs in sitemap** (bassforecast.com/sitemap.xml)

### Content Breakdown

| Content Type | Count | URL Pattern | Notes |
|-------------|-------|-------------|-------|
| Blog/educational articles | ~250+ | /[descriptive-slug] | Techniques, species guides, gear reviews, seasonal strategy |
| Weekly 10-Day Outlooks | ~100+ | /bass-fishing-10-day-outlook-[date] | By region, Oct 2024 – Mar 2026. 7 US regions covered. |
| State pages | ~15 | /[state-abbrev]-bass-fishing | FL, TX, MI, GA, IL, AR, IA, KS, MS, NY, AL, VA. Thin content. |
| Lunker Club profiles | ~100+ | /[angler-name-date] | User catch submissions |
| "Top Lakes" articles | ~10 | /top-5-[state]-lakes-bass-fishing | Blog-style only. NOT dedicated lake pages. |
| Core pages | ~20 | Various | Homepage, How It Works, Premium, Solunar, FAQ, Contact, etc. |
| Shop | Separate | shop.bassforecast.com | Shopify — apparel and gear |

### URL Structure
- **Flat** — blogs, Lunker Club, state pages all sit at root level
- No /blog/ prefix, no /lakes/ directory, no clear taxonomy
- robots.txt is wide open (no Disallow rules)

---

## CRITICAL FINDING: Zero Dedicated Lake Pages

The sitemap has **no individual lake pages** (no /lake/lake-fork-tx, no /lakes/guntersville, nothing).

Lakes only appear inside blog articles like "Top 5 Texas Lakes for Bass Fishing."

The app provides location-specific forecasts, historical data, and waterbody info — but **none of this is exposed as indexable web pages.**

### Why This Matters
- 85% of traffic is organic search (per Landon — unverified but plausible given the content volume)
- Creating 10,000+ lake pages would be entirely net-new indexable content
- Each lake page could surface forecast data, local tips, seasonal patterns, bait recommendations
- This is the single biggest SEO opportunity — compounds massively with organic traffic

---

## SEO Concerns

### 1. Staging/Dev Sites Publicly Indexed
- `stage.bassforecast.com` is visible to Google
- `develop.bassforecast.com` is visible to Google
- **Duplicate content risk** and security concern
- Should be behind auth or have noindex tags

### 2. Dated Outlook Posts May Cannibalize
- 100+ weekly outlook posts with similar titles and content structure
- Without proper canonical/archive strategy, older posts compete with newer ones
- Consider noindexing old outlooks or consolidating into evergreen regional pages

### 3. State Pages Are Thin
- Only ~15 exist
- Basic content — could be significantly expanded with lake data, seasonal guides, local tournaments

### 4. Flat URL Taxonomy
- Everything at root level makes it hard for search engines to understand content hierarchy
- No clear topical clusters in URL structure

---

## Competitor SEO Comparison

| Site | Lake Pages | Content Volume | SEO Strategy |
|------|-----------|---------------|--------------|
| **BassForecast** | 0 | ~400 pages | Blog + weekly outlooks |
| **Fishbrain** | Thousands | Massive | User-generated catch data per waterbody |
| **FishAngler** | Unknown | Moderate | Community + maps |
| **Wired2Fish** | 0 | Large blog | Editorial fishing content |
| **BassResource** | 0 | Large forum | Forum + guides |

Fishbrain has lake-specific pages powered by user catch data. BassForecast has the data (from the app) but doesn't expose it on the web.

---

## Newsletter

- Website offers a "weekly bass fishing report" email signup
- Regional coverage: AL, GA, FL, SC, NC, TN, MS, East TX, AR, LA, KY
- **500K subscribers claimed in discovery call — CANNOT verify publicly**
- Newsletter platform unknown (Klaviyo? Mailchimp? Beehiiv?)

---

## Traffic

**CANNOT verify publicly:**
- 600K-700K monthly website visitors (Landon's claim)
- 85% organic search traffic (Landon's claim)
- These are plausible given the content volume and niche but need GA4 access to confirm

**What IS verifiable:**
- The site has ~400+ indexed pages
- Regular content publishing (weekly outlooks since Oct 2024)
- Blog covers high-intent fishing keywords

---

## Opportunities Summary

1. **Lake pages at scale** — 10,000+ pages, zero exist today, highest SEO impact
2. **Fix staging/dev indexing** — duplicate content risk right now
3. **Expand state pages** — only 15 exist with thin content
4. **YouTube content** — 155K Instagram followers, YouTube is dead. Massive repurposing gap.
5. **Outlook archive strategy** — 100+ dated posts need canonical/noindex plan
6. **URL taxonomy** — restructure into topical clusters (/lakes/, /guides/, /outlooks/)

---

## Sources

- [bassforecast.com/sitemap.xml](https://bassforecast.com/sitemap.xml)
- [bassforecast.com/robots.txt](https://bassforecast.com/robots.txt)
- [bassforecast.com/blog](https://bassforecast.com/blog)
- [shop.bassforecast.com](https://shop.bassforecast.com/)
- [Wired2Fish Best Fishing Apps](https://www.wired2fish.com/bass-fishing/best-fishing-apps)
