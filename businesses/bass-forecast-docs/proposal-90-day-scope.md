# Bass Forecast — 90-Day Engagement Proposal

> Prepared by Bill Welch | April 2026
> For: Landon Bloomer, President, Bass Forecast

---

## THE SITUATION

Bass Forecast has 600-700K monthly visitors, 85% organic, 1.5M app users, and 500K newsletter subscribers. The traffic engine works. What's broken is what happens after people arrive.

**What we found without any internal access:**
- 35 affiliate product links sending users to dead pages (404s)
- 175 affiliate links with malformed tracking — clicks generating zero credit
- Only 1 state landing page (Texas) out of 50 — competitors rank for the other 49
- Zero individual lake pages — LakeMonster has 17,747, Fishbrain has thousands
- Homepage has no H1 tag, no structured data, 65 duplicate weekly outlook pages

**Full audit dashboard:** https://recoverybiometrics.github.io/bass-forecast/

The organic traffic is proven. The revenue is leaking. This proposal fixes the leaks and builds the foundation that turns Bass Forecast from a forecast app into the hub for every bass fishing lake in the country.

---

## THREE TRACKS — 90 DAYS

### TRACK 1: Fix the Leaks (Weeks 1-2)
*Immediate revenue recovery — no new systems needed*

**Affiliate Links**
- Fix all 35 broken product links (verified 404s)
- Fix all 175 malformed tracking parameters (?=BFOR → ?from=BFOR)
- Build automated link monitoring — scraper runs weekly, flags new 404s and broken redirects before they cost money
- Replace the $10/hr manual India process entirely
- Set up highest-commission routing where multiple affiliate options exist

**Technical SEO Quick Wins**
- Add H1 tag to homepage
- Add structured data (Organization, WebSite, SoftwareApplication schema)
- Noindex or canonical old weekly outlooks (65 duplicate pages)
- Remove test pages from sitemap
- Fix misspelled URLs (301 redirects)
- Fix schema types (NewsArticle → Article/HowTo on evergreen content)
- Add Twitter Card meta tags site-wide

**What Bill needs from Landon:**
- Staging environment access
- Developer name and direct contact
- Affiliate dashboard access (Tackle Warehouse, Avantlink, others)

---

### TRACK 2: Newsletter Personalization (Weeks 2-6)
*500K subscribers getting the same blast 2x/week — segment and automate*

**Segmentation**
Landon already collects zero-party data (new vs advanced, boat vs bank vs dock, region, skill level). The newsletter should use it:
- Beginner in Florida gets different content than a tournament angler in Texas
- Dock fisherman gets different bait recommendations than a boat fisherman
- Northern anglers get ice fishing and cold water content in winter, southern anglers get year-round bass content

**Automation**
- Move from manual 2x/week sends to automated flows
- Regional fishing reports triggered by Bass Forecast Rating data (Epic day alerts by region)
- Content repurposing pipeline — turn 300+ existing articles into segmented newsletter content
- New subscriber welcome sequences by cohort

**Revenue Unlock**
- Regional newsletter sponsorships ($10,000-25,000/month per the roadmap)
- Segmented audiences command higher sponsorship rates than a generic blast

**What Bill needs from Landon:**
- Newsletter platform access (Klaviyo? Mailchimp? Beehiiv?)
- Current subscriber data with any existing tags/segments
- Current open and click rates (baseline)

---

### TRACK 3: Lake Pages — The Ecosystem Foundation (Weeks 3-12)
*This is the big build. Every module below plugs into one lake page template.*

Each lake page starts as an SEO page and becomes a local ecosystem hub. One template, thousands of pages, modules added over time.

#### Phase 1: Template + Free Data (Weeks 3-6)
Build the lake page template and populate with data that's free and verified:

| Module | Data Source | Cost | Status |
|--------|-----------|------|--------|
| Bass Forecast Rating | Internal app data | Free | Needs Landon's access |
| Weather forecast | AccuWeather (existing) + NOAA API | Free | Ready |
| Lake level/elevation | USGS Water Services API | Free | ~30-40% of major reservoirs |
| Tournament history | Bassmaster REST API (no auth needed) | Free | Ready — clean JSON back to 2012 |
| Boat ramps | USACE open data + state agencies (FL, TX, TN) + OpenStreetMap | Free | Partial — state-by-state scraping |
| Nearby camping | Recreation.gov RIDB API | Free | Ready — federal lands |
| Nearby tackle/bait shops | Google Places API | ~$32/1K queries | Ready |
| Nearby lodging | Booking.com / Expedia affiliate APIs | Free (affiliate rev share) | Ready — needs signup |

