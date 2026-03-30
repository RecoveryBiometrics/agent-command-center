# Discoverer
**Title:** Business Finder

## What This Role Does
Uses AI-powered web search to find real, currently operating local businesses.

## Duties
- Uses Gemini 2.0 Flash with grounded web search to find real businesses
- Searches for configured business categories in each city
- Processes configured number of cities per day, cycling through all service areas
- For each business: confirms name, phone, website, address, and description
- Returns raw business records with verification status

## Inputs
City name, state, configured business categories

## Outputs
Raw business records with: name, phone, website, address, description, verification flag

## Tools
- Gemini 2.0 Flash (grounded search)

## Cost
~$0.02 per city
