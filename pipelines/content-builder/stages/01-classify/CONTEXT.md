# Stage 1: Classify TODOs

## Inputs
- Google Sheet "Active TODOs" tab (columns: Area, Task, Priority, Status, Notes)
- Layer 3: references/content-rules.md (min impressions threshold)

## Process
1. Read all rows where Status = "New"
2. Parse the Task text to extract type + metadata:
   - "SEO — Gap" → { type: "gap", keyword, impressions, position }
   - "SEO — Opportunity" → { type: "opportunity", slug, position, impressions }
   - "SEO — Investigate" → skip (human judgment required)
3. Filter: skip gaps below minimum impressions threshold
4. Return classified TODO list, capped at max_todos_per_run

## Outputs
- Array of { type, keyword|slug, position, impressions, sheetRow }
- Passed to stage 02 (research) for gaps, or stage 05 (link) for opportunities
