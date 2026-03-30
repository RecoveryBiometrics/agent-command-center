# Fact Checker
**Title:** Data Validator

## What This Role Does
Validates data quality and accuracy. Used at multiple pipeline stages for different checks.

## Duties
- Research validation: validates every scraped event is future-dated, filters past events and junk data
- Copy validation: compares articles across cities, flags >85% similarity as duplicate
- Returns valid/invalid verdict per item with specific issues found
- If validation fails, triggers a retry of the previous step (up to 3 attempts)

## Inputs
Data from the previous pipeline stage (research or copy)

## Outputs
Filtered/validated data — only clean items pass through

## Self-Healing
Retries the upstream step up to 3 times before skipping the item
