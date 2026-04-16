---
name: RESUME VERTICALS WORK (ES Part 1 agency-starters — built, not deployed)
description: Session handoff. Say "resume the verticals work" to pick up where we left off on 2026-04-15.
type: project
originSessionId: ed1a4994-e1c6-4bae-b8aa-0723dbef015d
---
# Resume the verticals work

When Bill says "resume the verticals work" or anything similar, load this file. ES Part 1 agency-starters is **LIVE on globalhighlevel.com as of 2026-04-16**. Next decision is the day-14 measurement gate.

## SHIPPED 2026-04-16
- Hub: https://globalhighlevel.com/es/para/agencias-de-marketing/ (HTTP 200 confirmed)
- Pillar: https://globalhighlevel.com/es/para/agencias-de-marketing/por-que-agencias-marketing-necesitan-crm-2026-parte-1/ (HTTP 200 confirmed)
- 10 ES cluster spokes retrofitted with inbound link to hub
- Deploy mechanism: Netlify (NOT Cloudflare as SKILL claimed) — auto-builds on push to `Claude-notebookLM-GHL-Podcast` repo. netlify.toml runs `python3 build.py` from `globalhighlevel-site/`
- Sheet "Verticals Queue" Part 1 row = shipped. Sheet "Cluster Map" 10 rows = retrofitted.
- Google Indexing API NOT pinged (no existing integration). Discovery via sitemap + retrofit inbound links, expect 1-7 days for index.

## Day-14 measurement gate (around 2026-04-30)
1. Check GSC → both URLs indexed?
2. GSC impressions ≥10/day for either URL?
3. If yes → ship Parts 2-3 ES with same dispatcher
4. If indexed but 0 impressions → rewrite title for higher-intent keyword, then ship 2-3
5. If not indexed → URL structure or thinness issue, fix before continuing

## Where we are (post-ship 2026-04-16)

**Verticals pipeline ES Part 1 agency-starters is fully built locally.** 4 hours of build, multiple Opus review iterations, authority-skin UI redesign. Sleeping on it before deploying.

### What's on disk and committed locally (commit `c49bfd5` in `~/Developer/projects/marketing/podcast-pipeline`, NOT PUSHED to GitHub remote)

**Code:**
- `ghl-podcast-pipeline/scripts/7-spanish-blog.py` — added `--mode=attia-longform` flag, anti-fab Rule #0 in `SPANISH_FACT_RULES`, `revise_with_corrections()` Haiku feedback loop
- `ghl-podcast-pipeline/scripts/language_reviewer.py` — Opus 4.6 ES quality gate. Returns `{approved, corrections}` only (no rewrites)
- `ghl-podcast-pipeline/scripts/verticals_hub.py` — series hub generator
- `ghl-podcast-pipeline/scripts/verticals_dispatch.py` — dispatcher: hub → pillar → review/retry → report
- `ghl-podcast-pipeline/scripts/verticals_retrofit.py` — adds inbound link from 10 ES spokes to new hub (idempotent)
- `globalhighlevel-site/build.py` — added `post_url()` + `post_output_rel()` helpers, `build_authority_page()` Attia-style template, routing for `/es/para/` and `/for/` URLs

**Generated content:**
- `globalhighlevel-site/posts/hub-agencias-de-marketing.json` — series hub, 1,845 words, Opus-approved, `url_path=/es/para/agencias-de-marketing/`
- `globalhighlevel-site/posts/por-que-agencias-marketing-necesitan-crm-2026-parte-1.json` — Part 1 pillar, 1,314 words, cross-linked to hub via series breadcrumb + up-next teaser, `url_path=/es/para/agencias-de-marketing/por-que-agencias-marketing-necesitan-crm-2026-parte-1/`

**Retrofitted 10 ES cluster spokes** (in same commit) — each has an inbound link to the new hub injected after the 2nd `</h2>`.

### What's in Google Sheet (`1A2eD2LeBpWFjDMe6W9BZbN6FvfW-em_7gD002pJD7_E`)
- New tab "Verticals Queue" — agency-starters Parts 1-3 ES rows seeded, all `status=queued` (Part 1 NOT yet `shipped`)
- New tab "Cluster Map" — 10 ES spoke URLs mapped to hub, all `retrofit_status=pending` (Sheet not updated; actual files ARE retrofitted)
- "Active TODOs" tab row 2 = "Translate /trial + /start landing pages for ES, IN, AR" (HIGH priority — discovered while reviewing the pillar)

### What's pushed to backup
- `agent-command-center` commit `5693e17` (pushed): SKILL.md + new memory `feedback_build_per_business_no_premature_abstraction.md`

## What's NOT done (do next session)

1. **Decide: ship or polish.** Tonight Bill saw the rendered authority pages locally and they look good. Three remaining issues:
   - The "Al terminar este post entenderás" learning-objectives box has a beige inline-style background that survives the CSS override (small fix)
   - Pillar Attia-template fidelity = 7/12 (missing: ≥5 H2s, ≥2 Q&A H3s, footnotes, second /trial CTA, Extendly CTA — see audit script in conversation)
   - Pillar is 1,314 words vs. SKILL spec target 2,500-3,500. Decision tonight: accept short-but-clean rather than expand-and-fabricate

2. **If shipping:**
   - `cd ~/Developer/projects/marketing/podcast-pipeline && git push origin main` (deploys via Cloudflare auto-build)
   - Wait 1-3 min for Cloudflare deploy
   - Verify live at https://globalhighlevel.com/es/para/agencias-de-marketing/
   - Ping Google Indexing API for both URLs (existing function in podcast pipeline off-page step)
   - Update Sheet Verticals Queue row 2: `status=shipped`, `shipped_date=<today>`, `url=https://globalhighlevel.com/es/para/agencias-de-marketing/por-que-agencias-marketing-necesitan-crm-2026-parte-1/`
   - Update Sheet Cluster Map rows 2-11: `retrofit_status=retrofitted`, `inbound_count=1`, `last_audited=<today>`

3. **If polishing first:**
   - Override the beige learning-objectives box CSS in `build.py` `_authority_css()`
   - Strengthen first-pass writer prompt to produce 2,500+ words natively (consider Sonnet w/ structured-output API to avoid JSON parse failures Sonnet had tonight)
   - Add Extendly CTA + second `/trial` CTA enforcement to writer prompt or post-process

## Reference points

- **Verticals SKILL.md:** `~/.claude/skills/verticals-pipeline/SKILL.md` (rewritten tonight to match what was actually built)
- **Architecture decisions:** `project_verticals_pipeline.md` memory (locked 2026-04-14)
- **Per-business build rule:** `feedback_build_per_business_no_premature_abstraction.md` (created tonight) — DO NOT generalize this for SafeBath or other businesses until N=3 verticals exist
- **Customer memo:** Ana in Guadalajara, agency owner, searches "mejor CRM para agencias de marketing 2026" → lands on /es/para/agencias-de-marketing/ → reads Part 1 pillar → starts trial. That memo is the test for "does this serve the customer"

## What's running / what to clean up
- Local web server on port 8765 (probably killed at end of session, but check `lsof -i :8765`)
- Two browser tabs open at localhost:8765 — close those when resuming
- API spend tonight: ~$8-10 across multiple dispatcher iterations
