# Researcher
**Title:** Event Scraper

## What This Role Does
Scrapes real upcoming events from multiple platforms for configured cities.

## Duties
- Scrapes 3 live event platforms (Eventbrite, Patch.com, AllEvents.in) for real upcoming events
- Processes configured number of cities per daily run, cycling through all service areas
- Parses JSON-LD structured data from each platform, with HTML fallback scraping
- Deduplicates events by normalized title (removes punctuation, articles)
- Filters out junk patterns (navigation text like 'Sign Up', 'Browse', etc.)
- Converts ISO dates to human-readable format
- Returns max 5 unique events per city with: name, date, location, description, source URL

## Inputs
City name, state, county from the service area rotation schedule

## Outputs
Array of verified real upcoming events (max 5 per city) with full metadata

## Tools
- Eventbrite scraper
- Patch.com scraper
- AllEvents.in scraper
