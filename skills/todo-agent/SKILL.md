---
name: TODO Agent
description: Read Active TODOs from a business's Google Sheet, execute agent-handleable items (SEO optimization, new pages, drop investigation, analytics dispatch), update status, and post summary to Slack.
user-invocable: true
---

# TODO Agent

You are operating the TODO Agent skill. This agent reads actionable TODOs from a business's tracking sheet and executes the ones that can be handled programmatically — SEO optimizations, new page creation, drop investigations, and analytics dispatch.

## When to use this skill
- User says `/todo-agent` or `/todo-agent safebath`
- User says "run the TODOs", "execute TODOs", "handle the action items"
- User asks "what TODOs are pending?" (read-only mode — just list them)

## Invocation

```
/todo-agent                  — runs for ALL businesses with a tracking_sheet_id
/todo-agent safebath         — runs for SafeBath only
/todo-agent safebath --dry   — shows what would be done without executing
```

## Step 0: Load Business Config

1. If a business ID is provided, read `~/Projects/agent-command-center/businesses/{business-id}.yaml`
2. If no business ID, scan all YAMLs in `~/Projects/agent-command-center/businesses/` and run for each that has `tracking_sheet_id`
3. Extract from YAML:
   - `tracking_sheet_id` — where TODOs live
   - `org.path` — local project path (e.g., `~/Developer/projects/safebath/website/`)
   - `org.github` — GitHub repo (e.g., `RecoveryBiometrics/safebath-website`)
   - `seo.changelog_path` — SEO changelog location
   - `slack.business_channel` — where to post summary
   - `website` — live site URL
   - `brand` — voice, CTA, phone info for content generation

## Step 1: Read Active TODOs from Sheet

Use `google-workspace` MCP tool `read_sheet_values`:
- Spreadsheet ID: `tracking_sheet_id` from YAML
- Range: `'Active TODOs'!A:E`
- Columns: `Area | Task | Priority | Status | Notes`

Filter for actionable items:
- **Status = "New"** — these are unhandled
- Skip "Done", "In Progress", "Monitoring", "Auto-handled"

Classify each TODO by its Area prefix:

| Area Prefix | Type | Agent Can Handle? |
|-------------|------|-------------------|
| `SEO — Opportunity` | Page exists, needs optimization | YES |
| `SEO — Gap` | No page for a search term | YES |
| `SEO — Investigate` | Page lost rankings | PARTIAL (diagnosis yes, some fixes yes) |
| `Analytics` | Insight/suggestion | YES (dispatch) |
| `Analytics — Dispatched` | Already dispatched | SKIP |
| Anything with "GBP", "review", "photo", "phone" | Human task | SKIP — note in summary |

## Step 2: Execute Each TODO

### Before ANY code changes

1. `cd` to the business project path (`org.path` from YAML + `/website/` if Next.js)
2. `git pull` to ensure latest code
3. Create a branch: `git checkout -b todo-agent/$(date +%Y-%m-%d)`
4. Update the TODO status in Sheet to "In Progress" using `modify_sheet_values`

### SEO Opportunity (page exists, needs optimization)

The task looks like: `Optimize /some-slug — position 16.7, 175 impressions`

**Extract the slug** from the task text (everything between "Optimize " and " —").

**Locate the page:**
- If slug is `/` → `src/app/page.tsx` (home page)
- If slug matches a location → `src/app/[location]/page.tsx` (dynamic, uses `generateMetadata`)
- If slug matches a service path → find in `src/app/bathroom-safety-services/` or `src/app/grab-bar-installation/`
- If slug matches a local-news path → find in `src/app/[location]/local-news/`
- Use `grep -r` to find the slug reference if unclear

**Optimization actions:**
1. **Title tag** — Check `generateMetadata` or the page's `<title>`. Optimize to <60 chars, include primary keyword. Don't change drastically — refine.
2. **Meta description** — 120-160 chars, include primary keyword + CTA. Conversational, not keyword-stuffed.
3. **Internal links** — This is the highest-impact action:
   - Find 2-3 high-authority pages that should link TO this page
   - High-authority = home page, hub page (`/grab-bar-installation`), service pages, or other pages already ranking well
   - Add contextual links (not "click here" — use descriptive anchor text with the target keyword)
   - Read `src/lib/constants.ts` to find all locations and services for link opportunities
   - Check existing internal links first — don't duplicate
4. **H1 tag** — Should contain the primary keyword. Usually already correct on location pages.

**For location pages specifically:**
- The page is dynamically generated from `src/app/[location]/page.tsx`
- Metadata comes from `generateMetadata()` — this is where title/description live
- Content sections pull from `city-wiki` data (`src/data/city-wiki/{slug}.json`) and `local-news` data
- To add internal links, look at components rendered on the page and add `<Link>` elements pointing to related locations or services

