# VERIFIED Missing Pages — bassforecast.com

> Date: 2026-04-03
> Method: Every URL fetched live. HTTP status recorded. Sitemap analyzed. Google index checked.
> Reproducible: Anyone can verify with `curl -s -o /dev/null -w "%{http_code}" [URL]`

---

## STATE PAGES — Only Texas Exists

Every state tested using the `/{xx}-bass-fishing` pattern. Full state names also tested. Alternate patterns also tested.

### All 50 States — HTTP Status

| State | URL | Status |
|-------|-----|--------|
| Alabama | /al-bass-fishing | 404 |
| Alaska | /ak-bass-fishing | 404 |
| Arizona | /az-bass-fishing | 404 |
| Arkansas | /ar-bass-fishing | 404 |
| California | /ca-bass-fishing | 404 |
| Colorado | /co-bass-fishing | 404 |
| Connecticut | /ct-bass-fishing | 404 |
| Delaware | /de-bass-fishing | 404 |
| Florida | /fl-bass-fishing | 404 |
| Georgia | /ga-bass-fishing | 404 |
| Hawaii | /hi-bass-fishing | 404 |
| Idaho | /id-bass-fishing | 404 |
| Illinois | /il-bass-fishing | 404 |
| Indiana | /in-bass-fishing | 404 |
| Iowa | /ia-bass-fishing | 404 |
| Kansas | /ks-bass-fishing | 404 |
| Kentucky | /ky-bass-fishing | 404 |
| Louisiana | /la-bass-fishing | 404 |
| Maine | /me-bass-fishing | 404 |
| Maryland | /md-bass-fishing | 404 |
| Massachusetts | /ma-bass-fishing | 404 |
| Michigan | /mi-bass-fishing | 404 |
| Minnesota | /mn-bass-fishing | 404 |
| Mississippi | /ms-bass-fishing | 404 |
| Missouri | /mo-bass-fishing | 404 |
| Montana | /mt-bass-fishing | 404 |
| Nebraska | /ne-bass-fishing | 404 |
| Nevada | /nv-bass-fishing | 404 |
| New Hampshire | /nh-bass-fishing | 404 |
| New Jersey | /nj-bass-fishing | 404 |
| New Mexico | /nm-bass-fishing | 404 |
| New York | /ny-bass-fishing | 404 |
| North Carolina | /nc-bass-fishing | 404 |
| North Dakota | /nd-bass-fishing | 404 |
| Ohio | /oh-bass-fishing | 404 |
| Oklahoma | /ok-bass-fishing | 404 |
| Oregon | /or-bass-fishing | 404 |
| Pennsylvania | /pa-bass-fishing | 404 |
| Rhode Island | /ri-bass-fishing | 404 |
| South Carolina | /sc-bass-fishing | 404 |
| South Dakota | /sd-bass-fishing | 404 |
| Tennessee | /tn-bass-fishing | 404 |
| **Texas** | **/tx-bass-fishing** | **200** |
| Utah | /ut-bass-fishing | 404 |
| Vermont | /vt-bass-fishing | 404 |
| Virginia | /va-bass-fishing | 404 |
| Washington | /wa-bass-fishing | 404 |
| West Virginia | /wv-bass-fishing | 404 |
| Wisconsin | /wi-bass-fishing | 404 |
| Wyoming | /wy-bass-fishing | 404 |

### Full State Name Pattern — Also 404

| URL | Status |
|-----|--------|
| /florida-bass-fishing | 404 |
| /california-bass-fishing | 404 |
| /georgia-bass-fishing | 404 |
| /michigan-bass-fishing | 404 |
| /alabama-bass-fishing | 404 |

### Alternate Patterns — Also 404

| URL | Status |
|-----|--------|
| /state/texas | 404 |
| /states | 404 |
| /bass-fishing/tx | 404 |
| /bass-fishing/florida | 404 |
| /florida | 404 |
| /texas | 404 |

### Sitemap Confirmation
Only one URL in the entire sitemap matches the state page pattern: `https://bassforecast.com/tx-bass-fishing`

