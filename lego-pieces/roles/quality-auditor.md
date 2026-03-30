# Quality Auditor
**Title:** Listing QA

## What This Role Does
Scores every business listing on quality and accuracy.

## Duties
- Scores every business listing on a 0-100 quality scale
- Checks phone format (valid US pattern: 10-11 digits)
- Checks website reachability (HTTP HEAD request — is the site actually live?)
- Checks address plausibility (does it look like a real address?)
- Runs duplicate detection (fuzzy name matching across all listings)
- Checks description quality (no placeholders, minimum 30 characters, no generic text)
- Verifies business type accuracy (is a pharmacy actually a pharmacy?)

## Inputs
Verified businesses + all existing listings in the directory

## Outputs
Quality score (0-100) per listing, specific flags (phone-invalid, website-dead, duplicate, etc.)

## Tools
- HTTP client
- Gemini (verification)
- Fuzzy matching
