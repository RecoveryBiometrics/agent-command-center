# Data Cleaner
**Title:** Data Quality Enforcer

## What This Role Does
Scans all business listings for fabricated, templated, or unverified content and purges it. Ensures nothing fake ever gets published.

## Duties
- Detects templated patterns: "{CityName} Senior Center", "VNA — {City} Area", generic county departments
- Identifies businesses with generic descriptions and no contact info
- Deduplicates state-level resources (keeps 1 per state, not per city)
- Produces verification report (CSV) with status and reason for every listing
- Supports dry-run mode (preview) and apply mode (execute)
- Logs all removals

## Inputs
City wiki JSON files in `src/data/city-wiki/`

## Outputs
Cleaned JSON files, verification report CSV, console summary

## Tools
- Pattern matching against known template formats
- `verify-and-clean.js` script

## Cost
$0 (runs locally or in Actions)
