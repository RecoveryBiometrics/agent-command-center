# Technical SEO Audit — bassforecast.com

> Date: 2026-04-03
> Scope: Public audit only — no internal access required
> Method: Crawled homepage, sitemap, robots.txt, sample articles, state pages, outlook posts

---

## PRIORITY 1 — CRITICAL (Fix Immediately)

### 1. Homepage Has NO H1 Tag
The homepage has zero H1 tags. Primary heading content is stuffed into H2 and H3 tags. The "hero" uses an H3 for "Download Bass Forecast now!" which is not an appropriate primary heading.

**Fix:** Add a single, keyword-rich H1 like "Bass Fishing Forecast — Catch More Bass with Real-Time Conditions"

### 2. Homepage Has NO Structured Data (JSON-LD)
Zero JSON-LD schema markup on the homepage. No Organization, SoftwareApplication, WebSite, or any other type. Other pages have some schema, but the most important page has none.

**Fix:** Add Organization schema, WebSite schema with SearchAction, and SoftwareApplication schema for the app.

### 3. Homepage Missing og:type and og:url Tags
Missing required Open Graph tags for proper social sharing on Facebook, LinkedIn, etc. All article pages also missing `og:type`.

**Fix:** Add `og:type` and `og:url` to all pages.

### 4. 65 Weekly Outlook Posts — Identical Meta Descriptions (Duplicate Content)
Every weekly outlook uses the EXACT same meta description: "Prepare for success with our 10 day bass fishing outlook..."

Same OG title on all 65: "BassForecast 10 Day Bass Fishing Outlook"

Old posts (Oct 2024+) are still fully indexed with `robots: index, follow` and no canonical to the latest. **65+ near-duplicate pages competing with each other.**

**Fix:**
- `noindex` on outlooks older than 30 days, OR canonical chain to latest
- Unique meta descriptions with date range
- OG titles should include the date

### 5. Sitemap Contains 30 Duplicate URLs
30 URLs appear more than once. Example: `lunker-club/stories/charlie-mitchell-charlie-mitchell-2023-09-22` listed twice. Wastes crawl budget.

**Fix:** Deduplicate in sitemap generator.

---

## PRIORITY 2 — HIGH IMPACT

### 6. Test/Staging Pages in Production Sitemap
`https://bassforecast.com/test-landing` and `https://bassforecast.com/test-page` are in the sitemap with `index, follow`.

**Fix:** Remove from sitemap, add `noindex`, or delete.

### 7. Sitemap URL Typos (Misspelled Months)
- `bass-fishing-10-day-outlook-octber-16-2025` (should be "october")
- `bass-fishing-10-day-outlook-septemeber-11-2025` (should be "september")

**Fix:** 301 redirects to correct URLs. Fix content creation workflow.

### 8. Same Generic OG Image on Every Page
Every page uses identical `bass-forecast-website-social-image-.png`. All social shares look the same. Filename has trailing hyphen (incomplete).

**Fix:** Generate unique OG images per article or per content category.

### 9. Only 1 State Page Exists (TX)
Only `bassforecast.com/tx-bass-fishing` exists. With 85% organic traffic, state pages for all 50 states capture high-intent "[state] bass fishing" searches.

The TX page meta description is truncated: "...where you can get your BEST catch. #1 place is. Learn more." — sentence cut off.

**Fix:** Build state pages for all 50 states. Fix TX meta description.

### 10. Wrong Schema Type on Evergreen Content
All pages use `NewsArticle` schema, including buyer guides, how-tos, and state guides. `NewsArticle` signals time-sensitive content — wrong for evergreen.

**Fix:** Map schema to content type: `Article` for guides, `HowTo` for instructional, `Product`/`Review` for gear reviews.

### 11. Missing Twitter Card Meta Tags (Site-Wide)
Zero pages have `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.

**Fix:** Add Twitter Card tags with `summary_large_image` card type.

---

## PRIORITY 3 — MEDIUM IMPACT

### 12. robots.txt Wide Open
No crawl restrictions at all. Admin panels, API endpoints, login pages — everything crawlable. For a Laravel app, `/admin`, `/api`, `/login`, `/register`, `/password` should be blocked.

**Fix:** Add disallow rules for internal paths.

### 13. Inconsistent Author Name in Schema
TX page: `"name": "BassForecast"` (one word). Other pages: `"name": "Bass Forecast"` (two words). Author `@type` is `Person` but author is an organization.

**Fix:** Standardize name. Change `@type` from `Person` to `Organization`.

### 14. Inline CSS Bloat (~10KB Font-Face Declarations)
~10,474 bytes of inline CSS for Roboto font including Cyrillic, Greek, Vietnamese, Math unicode ranges. Bass fishing site only needs Latin.

**Fix:** External stylesheet, remove unused unicode ranges.

### 15. Flat Sitemap (1,451 URLs in Single File)
Should use sitemap index with category-specific sitemaps for better crawl prioritization.

**Fix:** Split into `sitemap-pages.xml`, `sitemap-articles.xml`, `sitemap-outlooks.xml`, `sitemap-lunker-stories.xml`.

### 16. Lunker Club Duplicate Names in URLs
Every story URL doubles the name: `charlie-mitchell-charlie-mitchell-2023-09-22`. CMS bug.

**Fix:** Fix slug generation.

### 17. Homepage HTML is 137KB
3-4x larger than recommended. Bloated by inline font-face CSS.

### 18. 15 Script Tags on Homepage
Facebook Pixel, AppsFlyer, Cloudflare Analytics, Airship, GTM, GA, ShareThis, Cloudflare Turnstile. Several render-blocking.

**Fix:** Audit necessity. Consolidate tracking through GTM.

---

## PRIORITY 4 — GOOD NEWS

- **Staging subdomains NOT accessible** — stage.bassforecast.com and develop.bassforecast.com both refused connections. Good.
- **Canonical tags properly set** — all sampled pages have correct self-referencing canonicals. www redirects to non-www.
- **Mobile viewport tag present** — correctly configured.
- **Article pages have proper H1s** — all except homepage and one article (`tips-for-catching-bass` has 2 H1s).
- **Some articles missing JSON-LD** — inconsistent application, suggesting it was added at some point but not retroactively.

---

## TOP 5 ACTIONS BY REVENUE IMPACT

| # | Action | SEO Impact | Effort |
|---|--------|-----------|--------|
| 1 | Build state pages for all 50 states (only TX exists) | Very High | High |
| 2 | Fix weekly outlook duplicate content (noindex old or canonical) | High | Low |
| 3 | Add homepage H1 + structured data + OG tags | High | Low |
| 4 | Fix schema types (stop using NewsArticle for evergreen) | Medium | Medium |
| 5 | Clean sitemap (dedup, remove test pages, fix typos, split index) | Medium | Low |

---

## TALKING POINT FOR LANDON

> "Your site has strong fundamentals — good canonicals, mobile-friendly, decent meta tags on most pages. But the homepage is missing an H1 tag and has zero structured data, you have 65 duplicate outlook posts competing with each other in Google, and there's only 1 state page out of 50 built. With 85% organic traffic, every one of these fixes compounds directly into revenue. The low-hanging fruit (homepage H1, outlook noindex, sitemap cleanup) can be fixed in days. The state pages and lake pages are the bigger build that multiplies everything."
