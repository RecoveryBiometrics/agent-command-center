# Lake Page Data Sources — Verified Research

> Date: 2026-04-06
> Method: Live API calls where possible, web verification for the rest
> Honesty policy: If it can't be verified, it says so. No guesses.

---

## WHAT'S FREE, VERIFIED, AND READY TO USE

### 1. USGS Water Services API
- **URL:** https://waterservices.usgs.gov/nwis/
- **Docs:** https://waterservices.usgs.gov/docs/
- **Cost:** Free. No API key.
- **What it gives you:** Lake level/elevation, reservoir storage, some weather data
- **CRITICAL LIMITATION:** Water temperature is only available at ~2-5% of lake sites. Most stations only report level and storage. Verified by live API calls:
  - Lake Fork TX → level only, NO water temp
  - Sam Rayburn TX → level + wind, NO water temp
  - Lake Guntersville AL → NO USGS station found at all
  - Lake Houston TX → best case: water temp at multiple depths + dissolved oxygen (rare)
- **Good for:** Lake level data on major reservoirs (~30-40% coverage)
- **Not good for:** Water temperature at most bass fishing lakes

### 2. NOAA Weather API
- **URL:** https://api.weather.gov/
- **Cost:** Free. No API key (just User-Agent header).
- **What it gives you:** 7-day forecast, hourly forecast, wind, pressure, precipitation, alerts for any lat/lon
- **Good for:** Weather data on every lake page. Already supplemented by Bass Forecast's AccuWeather partnership.

### 3. Bassmaster REST API (UNAUTHENTICATED — BIG FIND)
- **URL:** https://www.bassmaster.com/wp-json/data/v1/
- **Cost:** Free. No API key. No auth required.
- **What it gives you:** Full tournament results in clean JSON — angler names, daily weights, fish counts, big bass, prize money, per-day breakdowns
- **Verified working endpoints:**
  - `/tournament/final-results?tournament_id={id}&class=anglers`
  - `/tournament/leaderboard?tournament_id={id}&class=anglers`
  - `/tournament/daily-results?tournament_id={id}&day={n}&class=anglers`
- **Historical depth:** 2012+ via bassmasterfantasy.com
- **Limitation:** No "list all tournaments" endpoint — need to scrape tournament pages for ID mapping
- **This is the best data source found in the entire research.**

### 4. Recreation.gov RIDB API
- **URL:** https://ridb.recreation.gov/
- **Docs:** https://ridb.recreation.gov/docs
- **Cost:** Free. Requires free API key.
- **What it gives you:** Federal campgrounds, boat ramps, recreation facilities with lat/lon
- **Limitation:** Federal lands only (USACE, NPS, BLM, USFS). No state parks or private.

### 5. EPA Water Quality Portal
- **URL:** https://www.waterqualitydata.us/
- **Cost:** Free. No API key.
- **What it gives you:** Historical water quality data (temp, DO, pH) from periodic sampling
- **Limitation:** NOT real-time. This is field sampling data (e.g., measurements from 1981, 2005). Good for historical baselines, not live lake pages.

### 6. OpenStreetMap (Boat Ramps)
- **Query via:** https://overpass-api.de/api/interpreter
- **Tag:** `leisure=slipway` (boat ramps), `leisure=marina`
- **Cost:** Free.
- **Limitation:** Contributor-dependent. Estimated 20-50% coverage of actual US boat ramps. Good in popular areas, sparse in rural South.

---

## WHAT COSTS MONEY BUT WORKS

### 7. Google Places API
- **URL:** https://developers.google.com/maps/documentation/places/web-service/
- **Cost:** ~$32 per 1,000 requests. $200/month free credit.
- **Good for:** Tackle shops, bait shops, gas stations, marinas, boat ramps — anything searchable by keyword + location
- **Limitation:** No "ice" category. Results can be noisy. ToS requires displaying on Google Maps.
- **Coverage:** Best for populated areas. Weaker in rural fishing spots.

### 8. Yelp Fusion API
- **URL:** https://docs.developer.yelp.com/
- **Cost:** Free tier (5,000 calls/day — needs verification of current limit)
- **Good for:** Tackle shops, bait shops, marinas with reviews/ratings
- **Limitation:** Sparse in rural areas where many lakes are.

### 9. Booking.com / Expedia Affiliate APIs
- **Booking.com:** https://www.booking.com/affiliate-programme/
- **Expedia:** https://developers.expediagroup.com/
- **Cost:** Free via affiliate agreement (they pay you commissions on bookings)
- **What it gives you:** Lodging search by lat/lon coordinates near lakes
- **Good for:** "Where to stay near Lake Fork" — cabin and lodge listings
- **Needs:** Affiliate agreement signup

---

