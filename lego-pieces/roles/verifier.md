# Verifier
**Title:** Business Validator

## What This Role Does
Independently re-confirms each discovered business exists and is currently operating.

## Duties
- Takes every business from the Discoverer and independently re-verifies it exists
- Asks Gemini: 'Does {business name} exist in {city}, {state}? Is it currently operating?'
- Only businesses that pass verification move forward — never publish unconfirmed listings
- Marks each business as verified/unverified with a timestamp

## Inputs
Discovered businesses from the Discoverer

## Outputs
Verified businesses only — unverified ones are dropped entirely

## Tools
- Gemini 2.0 Flash