**Commit message:** `seo: optimize {slug} — title, meta, internal links [todo-agent]`

### SEO Gap (no page exists for a search term)

The task looks like: `No page for "shower grab bar installers" — 71 impressions, position 41.0`

**Extract the keyword** from between the quotes.

**Decide the page type:**
- If it's a location-based keyword (contains a city/county name) → Check if we already have that location in `LOCATIONS` or `COUNTIES_AND_LOCATIONS` in `src/lib/constants.ts`. If not, add it.
- If it's a service keyword (e.g., "shower grab bar installers") → Create a new service detail page under `src/app/bathroom-safety-services/` or a new hub subpage
- If it's a long-tail question → Consider a FAQ section addition or blog-style content

**For a new service page:**
1. Create `src/app/bathroom-safety-services/{keyword-slug}/page.tsx`
2. Follow the pattern of existing service pages (read one first!)
3. Include: proper metadata (title <60, description 120-160), H1 with keyword, 300+ words of unique content, internal links to/from related pages, schema markup, CTA with correct phone number
4. Add the page to the sitemap if not auto-discovered (check `src/app/sitemap.ts`)
5. Add 2-3 internal links FROM existing high-authority pages TO the new page

**For a new location:**
1. Add the city/county to `src/lib/constants.ts` in the appropriate array
2. The dynamic route `src/app/[location]/page.tsx` will auto-generate the page
3. Create a city-wiki JSON if needed: `src/data/city-wiki/{slug}.json`
4. Add internal links from nearby locations

**Commit message:** `seo: add page for "{keyword}" [todo-agent]`

### SEO Investigate (ranking drop)

The task looks like: `/bathroom-safety-delaware-city-de/bathroom-grab-bar-installation dropped 17.1 positions`

**Investigation steps:**
1. **Read the SEO Changelog** from the tracking sheet ("SEO Changelog" tab) — look for recent changes to this URL or related pages
2. **Check git log** for that file: `git log --oneline -10 -- src/app/...` to see recent changes
3. **Check the page** — read the current source. Is there a rendering issue? Missing content? Broken links?
4. **Check competing pages** — if multiple pages target the same keyword, we may have cannibalization
5. **Check timing** — if the drop aligns with a known Google algorithm update (check Notes column), that's the likely cause

**Based on diagnosis:**
- If a recent code change caused it → revert or fix the change
- If it's keyword cannibalization → consolidate pages or differentiate targeting
- If content is thin → beef it up (more unique content, better structure)
- If no clear cause → write diagnosis to Notes column, set status to "Monitoring"
- If it's likely an algorithm update → set status to "Monitoring", note in Sheet

**Update Notes column** with your diagnosis regardless of action taken.

### Analytics Suggestion

The task looks like: `Organic Search accounts for 79% of all traffic` or `Prioritize Delaware cities in content pipeline`

**If it's an actionable dispatch:**
1. Write to the "Dispatch" tab on the tracking sheet using `append_table_rows`:
   - Columns: `Date | Target | Action | Params | Why | Status`
   - Example: `2026-04-08 | seo-content | prioritize_cities | ["Wilmington, DE", "Newark, DE"] | GA4 shows 30% traffic from DE | pending`
2. The target pipeline will read and consume on its next run

**If it's an informational insight:**
- No action needed — update status to "Noted" with a brief analysis in Notes

## Step 3: Update TODO Status in Sheet

After each TODO is handled, update the status in the Sheet:

| Outcome | Status | Notes Update |
|---------|--------|-------------|
| Successfully optimized | Done | "Optimized: title, meta, +3 internal links. Branch: todo-agent/2026-04-08" |
| New page created | Done | "Created /new-slug. Branch: todo-agent/2026-04-08" |
| Diagnosed but unfixable | Monitoring | "Likely algorithm update. Will reassess next week." |
| Dispatched to pipeline | Done | "Dispatched to seo-content: prioritize_cities [DE]" |
| Requires human action | Skipped | "Needs human: [reason]. Flagged in Slack." |

Use `modify_sheet_values` to update the Status (column D) and Notes (column E) for the specific row.

**Finding the row number:** When you read the sheet in Step 1, track the row index (row 1 = headers, row 2 = first data row). Use that index when updating.

## Step 4: Commit and Push

After all TODOs for a business are processed:

1. Stage all changes: `git add -A` (in the business project directory)
2. Review the diff: `git diff --cached` — sanity check before committing
3. Commit: `git commit -m "seo: todo-agent batch — {N} items optimized [todo-agent]"`
4. Push: `git push -u origin todo-agent/$(date +%Y-%m-%d)`
5. Create a PR: `gh pr create --title "TODO Agent: {date} batch" --body "..."`

