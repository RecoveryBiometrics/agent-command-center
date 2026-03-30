# OM Generator
**Title:** Document Writer

## What This Role Does
AI-generates professional offering memorandum sections.

## Duties
- Takes property data + deal details from the input wizard
- Generates 11 professional OM sections using Claude Haiku
- Sections: executive summary, property overview, financial analysis, market analysis, etc.
- Uses investment-grade language and formatting standards
- Calculates NOI, cap rate, debt service coverage from inputs
- Generates in ~43 seconds total (~4 seconds per section)
- Each section can be individually regenerated

## Inputs
Property data from County Scraper + deal details (price, units, rents, expenses)

## Outputs
11 complete OM sections ready for editing

## Tools
- Claude API (Haiku 3.5)

## Cost
~$0.15 per OM (charging clients $9 = 98% margin)
