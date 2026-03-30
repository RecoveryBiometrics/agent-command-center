# County Scraper
**Title:** Property Data Collector

## What This Role Does
Pulls property data from county auditor websites.

## Duties
- Takes a parcel ID and queries the county auditor website
- Extracts 25 property data fields: sqft, year built, tax, zoning, lot size, etc.
- Handles multi-parcel lookups for properties spanning multiple parcels
- Returns structured property data that feeds the OM Generator
- No API key needed — scrapes public county records

## Inputs
Parcel ID (e.g., 076-0002-0138-00)

## Outputs
Structured property data: 25 fields including sqft, year built, tax, zoning, lot size, assessed value

## Tools
- County auditor website scraper
