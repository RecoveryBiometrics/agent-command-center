# VERIFIED Broken Affiliate Links — bassforecast.com

> Date: 2026-04-03
> Method: Each article fetched live (HTTP 200). Each outbound link fetched and status recorded.
> Reproducible: Anyone can verify with `curl -s -o /dev/null -w "%{http_code}" [URL]`

---

## VERIFIED BROKEN LINKS (404 Confirmed)

### 1. Abu Garcia Max X Casting Reel — 404
- **Article:** https://bassforecast.com/best-baitcasting-reels-for-bass-fishing
- **Exact HTML found:**
  ```html
  <a href="https://www.tacklewarehouse.com/Abu_Garcia_Max_X_Casting_Reel/descpage-AGMXX.html?=BFOR"><strong><u>The Abu Garcia Max X</u></strong></a>
  ```
- **HTTP Status:** 404 — "404 File Not Found - Tackle Warehouse"
- **Partner:** Tackle Warehouse
- **Additional issue:** Uses `?=BFOR` (malformed — missing `from` parameter name)

### 2. Abu Garcia Max 4 Casting Reel — 404
- **Article:** https://bassforecast.com/best-baitcasting-reels-for-bass-fishing
- **Exact HTML found:**
  ```html
  <a href="https://www.tacklewarehouse.com/Abu_Garcia_Max_4_Casting_Reel/descpage-AGM4.html?from=BFOR"><strong><u>the Max 4</u></strong></a>
  ```
- **HTTP Status:** 404 — "404 File Not Found - Tackle Warehouse"
- **Partner:** Tackle Warehouse

### 3. Frabill Trophy Haul Bearclaw Net — 404
- **Article:** https://bassforecast.com/best-landing-nets-for-bass-fishing
- **Exact HTML found:**
  ```html
  <a href="https://www.tacklewarehouse.com/Frabill_Trophy_Haul_Bearclaw_Net/descpage-FBC.html?from=BFOR"><u>the Frabill Trophy Haul Bearclaw</u></a>
  ```
- **HTTP Status:** 404 — "404 File Not Found - Tackle Warehouse"
- **Partner:** Tackle Warehouse

### 4. Grundens Buoy X Gore-Tex Anorak — 404 (via Avantlink redirect)
- **Article:** https://bassforecast.com/cold-weather-bass-fishing-buyers-guide-must-have-gear-for-smart-anglers
- **Exact HTML found:**
  ```html
  <a target="_blank" href="https://www.avantlink.com/click.php?tool_type=cl&merchant_id=d088fb68-a890-4905-8012-26763ceb95ca&website_id=d3c0a63d-07a6-4a73-8ddc-585ce4e9ffe5&url=https%3A%2F%2Fgrundens.com%2Fproducts%2Fbuoy-x-gore-tex%25C2%25AE-anorak%3F_pos%3D1%26_sid%3D3207567ed%26_ss%3Dr%26variant%3D43649698398457"><u>Grundens Buoy X Gore-Tex Anorak</u></a>
  ```
- **Redirect chain:** Avantlink 302 → grundens.com/products/buoy-x-gore-tex-r-anorak
- **Final HTTP Status:** 404 — product page no longer exists on Grundens
- **Partner:** Grundens via Avantlink

---

## VERIFIED MALFORMED TRACKING PARAMETERS

On the same baitcasting reels article, 4 links use `?=BFOR` (no parameter name) while 6 links correctly use `?from=BFOR`:

**Malformed (likely zero affiliate credit):**
```
tacklewarehouse.com/Abu_Garcia_Max_X_Casting_Reel/descpage-AGMXX.html?=BFOR
tacklewarehouse.com/Abu_Garcia_Revo_SX_LP_Casting_Reels/descpage-AGRSI.html?=BFOR
tacklewarehouse.com/Lews_HyperMag_Casting_Reel/descpage-LMAG.html?=BFOR
tacklewarehouse.com?=BFOR
```

**Correct (on the same page):**
```
tacklewarehouse.com/catpage-RLCSHIMANO.html?from=BFOR
tacklewarehouse.com/Abu_Garcia_Max_4_Casting_Reel/descpage-AGM4.html?from=BFOR
tacklewarehouse.com/Daiwa_Steez_A_100_Casting_Reel/descpage-DSA1.html?from=BFOR
tacklewarehouse.com/Daiwa_CA_80_Casting_Reel/descpage-CA8.html?from=BFOR
tacklewarehouse.com/KastKing_iReel_2_IFC_Smart_Casting_Reel/descpage-KZSIRT.html?from=BFOR
tacklewarehouse.com/Pflueger_President_Casting_Reels/descpage-RCPPC.html?from=BFOR
```

---

## VERIFIED MISSING AFFILIATE LINK

### 6th Sense Juggle Shot Minnow — Product section exists, no link
- **Article:** https://bassforecast.com/baits-for-spring-bass-fishing
- **Finding:** Article has a full section about "6th Sense Juggle Shot Minnow" with descriptive text, but NO outbound link to any retailer. Other products on the same page (Bobby Garland, Molix Stick Flex, Berkley Money Badger) all have proper TW links with `?from=BFOR`.
- **TW URL status:** https://www.tacklewarehouse.com/6th_Sense_Juggle_Shot_Minnow/descpage-6SSJSM.html?from=BFOR returns 404 anyway — so even if a link had been added, it would be broken.

---

## CORRECTION FROM FIRST PASS

### Lew's HyperMag to Shimano — CLAIM WAS WRONG
The first audit claimed the Lew's HyperMag anchor text linked to a Shimano category page. **This is incorrect.**
- The Lew's HyperMag has its own correct link: `descpage-LMAG.html?=BFOR` → returns 200
- The Shimano category link is correctly associated with the "Shimano Curado DC line" section
- However, the HyperMag link does use the malformed `?=BFOR` parameter (covered above)

---

## SUMMARY

| Finding | Status | How to Verify |
|---------|--------|---------------|
| Abu Garcia Max X → TW 404 | VERIFIED | `curl -I "https://www.tacklewarehouse.com/Abu_Garcia_Max_X_Casting_Reel/descpage-AGMXX.html"` |
| Abu Garcia Max 4 → TW 404 | VERIFIED | `curl -I "https://www.tacklewarehouse.com/Abu_Garcia_Max_4_Casting_Reel/descpage-AGM4.html"` |
| Frabill Bearclaw → TW 404 | VERIFIED | `curl -I "https://www.tacklewarehouse.com/Frabill_Trophy_Haul_Bearclaw_Net/descpage-FBC.html"` |
| Grundens Buoy X → 404 via Avantlink | VERIFIED | Follow redirect from Avantlink URL to grundens.com |
| 4 links with `?=BFOR` vs `?from=BFOR` | VERIFIED | View source on baitcasting reels article |
| 6th Sense section with no link | VERIFIED | View source on spring baits article |
| Lew's HyperMag mislabeled | **WRONG — CORRECTED** | HyperMag links correctly; tracking param is the issue |

**4 confirmed broken product links sending users to dead pages. 4 malformed tracking parameters likely breaking affiliate attribution. 1 product section generating zero clicks because no link exists.**
