---
name: SafeBath site architecture (verified 2026-04-16)
description: Layout, phone placement, GA4 setup, directory structure. Check here before guessing about SafeBath's frontend.
type: reference
originSessionId: 67b5bfa1-1a7a-417e-9f26-c43d89efe7c4
---
## Repo
- **Location:** `~/Developer/projects/safebath/website/`
- **Framework:** Next.js (App Router, `src/app/`)
- **GitHub:** `RecoveryBiometrics/safebath-website` (cloned into remote triggers)
- **Live:** safebathgrabbar.com
- **Hosting:** Vercel

## Global components

- **`src/components/Header.tsx`** — accepts `phone?: { display, tel }` prop for per-market routing, defaults to `BUSINESS_INFO.phoneTel`. Renders on every page. CTA text: `"Call for Same-Week Scheduling: {phoneDisplay}"`.
- **`src/components/Footer.tsx`** — same phone prop pattern, renders `<a href="tel:{phoneTel}">{phoneDisplay}</a>` on every page.
- **`src/app/layout.tsx`** — root layout, includes GA4 script + dataLayer.

**Implication:** phone is on every page (header + footer). No need to add SafeBath CTAs to child page types that are supposed to be clean (directory listings, etc.).

## Per-market phone routing

National expansion live for Las Vegas + Myrtle Beach per ops-log 2026-03-13. Header/Footer/schema get market-specific numbers via the `phone` prop. Default falls back to `BUSINESS_INFO.phoneTel` (the global number).

## GA4

- **Measurement ID:** `G-M1Q5T7BLG2`
- **Property ID:** `531047753`
- **Live events as of 2026-04-16 (last 30d):** only 5 events, all auto/Enhanced Measurement defaults:
  - `page_view` (76), `session_start` (39), `user_engagement` (35), `first_visit` (26), `scroll` (10)
- **NOT currently tracked (gap):** `phone_click`, `form_submit`, `cta_click`, `outbound_click`, `directory_outbound_phone`, `directory_outbound_web`, `listing_impression`
- **Key Events / Conversions configured:** none

## Directory page structure

- `src/app/directory/layout.tsx` — directory-wide layout
- `src/app/directory/listing/[slug]/page.tsx` — single listing page. Displays the LISTED business's phone + website. **Does NOT include a SafeBath-specific CTA block** (intentional per team Musk/Bezos — keeps directory pages clean for the searcher + future paid-listing product).
- `src/app/directory/type/[business-type]/page.tsx` — business-type index
- `src/app/directory/[state]/page.tsx` and `[state]/[county]/page.tsx` — geography rollups

**Revenue model for directory (per Bill 2026-04-16):**
- Paid listings upsell — charge businesses to be listed
- Website rebuild upsell — "we built your listing, let us rebuild your site for $Y"
- To monetize: **needs outbound-click tracking** per listing (phone + web) so we can show them engagement numbers

## Service pages (conversion pages, should have CTAs)

- `/grab-bar-installation` — hub page
- `/bathroom-safety-{county-state}` — county hubs
- `/bathroom-safety-{city-state}` — city pages
- `/bathroom-safety-{city-state}/{service-slug}` — city+service combos (hundreds of these; April 10 restructure was reverted April 13)

## Pipelines writing to this repo

- `.github/workflows/daily-content-pipeline.yml` — daily 6am ET: local news, business discovery, GSC miner, quality audit, regenerates `ops-status.json`
- `.github/workflows/weekly-seo-report.yml` — Tue 9:07am ET (candidate for deprecation — cloud trigger covers this now)
- `.github/workflows/weekly-analytics.yml` — Mon 8am ET
- `.github/workflows/weekly-content-builder.yml` — Wed 6am ET

## Secrets path (for scripts that need GSC/GA4)

GitHub Actions secret: `GOOGLE_SERVICE_ACCOUNT_KEY` → same key as `GOOGLE_SERVICE_ACCOUNT_KEY_B64` in claude.ai env `reiamplifi-google`.
