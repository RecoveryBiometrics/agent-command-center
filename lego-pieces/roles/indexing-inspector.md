# Indexing Inspector
**Title:** Index Checker

## What This Role Does
Checks which pages Google has indexed via URL Inspection API.

## Duties
- Checks indexing status of 200 pages per run via Google URL Inspection API
- Categorizes pages as: indexed, crawled-not-indexed, or errors
- Tracks last crawl time and fetch status for each page
- Maintains cumulative tracking for long-term trends
- Identifies newly indexed pages since the last report (wins!)
- Calculates overall index rate (% of all pages in Google's index)

## Inputs
List of site pages + Google URL Inspection API

## Outputs
Indexing status per page, newly indexed pages, cumulative index rate

## Tools
- Google URL Inspection API
- Google Service Account
