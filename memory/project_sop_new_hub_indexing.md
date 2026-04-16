---
name: SOP — Manual GSC indexing for every new hub page
description: Standard operating procedure. Every time a new hub or pillar page ships, manually request indexing in GSC to compress Google discovery from 1-7 days to hours.
type: project
originSessionId: ed1a4994-e1c6-4bae-b8aa-0723dbef015d
---
# SOP: Manual GSC indexing for new hub pages

**Trigger:** Every time a new hub page or pillar page ships to globalhighlevel.com (or any business site we manage).

**Why:** Sitemap-only discovery takes 1-7 days. GSC URL Inspection "Request Indexing" compresses it to hours. For a hub-and-spoke series where authority compounds over time, every day of delay is a day of zero signal.

**Who does it:** Bill (Claude cannot — requires active browser session in GSC).

**Time cost:** 2 minutes per ship.

## The drill

1. Open https://search.google.com/search-console
2. Sign in with **williamcourterwelch@gmail.com** (NOT bill@reiamplifi.com. GSC uses that account ONLY. See `reference_gsc_account.md`.)
3. Select the right property (e.g., `globalhighlevel.com`).
4. Paste the new hub URL into the top search bar (the URL Inspection tool).
5. Wait ~15 sec for inspection.
6. Click **"Request Indexing"** button.
7. Repeat for the new pillar URL.
8. Optional but smart: submit 1-2 of the most-retrofitted spokes too (sitemap will catch them within a week, but manual submission compresses that).

## When this SOP fires

- ✅ Net-new hub URL (e.g., `/es/para/<vertical>/`)
- ✅ Net-new pillar URL (Part 1 of any new series)
- ✅ Major URL restructure (any time canonical changes)
- ❌ Routine new blog post (sitemap is fine)
- ❌ Edits to existing posts (already indexed)

## What I (Claude) do for you

When a verticals ship completes, I MUST:
1. Print the exact URLs to submit (hub + pillar)
2. Remind Bill of this SOP by name
3. Note which GSC account to use (williamcourterwelch@gmail.com, not the reiamplifi address)

## Why not automate via Google Indexing API

The Google Indexing API exists but officially only supports `JobPosting` and `BroadcastEvent` schema types. Using it for general pages works in some accounts but is unsupported and risky. Manual URL Inspection is the legitimate path Google's docs endorse for general content. 2 min of human time is correct.

## Related
- `reference_gsc_account.md` — GSC account binding
- `project_verticals_pipeline.md` — verticals shipping cadence
- `project_verticals_session_handoff.md` — current MVP ship state