**Result: 1 out of 50 states. Texas only.**

---

## LAKE PAGES — Zero Exist

### Sitemap Search
Searched the full sitemap (470+ URLs) for: fork, guntersville, okeechobee, rayburn, travis, falcon, toledo, table-rock, kentucky-lake, chickamauga, lake/, lakes/, waters/, fishery/, location/, forecast/, spots/, reservoir.

**Result: ZERO matches.**

### Direct URL Pattern Testing — All 404

| URL | Status |
|-----|--------|
| /lake/lake-fork | 404 |
| /lakes/lake-fork | 404 |
| /lake-fork | 404 |
| /lake-fork-texas | 404 |
| /waters/lake-fork | 404 |
| /fishery/lake-fork | 404 |
| /location/lake-fork | 404 |
| /forecast/lake-fork | 404 |
| /spots/lake-fork | 404 |
| /lake/guntersville | 404 |
| /lakes/guntersville | 404 |
| /lake/okeechobee | 404 |
| /lake/table-rock | 404 |
| /lake/kentucky-lake | 404 |
| /lake/chickamauga | 404 |
| /tx-bass-fishing/lake-fork | 404 |
| /texas/lake-fork | 404 |
| /state/texas/lake-fork | 404 |

### Google Index Search

| Query | Result |
|-------|--------|
| site:bassforecast.com inurl:lake | 0 results |
| site:bassforecast.com inurl:forecast (in URL path) | 0 results |
| site:bassforecast.com inurl:waters | 0 results |
| site:bassforecast.com inurl:fishery | 0 results |
| site:bassforecast.com inurl:reservoir | 0 results |
| site:bassforecast.com "lake fork" | 3 results — all blog articles, no lake page |
| site:bassforecast.com "guntersville" | 10 results — all blog articles, no lake page |
| site:bassforecast.com "okeechobee" | 7 results — all blog articles, no lake page |

### Blog Article Verification
- `/best-bass-fishing-lakes-in-the-us` — Blog article. Lists lakes inline. Does NOT link to individual lake pages.
- `/top-5-texas-lakes-bass-fishing` — Blog article. Lake names link to external Google Maps, not internal pages.
- `/tx-bass-fishing` — State page. Mentions 9 Texas lakes. None are hyperlinked at all.

### Subdomain Check

| Subdomain | Status |
|-----------|--------|
| lakes.bassforecast.com | Connection refused |
| forecast.bassforecast.com | Connection refused |
| app.bassforecast.com | Connection refused |
| pro.bassforecast.com | Connection refused |
| shop.bassforecast.com | 200 (Shopify merch store — no lake content) |

**Result: Zero lake pages exist on bassforecast.com under any URL pattern, naming convention, or subdomain.**

---

## STATE-SPECIFIC CONTENT THAT DOES EXIST (Blog Posts, Not Landing Pages)

The sitemap contains blog articles about state fishing records. These are NOT state landing pages — they're individual blog posts:

- /bass-fishing-records-in-alabama
- /bass-fishing-records-in-arkansas
- /bass-fishing-records-in-florida
- /bass-fishing-records-in-illinois
- /bass-fishing-records-in-iowa
- /bass-fishing-records-in-kansas
- /bass-fishing-records-in-michigan
- /bass-fishing-records-in-mississippi
- /bass-fishing-records-in-new-york
- /bass-fishing-records-in-virginia
- /california-bass-fishing-records
- /georgia-bass-fishing-records
- /texas-bass-fishing-records
- /top-5-florida-lakes-bass-fishing
- /top-5-texas-lakes-bass-fishing

---

## WHAT THIS MEANS

- **470 total pages** on bassforecast.com today
- **1 state landing page** (Texas)
- **0 lake pages** (verified across 18 URL patterns, 6 Google searches, full sitemap, and 5 subdomains)
- **LakeMonster.com has 17,747 lake pages** for comparison
- With 85% organic traffic already working, adding 49 state pages and 10,000 lake pages is a massive multiplier on a proven organic engine
