# Full Crawl Broken Link Audit — All 226 Articles

> Date: 2026-04-03
> Scope: ALL 226 article pages on bassforecast.com crawled
> Links checked: ~2,262 outbound links
> Google Sheet: https://docs.google.com/spreadsheets/d/1PuPUmhFqhPKVTCvIZJWFQgWZe0bPn6njROk54nOt1wE/edit

---

## HEADLINE NUMBERS

| Metric | Count |
|--------|-------|
| Articles crawled | 226 / 226 (100%) |
| Outbound links checked | ~2,262 |
| Unique broken product/affiliate links | 41 |
| Sitewide broken link (app download CTA) | 1 (appears on ALL 226 pages) |
| Malformed tracking params (?=BFOR) | 175 instances across 20+ articles |
| Shimano Fish Shop links dead | 6 |
| Dead external domains | 2 (fishnatics.com, bit.ly/3S1MBbh) |
| Internal typo link | 1 (missing .com) |

---

## CRITICAL: APP DOWNLOAD LINK DEAD SITEWIDE

`https://bassforecast.onelink.me/5aRm/96pkic2d` returns **404 on all 226 articles**.

This is the OneLink/AppsFlyer deep link for the app download CTA. The single most important conversion action on every article page — "Download the App" — goes to a dead page. This is likely the highest-impact single fix on the entire site.

---

## BROKEN TACKLE WAREHOUSE LINKS (30 unique 404s)

### best-baitcasting-reels-for-bass-fishing (3 broken)
- Abu Garcia Max X → descpage-AGMXX.html → 404
- Abu Garcia Max 4 → descpage-AGM4.html → 404
- KastKing iReel 2 → descpage-KZSIRT.html → 404

### best-landing-nets-for-bass-fishing (1 broken)
- Frabill Trophy Haul Bearclaw → descpage-FBC.html → 404

### bass-fishing-in-the-fall (1 broken)
- Lew's category page → catpage-LEWUPPLP.html → 404

### how-to-bank-fish-for-bass (1 broken)
- Aftco Urban Backpack → descpage-AUB.html → 404

### how-to-choose-a-fish-finder (1 broken)
- Humminbird Helix 15 CHIRP G4 → descpage-HHG415.html → 404

### jigs-for-bass (1 broken)
- Lunkerhunt Mushroom Head Jig → descpage-LWMH.html → 404

### september-bass-fishing-guide-us-regions (2 broken)
- Z-Man CrossEyeZ Finesse Craw → descpage-ZMDWCP.html → 404
- Huk Tournament Jacket → descpage-HSJ.html → 404

### top-5-texas-lakes-bass-fishing (19 broken — WORST PAGE)
- Texas-Rigged Worm → descpage-ZOOMW.html → 404
- Buzzbait → descpage-BYBB.html → 404
- Crankbait → descpage-RDTS.html → 404
- Jerkbait → descpage-MV110.html → 404
- Swimbait → descpage-BPM.html → 404
- Deep Jig → descpage-SKSJ.html → 404
- Drop Shot → descpage-RSTW.html → 404
- Spinnerbait → descpage-WES.html → 404
- Flippin' Jig → descpage-ZMCEFJ.html → 404
- Carolina Rig → descpage-ZL.html → 404
- Chatterbait → descpage-ZMCEE.html → 404
- Football Jig → descpage-SKTGFJ.html → 404
- Daiwa Fuego LT 2500 → descpage-DFLT.html → 404
- Daiwa Tatula 100 → descpage-DT100.html → 404
- Lew's Mach 2 Combo → descpage-LM2SC.html → 404
- Shimano Sahara 2500 → descpage-SSFJ.html → 404
- Huk Icon X Hoodie → descpage-HIXH.html → 404
- AFTCO Reaper Jacket → descpage-ARSSJ.html → 404
- Pro Series Tackle Bag → descpage-TWPTB.html → 404

---

## BROKEN SHIMANO FISH SHOP LINKS (6 — store appears dead)

All on 10-day outlook articles:
- swagy-dw → 404
- yammy-fish → 404 (x2)
- tn-disk-knocker → 404
- world-diver → 404
- macbeth-shallow → 404

---

## BROKEN GRUNDENS LINKS (3)

On cold-weather-buyers-guide:
- Buoy X Gore-Tex Anorak → Avantlink redirect → grundens.com 404
- Grundies Mid Bottom (x2) → grundens.com 404 (direct link, NO affiliate tracking)

---

## OTHER BROKEN LINKS

- fishnatics.com → DNS failure (domain dead) — on how-to-fish-for-bass
- bit.ly/3S1MBbh → 404 — on shimano-heatmap + 10-day outlooks
- bassforecast/premium-features → DNS failure (missing .com) — on bass-fishing-patterns
- bassforecast.grayloon.com/lunker-club → SSL error (old staging domain) — on 2 articles

---

## MALFORMED TRACKING PARAMETERS (175 instances)

All use `?=BFOR` instead of `?from=BFOR` on Tackle Warehouse links. Worst offenders:

| Article | Malformed Links |
|---------|----------------|
| best-topwater-lures-bass-fishing-guide | 39 (every TW link on page) |
| top-5-texas-lakes-bass-fishing | 37 |
| september-bass-fishing-guide-us-regions | 21 |
| top-5-florida-lakes-bass-fishing | 18 |
| best-baitcasting-reels-for-bass-fishing | 11 |
| jigs-for-bass | 10 |
| spring-bass-fishing | 6 |
| umbrella-rig-bass-fishing | 6 |
| cold-weather-buyers-guide | 6 (one has Google Ads gclid pasted in) |
| how-to-bank-fish-for-bass | 3 |
| river-bass-fishing | 3 |
| crankbait-bass-fishing | 2 |
| bass-lures-trends | 2 |
| how-to-fish-cover-oriented-bass | 2 |
| Others (7 articles) | 1 each |

Notable errors:
- `?=BFOR?=BFOR` — double malformed param on september guide
- `?gQT=1?=BFOR` — double question mark on how-to-bank-fish
- `?color=RCB?=BFOR` — double question mark on september guide
- One link has a Google Ads gclid pasted in instead of BFOR tracking