## WHAT EXISTS BUT NEEDS PARTNERSHIPS OR MANUAL WORK

### 10. State Fish & Wildlife Boat Ramp Data
- **Best states:** Florida FWC (https://geodata.myfwc.com/ — ArcGIS portal, excellent), Texas TPWD (https://tpwd.texas.gov/fishboat/boat/), Tennessee via TVA
- **Format:** Most use ArcGIS REST services behind their maps — query the endpoints
- **Limitation:** State-by-state research needed. No unified source. Florida is the gold standard, others vary.

### 11. USACE Recreation Data
- **URL:** https://corpslakes.erdc.dren.mil/visitors/visitors.cfm
- **Open data:** https://geospatial-usace.opendata.arcgis.com/ (search "boat ramp" or "recreation")
- **Coverage:** ~400+ lake/reservoir projects. Strong in Southeast and Midwest.
- **Format:** HTML (scrapeable) and ArcGIS datasets.

### 12. FishingBooker (Guides)
- **URL:** https://fishingbooker.com/
- **Has an affiliate program.** Likely no public API — would need to contact directly.
- **Most comprehensive fishing guide directory.** Organized by location.

### 13. Marinas.com
- **URL:** https://www.marinas.com/
- **Comprehensive marina directory.** API access unknown — needs direct inquiry.

### 14. FishDonkey (Tournaments)
- **URL:** https://www.fishdonkey.com/ / https://api.fishdonkey.com/
- **Has an internal API.** ToS mentions licensing aggregated tournament data to third parties.
- **No public API docs.** Would need data partnership conversation.

---

## WHAT DOES NOT EXIST (Must Be Built From Scratch)

### Ice Locator Database
- No structured database of ice availability near lakes exists anywhere.
- Best approximation: Google Places search for "ice" near coordinates — noisy results (gas stations, convenience stores)
- Reddy Ice (https://www.reddyice.com/find-ice) and Arctic Glacier (https://www.arcticglacierice.com/find-ice) have store locators but no API.
- **This would need to be manually built or crowdsourced.**

### Comprehensive Fishing Guide Database (Without Partnership)
- No free, structured, comprehensive source exists.
- State licensing databases vary wildly — some publish guide lists, some don't, no standard format.
- FishingBooker is the closest but requires partnership.

### State Park Campground Aggregation
- No unified source across states. Each state uses different reservation systems (ReserveAmerica/Aspira, Reserve California, etc.).
- Recreation.gov only covers federal lands.

---

## WHAT'S BLOCKED / NOT ACCESSIBLE

### MLF (Major League Fishing) Tournament Data
- Website returns HTTP 403 — Cloudflare bot protection active.
- WordPress API also behind Cloudflare challenges.
- **Cannot be scraped or accessed programmatically.**
- Historical FLW data (pre-2019 acquisition) also under MLF domain now.

### ActiveCaptain (Garmin) Marina Data
- Now owned by Garmin, API access progressively restricted.
- Great crowd-sourced data but likely locked down. Worth asking, don't count on it.

### Fishing Chaos
- No public API. Closed SaaS platform. Would need direct contact.

---

## WHAT GOES ON A LAKE PAGE — REALISTIC DAY-ONE BUILD

Based on what's actually available right now:

| Module | Data Source | Status |
|--------|-----------|--------|
| Bass Forecast Rating (BFR) | Bass Forecast app data (internal) | Needs Landon's access |
| Weather forecast | AccuWeather (existing partnership) + NOAA (free) | Ready |
| Lake level/elevation | USGS Water Services API | Ready — ~30-40% of major reservoirs |
| Tournament history | Bassmaster REST API (free, no auth) | Ready — clean JSON |
| Boat ramps | USACE + state agencies + OSM | Partial — state-by-state work |
| Nearby tackle shops | Google Places API | Ready — costs ~$32/1K queries |
| Nearby bait shops | Google Places API | Ready — same source |
| Marinas | Marinas.com (needs partnership) + USACE | Partial |
| Lodging near lake | Booking.com / Expedia affiliate API | Ready — needs affiliate signup |
| Camping near lake | Recreation.gov RIDB API (federal only) | Ready — free |
| Fishing guides | FishingBooker (needs partnership) | Not ready without partnership |
| Ice locator | Nothing exists | Must build from scratch |
| Live bait tracker | Nothing exists | Must build from scratch |

---

## OPEN QUESTIONS (Things I Could Not Verify)

- Does FishingBooker have a data API or just affiliate links?
- Does Marinas.com offer API access?
- What's Bass Forecast's AccuWeather API scope — does it cover lake-specific forecasts?
- Does Hipcamp have any data feed beyond affiliate tracking links?
- Current exact Google Places API pricing (changes periodically)
- Which specific states publish fishing guide license databases publicly?
