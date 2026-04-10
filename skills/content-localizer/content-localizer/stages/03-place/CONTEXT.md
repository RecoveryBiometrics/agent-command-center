# Stage 3: Place

## Inputs
- Finalized post JSON with correct language, category, and localized content
- Business config (org.path, site posts directory)

## Process

### 1. Set metadata
Ensure the post JSON has:
- `language` — from Stage 1
- `category` — real topic name from Stage 1
- `publishedAt` — ISO timestamp (set if missing)
- `slug` — lowercase-hyphenated, no special chars

### 2. Write to site posts directory
Write the JSON to:
- `{site_path}/posts/{slug}.json`
- `{pipeline_path}/posts/{slug}.json` (sync copy)

For GHL: both `globalhighlevel-site/posts/` and `posts/` in the pipeline repo.

### 3. Verify placement
- Confirm file exists in both locations
- Confirm JSON is valid
- Log: "Placed {slug} → language={language}, category={category}"

## Outputs
- Post JSON written to correct directories
- Confirmation of successful placement

## Tools needed
- File writes
