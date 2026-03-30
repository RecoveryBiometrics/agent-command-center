# Blog Fact Checker
**Title:** Content Validator

## What This Role Does
Validates blog posts for factual accuracy, fabricated stats, and compliance.

## Duties
- Reviews the entire blog post for factual accuracy
- Catches fabricated or made-up statistics (a common AI hallucination)
- Verifies product and company name spellings
- Checks any pricing claims against known data
- Flags potential legal or compliance issues
- Applies custom fact-check rules if configured
- Returns corrected HTML if issues found, or passes original through if clean

## Inputs
Blog post HTML from the Blog Writer

## Outputs
Passed/failed verdict, corrected HTML, list of issues found

## Tools
- Claude API (Haiku)