**Target: First 100 lake pages live by week 6. 49 state pages live by week 5.**

#### Phase 2: Directories — Build & Scrape (Weeks 6-10)
These don't have clean APIs. We build scrapers, seed the directories, then open them for submissions.

| Directory | Seed Data From | Revenue Model |
|-----------|---------------|---------------|
| **Fishing guide directory** | Scrape FishingBooker, state licensing databases, Google Places | Free listing → featured $99-299/month |
| **Marina directory** | Scrape Marinas.com, USACE, ActiveCaptain (if accessible) | Free listing → featured $99-199/month |
| **Tackle shop directory** | Google Places + Yelp APIs, manual additions | Free listing → featured $99-299/month |
| **Bait shop directory** | Google Places, overlap with tackle shops | Free listing → premium features |
| **Tournament calendar** | Bassmaster API + TourneyX scraping + manual | Featured placement $99-299/month |

Each directory lives on the lake pages AND as its own searchable section. A guide listed on Lake Fork's page also appears in the national guide directory.

#### Phase 3: Marketplace Foundation (Weeks 10-12)
Turn directories into transactional platforms:

| Feature | Model |
|---------|-------|
| **Guide booking** | Built on GHL — 10% booking commission |
| **Lodge/cabin booking** | Affiliate deep links to VRBO/Booking.com — 3-6% commission |
| **Camping reservations** | Deep links to Recreation.gov / Hipcamp (Avantlink affiliate) |
| **Ice locator** | Built from scratch — crowdsourced + sponsored placement (YETI, Engel, marinas, gas stations) $49-199/month |
| **Live bait tracker** | Built from scratch — shops list inventory, anglers check availability. Premium features $99-299/month |

**The ice locator and live bait tracker have NO existing data source.** They'll need to be built as empty directories and populated through outreach, crowdsourcing, and Bass Forecast's 1.5M user base submitting data.

---

## WHAT BILL NEEDS FROM LANDON (Complete Access List)

| Access | Why | When |
|--------|-----|------|
| Staging environment | Never touch production | Week 1 |
| Developer name + direct contact | Coordinate technical work | Week 1 |
| GA4 + Google Search Console | Baseline metrics, keyword data | Week 1 |
| Affiliate dashboards (TW, Avantlink, etc.) | Fix links, track attribution | Week 1 |
| Newsletter platform | Segmentation + automation | Week 2 |
| App analytics | Understand user behavior by cohort | Week 2 |
| Current subscriber data with tags | Newsletter personalization | Week 2 |
| AccuWeather API scope/docs | Feed lake pages | Week 3 |
| BFR data access or API | Core lake page module | Week 3 |

---

## PRICING

| Item | Amount |
|------|--------|
| Monthly retainer | $7,500/month for 90 days |
| API costs | Billed at 3x actual, pre-funded by Landon |
| After 90 days | 15-20% revenue share on directly attributed assets |
| After 6-12 months | Equity conversation — 1-2% milestone-based vesting |
| Flat retainer alternative | $12,000-15,000/month if no performance deal |

**Infrastructure ownership:** Bill owns all infrastructure built. Landon licenses access. If the engagement ends, the systems stop.

**Scope changes:** Anything outside the 3 tracks above requires a change order, repriced per project.

---

## ATTRIBUTION & BASELINE

Before work begins:
- Baseline documentation of every measurable metric, signed by both parties
- All assets tagged with UTM parameters from day one
- Monthly ROI report showing directly attributed revenue
- Revenue share applies ONLY to assets Bill builds — no seasonality arguments

---

## 90-DAY MILESTONES

| Week | Deliverable |
|------|------------|
| 1-2 | All broken links fixed. Automated monitoring live. SEO quick wins shipped. |
| 3 | Newsletter segmentation live. First automated flows sending. |
| 4 | 49 state pages live. |
| 5-6 | First 100 lake pages live with weather, level, tournament history, nearby shops. |
| 7-8 | Guide directory seeded and live. Marina directory seeded and live. |
| 9-10 | Tackle shop directory live. Tournament calendar aggregation live. |
| 11-12 | Guide booking system (GHL). Lodging affiliate integration. Ice locator + live bait tracker launched (empty, ready for submissions). |

---

## THE PITCH IN ONE SENTENCE

Bass Forecast already has the traffic, the users, and the data — the lake pages turn all of that into a local ecosystem platform where every module is a new revenue line, and the directories become a marketplace.
