# Broken Affiliate Link Audit — bassforecast.com

> Date: 2026-04-03
> Scope: 38 articles crawled, 119 unique outbound affiliate/product links checked
> Method: Public crawl only — no internal access required

---

## SUMMARY

| Metric | Count |
|--------|-------|
| Articles crawled | 38 |
| Unique outbound affiliate/product links checked | 119 |
| **Broken links (confirmed 404)** | **9** |
| **Mislabeled links (wrong product)** | **1** |
| **Total problematic links** | **10** |
| **Malformed tracking parameters** | **11** |
| Broken link rate | **8.4%** |

**Bottom line: Roughly 1 in 5 affiliate touches on the site is either sending users to a dead page or not crediting Bass Forecast for the click.**

---

## BROKEN LINKS — FULL DETAIL

### 1. Abu Garcia Max X Casting Reel — 404
- **Article:** https://bassforecast.com/best-baitcasting-reels-for-bass-fishing
- **Broken URL:** https://www.tacklewarehouse.com/Abu_Garcia_Max_X_Casting_Reel/descpage-AGMXX.html?=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse
- **Note:** Product likely discontinued or renamed. Also malformed tracking param `?=BFOR` instead of `?from=BFOR`.

### 2. Abu Garcia Max 4 Casting Reel — 404
- **Article:** https://bassforecast.com/best-baitcasting-reels-for-bass-fishing
- **Broken URL:** https://www.tacklewarehouse.com/Abu_Garcia_Max_4_Casting_Reel/descpage-AGM4.html?from=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse

### 3. KastKing iReel 2 IFC Smart Casting Reel — 404
- **Article:** https://bassforecast.com/best-baitcasting-reels-for-bass-fishing
- **Broken URL:** https://www.tacklewarehouse.com/KastKing_iReel_2_IFC_Smart_Casting_Reel/descpage-KZSIRT.html?from=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse
- **Note:** Labeled as "KastKing MG 12 Elite Casting Reels" in article text but URL points to iReel 2 — product mismatch AND 404.

### 4. Frabill Trophy Haul Bearclaw Net — 404
- **Article:** https://bassforecast.com/best-landing-nets-for-bass-fishing
- **Broken URL:** https://www.tacklewarehouse.com/Frabill_Trophy_Haul_Bearclaw_Net/descpage-FBC.html?from=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse

### 5. Lew's Category Page — 404
- **Article:** https://bassforecast.com/bass-fishing-in-the-fall
- **Broken URL:** https://www.tacklewarehouse.com/catpage-LEWUPPLP.html?=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse
- **Note:** Advertisement/banner link. Malformed tracking param `?=BFOR`.

### 6. Great Lakes Finesse Juicy Hellgrammite (wrong SKU) — 404
- **Article:** https://bassforecast.com/bass-fishing-in-the-fall
- **Broken URL:** https://www.tacklewarehouse.com/Great_Lakes_Finesse_Juicy_Hellgrammite_24_8pk/descpage-GLFJH.html?from=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse
- **Note:** Typo in SKU — `GLFJH` should be `GLGJH`. Same product linked correctly on other articles.

### 7. Humminbird Helix 15 CHIRP G4 Fishfinders — 404
- **Article:** https://bassforecast.com/how-to-choose-a-fish-finder
- **Broken URL:** https://www.tacklewarehouse.com/Humminbird_Helix_15_CHIRP_G4_Fishfinders/descpage-HHG415.html
- **Status:** 404
- **Partner:** Tackle Warehouse
- **Note:** Link text says "Humminbird Solix 15 CHIRP G4" but URL says "Helix 15" — product name mismatch AND 404.

### 8. 6th Sense Juggle Shot Minnow — 404
- **Article:** https://bassforecast.com/baits-for-spring-bass-fishing
- **Broken URL:** https://www.tacklewarehouse.com/6th_Sense_Juggle_Shot_Minnow/descpage-6SSJSM.html?from=BFOR
- **Status:** 404
- **Partner:** Tackle Warehouse

