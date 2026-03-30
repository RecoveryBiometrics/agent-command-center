# Places Enricher
**Title:** Data Enrichment

## What This Role Does
Adds Google Places data — star ratings, hours, photos, verified addresses.

## Duties
- Searches Google Places API for each business listing
- Enriches with: Google Maps URL, star rating, review count
- Adds operating hours (weekday text descriptions)
- Verifies and corrects addresses against Google's data
- Pulls first 3 photo references for the listing
- Checks business operational status (is it permanently closed?)
- Rate-limited: 1 request per second to stay within free tier
- Idempotent: only enriches listings that don't already have Places data

## Inputs
Verified business listings without existing Google Places data

## Outputs
Enriched listings with: maps URL, rating, reviews, hours, photos, verified address

## Tools
- Google Places API

## Cost
Free tier covers most usage