**PR body format:**
```
## TODO Agent Batch — {date}

### Completed
- [x] Optimized /slug-1 — title, meta, +3 internal links
- [x] Created /new-keyword-slug — new service page
- [x] Dispatched: prioritize DE cities to seo-content

### Monitoring
- [ ] /dropped-page — likely algorithm update, watching

### Skipped (needs human)
- [ ] GBP optimization — requires Google Business Profile access

Generated by /todo-agent
```

## Step 5: Post Summary to Slack

Post to the business's Slack channel (`slack.business_channel` from YAML):

```
TODO Agent Report — {Business Name} — {date}

Completed: {N}
- Optimized /slug-1 (title + meta + 3 internal links)
- Created /new-keyword-slug
- Dispatched: prioritize DE cities

Monitoring: {N}
- /dropped-page — likely algorithm update

Needs human: {N}
- GBP optimization
- Review request follow-up

PR: {PR URL}
```

Use `slack_send_message` MCP tool.

## Dry Run Mode

When invoked with `--dry`:
- Read and classify all TODOs (Steps 0-1)
- Print what WOULD be done for each TODO
- Do NOT modify any files, sheets, or git state
- Useful for reviewing before executing

Output format:
```
TODO Agent — Dry Run — SafeBath

1. [WOULD EXECUTE] SEO Opportunity: Optimize / — position 16.7
   Actions: optimize title, meta description, add 3 internal links

2. [WOULD EXECUTE] SEO Gap: No page for "shower grab bar installers"
   Actions: create new service page at /shower-grab-bar-installers

3. [WOULD SKIP] SEO Investigate: /page dropped 17.1 positions
   Reason: Investigation items handled case-by-case

4. [WOULD DISPATCH] Analytics: Organic Search accounts for 79% of traffic
   Actions: note insight, no dispatch needed (informational)

5. [WOULD SKIP] GBP: Update business hours
   Reason: Requires human (Google Business Profile access)
```

## Important Rules

1. **Never break existing pages.** Read the page thoroughly before modifying. If unsure, skip and mark as "Needs Review".
2. **Respect the brand voice** from the YAML. SafeBath = direct, trust-building, professional. Not salesy.
3. **Internal links must be contextual.** Don't just dump links at the bottom. Weave them into existing content naturally.
4. **One branch per run.** All changes for a business go in one branch, one PR.
5. **Always update the Sheet.** Even if you skip a TODO, update its status so it doesn't get re-processed.
6. **Phone numbers vary by region.** Check `getPhoneForCounty()` or `getPhoneForLocation()` in constants.ts. Never hardcode a phone number.
7. **Title tags < 60 chars.** Meta descriptions 120-160 chars. These are hard limits.
8. **Don't over-optimize.** Subtle, natural improvements > keyword stuffing. Google penalizes over-optimization.
9. **Check for cannibalization.** Before creating a new page, verify no existing page already targets that keyword. Search the codebase.
10. **Log everything.** If you take an action, the Sheet and Slack should reflect it.

## Key File Locations

| What | Where |
|------|-------|
| Business configs | `~/Projects/agent-command-center/businesses/*.yaml` |
| SEO reporting pipeline | `~/Projects/agent-command-center/pipelines/seo-reporting/` |
| Analytics pipeline | `~/Projects/agent-command-center/pipelines/analytics/` |
| SafeBath website | `~/Developer/projects/safebath/website/` |
| SafeBath constants | `~/Developer/projects/safebath/website/src/lib/constants.ts` |
| City wiki data | `~/Developer/projects/safebath/website/src/data/city-wiki/` |
| Local news data | `~/Developer/projects/safebath/website/src/data/local-news/` |
| Location pages | `~/Developer/projects/safebath/website/src/app/[location]/` |
| Service pages | `~/Developer/projects/safebath/website/src/app/bathroom-safety-services/` |
| Sitemap | `~/Developer/projects/safebath/website/src/app/sitemap.ts` |
| SEO changelog | Tracking sheet "SEO Changelog" tab |
| Active TODOs | Tracking sheet "Active TODOs" tab |
| Dispatch | Tracking sheet "Dispatch" tab |

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `read_sheet_values` | Read Active TODOs and SEO Changelog |
| `modify_sheet_values` | Update TODO status and notes |
| `append_table_rows` | Write dispatch instructions |
| `slack_send_message` | Post summary to business channel |

## Error Handling

- If Sheet read fails → abort, post error to Slack
- If a single TODO fails → mark as "Error" in Sheet, continue to next TODO
- If git push fails → post warning to Slack with the branch name so user can push manually
- If PR creation fails → still post Slack summary with branch name
- Never leave a TODO in "In Progress" state if the agent crashed — on next run, reset stale "In Progress" items back to "New"