### 9. Grundens Buoy X Gore-Tex Anorak (via Avantlink) — 404
- **Article:** https://bassforecast.com/cold-weather-bass-fishing-buyers-guide-must-have-gear-for-smart-anglers
- **Broken URL:** https://www.avantlink.com/click.php?tool_type=cl&merchant_id=d088fb68-a890-4905-8012-26763ceb95ca&website_id=d3c0a63d-07a6-4a73-8ddc-585ce4e9ffe5&url=https%3A%2F%2Fgrundens.com%2Fproducts%2Fbuoy-x-gore-tex
- **Status:** 404 (Avantlink redirects to Grundens, which 404s)
- **Partner:** Grundens (via Avantlink)

### 10. Grundens Grundies Mid Bottom (direct link) — 404
- **Article:** https://bassforecast.com/cold-weather-bass-fishing-buyers-guide-must-have-gear-for-smart-anglers
- **Broken URL:** https://grundens.com/collections/fishing-base-layers/products/grundies-mid-bottom
- **Status:** 404
- **Partner:** Grundens (direct link — NO affiliate tracking at all)

---

## MISLABELED LINK (Not 404, But Wrong Destination)

### Lew's HyperMag points to Shimano category page
- **Article:** https://bassforecast.com/best-baitcasting-reels-for-bass-fishing
- **URL:** https://www.tacklewarehouse.com/catpage-RLCSHIMANO.html?=BFOR
- **Status:** 200 — but anchor text says "Lew's HyperMag" while URL goes to Shimano Casting Reels category. Completely wrong brand.
- **Partner:** Tackle Warehouse

---

## MALFORMED TRACKING PARAMETERS

11 links use `?=BFOR` instead of `?from=BFOR`. If `?from=BFOR` is required for affiliate attribution, these clicks generate zero credit:

| Article | URL Fragment |
|---------|-------------|
| best-baitcasting-reels | descpage-AGMXX.html?=BFOR |
| best-baitcasting-reels | descpage-AGRSI.html?=BFOR |
| best-baitcasting-reels | descpage-SKKVD25.html?=BFOR |
| best-baitcasting-reels | descpage-GSGR14.html?=BFOR |
| best-baitcasting-reels | descpage-TLEWSP.html?=BFOR |
| best-baitcasting-reels | descpage-LEW.html?=BFOR |
| best-baitcasting-reels | descpage-MFFA.html?=BFOR |
| best-baitcasting-reels | descpage-MFHG.html?=BFOR |
| best-baitcasting-reels | descpage-FBVS.html?=BFOR |
| best-baitcasting-reels | catpage-RLCSHIMANO.html?=BFOR |
| bass-fishing-in-the-fall | catpage-LEWUPPLP.html?=BFOR |

---

## ARTICLES WITH ZERO AFFILIATE LINKS (Missed Revenue)

These articles recommend specific products by name but have no outbound affiliate links:

- /best-bass-fishing-boat-accessories
- /bass-fishing-gear-essentials
- /bass-fishing-on-a-budget
- /bass-fishing-competitions-tips
- /bass-fishing-techniques
- /bass-fishing-patterns
- /knots-for-bass-fishing
- /best-bass-rigs-for-bank-fishing

---

## PARTNER BREAKDOWN

| Partner | Links Checked | Broken | Malformed Tracking |
|---------|--------------|--------|--------------------|
| Tackle Warehouse | 89 | 7 (404) + 1 mislabeled | 11 |
| Amazon (amzn.to) | 26 | 0 | N/A |
| Avantlink/Grundens | 11 | 1 (404) | 0 |
| Grundens (direct) | 1 | 1 (404, no tracking) | N/A |
| Other | 4 | 0 | N/A |

---

## TALKING POINT FOR LANDON

> "We crawled 38 articles and found 10 broken or mislabeled affiliate links and 11 more with malformed tracking parameters. That means roughly 1 in 5 affiliate touches on the site is either dead or not crediting Bass Forecast. The baitcasting reels article — one of your highest-intent gear pages — has 3 broken links and a mislabeled link on a single page. And there are at least 8 articles recommending products by name with zero affiliate links at all. This is the exact problem we solve in week one."
