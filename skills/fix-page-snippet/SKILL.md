---
name: fix-page-snippet
version: 2.0.0
description: "Rewrites one page's title + meta description together to lift CTR. Multi-step: reads current snippet + article opening, researches live SERP, finds intent/specificity gap, drafts 3 title + 3 meta variants, picks winner, ships to post JSON + cooldown lock + Google Sheet SEO Changelog. Also handles rollbacks (--rollback --slug X restores prior title/meta from cooldown). Single verb: mutate a page's snippet. Measurement of past rewrites lives in /measure-seo-change, NOT here."
invocation: /fix-page-snippet
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - mcp__google-workspace__read_sheet_values
  - mcp__google-workspace__modify_sheet_values
triggers:
  - fix page title
  - rewrite meta
  - rewrite title and description
  - improve page CTR
  - fix snippet
  - rollback snippet
  - revert title and meta
---

# /fix-page-snippet — Rewrite (or roll back) one page's title + meta

Title and meta work as a pair. Google shows them stacked. If title hooks but meta repels, no click. This skill co-optimizes the pair from the article's own voice and real SERP intent — OR reverts a prior rewrite that didn't pan out (when `/measure-seo-change` flags an Outcome=loss and signals rollback).

**Single verb:** mutate a page's snippet. Two parameter shapes (`--fix` default, `--rollback`) — both write title+description to the post JSON and log to the SEO Changelog Sheet. Measurement of whether prior rewrites worked lives in `/measure-seo-change`, NOT here.

## The rule

**A rewrite only ships if it beats the current snippet on ≥ 2 of these 4 tests: pain specificity, feature specificity, verb strength, or length discipline. Style-only tweaks = leave it alone, use the slot on a weaker page.**

## Invocation (parameterized)

```
/fix-page-snippet --url <full-url>                                   # rewrite one page
/fix-page-snippet --slug <slug> --business <id>                      # rewrite by slug + business
/fix-page-snippet --batch 5 --business <id>                          # rewrite top N candidates interactively
/fix-page-snippet --rollback --slug <slug> --business <id>           # restore prior title/meta from cooldown
/fix-page-snippet --rollback --slug <slug> --business <id> --reason "..."   # rollback with logged reason
```

For measurement of past rewrites (did they work?) → `/measure-seo-change`. This skill never measures.

---

## FIX MODE (Phases 0–6) — default mode

### Phase 0 — Load context + 48h freshness gate (MANDATORY)

1. **Read business YAML:** `~/Projects/agent-command-center/businesses/<id>.yaml`. Grab `gsc_site_url`, `tracking_sheet_id`, posts directory path.
2. **Read GSC data:** `data/gsc-stats.json`. **If `updated_at` > 48h old, STOP.** Re-pull via `venv/bin/python3 scripts/analytics.py`. Stale data = wrong decisions.
3. **Read cooldown file:** `data/seo-cooldown.json`. If target URL's `locked_until` > now, STOP with unlock date.
4. **Read post JSON:** get current `title`, `description`, `html_content`, `category`.
5. **Determine target query:** from `--query` arg OR infer from GSC (highest-impression query hitting this URL).

**STOP conditions:** stale GSC data, URL in cooldown, article < 500 chars (stub — needs content, not meta).

### Phase 1 — Scouting report (diarization of ONE page)

Strip HTML from `html_content`, read first 700 chars. Extract:
- **Pain words** (3-5 phrases from opening)
- **Specific mentions** (tools, features, industries, numbers)
- **Category + audience signal**

Output:
```
URL:            <url>
CURRENT TITLE:  <title> (N chars)
CURRENT META:   <desc>  (N chars)
GSC:            imps=X clicks=Y ctr=Z% rank=R
TARGET QUERY:   <query>
PAIN WORDS:     [list]
SPECIFIC:       [tools / industries / numbers]
CATEGORY:       <category>
AUDIENCE:       [agency | direct business | both | India | Spanish | Hindi | Arabic]
```

**Verify:** ≥ 2 pain words AND ≥ 2 specific mentions. If not, flag for content-refresh skill, abort rewrite.

### Phase 2 — SERP research

Fetch top 3-5 Google results for the target query. Capture title patterns (verb-first, question, listicle?) and meta hooks. Name:
- What EVERYONE does (cliché to avoid)
- What NO ONE does (gap to fill)

Add to scouting report.

### Phase 3 — Diagnose the gap

Name the failure mode: `intent-mismatch`, `vague-specificity`, or `both`. One-sentence brief for drafting.

### Phase 4 — Draft 3 titles + 3 metas

Each applies a different **lever** (track which — needed for Step 3 of self-improvement):

**Title levers:** `specific-features-named`, `time-or-number-promise`, `contrarian-framing`, `pain-first`, `outcome-first`

**Meta levers:** `mirror-article-pain`, `list-industries-first`, `comparison-hook`, `news-framing`, `outcome-promise`

**Hard gates (abort draft if violated):**
- Title ≤ 65 chars (Google truncates ~60)
- Meta ≤ 160 chars
- No "How to" title unless target query literally is "how to X"
- No "Learn how to" meta opener (banned)
- Banlist enforced (see self-improving rule 3)

**Hard gate — fact-check (NEW, MANDATORY):** Any specific claim in the proposed title or meta — numbers, percentages, dollar amounts, currency figures, time promises, named case studies, agency names — MUST be directly supported by text in the article body. If the article doesn't contain the claim verbatim or close to it, set `skip=true` with reason `"unverified claim: <the claim>"`. Examples requiring article support:
- `"65% Cost Cut"` → article must say "65%" or describe that case
- `"$500/month"` → article must mention $500 (or close range)
- `"in 60 seconds"` → article must mention 60 seconds (or close)
- `"Bangalore agency"` → article must name a specific Bangalore agency
- `"₹25,000–40,000"` → article must contain that rupee range

**This rule exists because of Bill's no-fake-content directive. Preserving an unverified number from the OLD title doesn't make it verified — re-evaluate every claim against the article each run.**

**Hard gate — don't-rewrite-if-strong (UPGRADED FROM RULE 2):** Before drafting ANYTHING, score the CURRENT title on the 4 tests in Phase 5 (pain specificity, feature specificity, verb strength, length discipline). If current scores ≥ 3 of 4, you MUST output `{"skip": true, "reason": "current title passes N of 4 tests: <which ones>"}`. This is not a guideline — it is a hard gate. Examples that ALWAYS trigger skip=true:
- `"Enroll 1000+ Contacts to GHL Workflows in 60 Seconds"` (number + time + verb + specific = 4/4)
- `"Cut Costs 60% in 10 Minutes"` (number + time + verb = 3/4)
- `"Build a GHL AI Agent in 10 Minutes — Agent Studio Walkthrough"` (number + time + verb + specific = 4/4)

Marginal style improvements DO NOT justify burning a 28-day cooldown slot.

### Phase 5 — Score + pick winner

Four tests:
1. **Pain specificity** — names a real article pain?
2. **Feature specificity** — names tools / industries / numbers?
3. **Verb strength** — action verb (Build, Cut, Track, Ship, Fix) not weak (Learn, Use, Try)?
4. **Length discipline** — tight, no filler?

Winner must beat current on ≥ 2 of 4. If not → **leave page alone.** Fake-fix wastes 28 days.

### Phase 6 — Ship (deterministic, 3 writes)

**6a. Post JSON:** Load `<posts_dir>/<slug>.json`. Replace `title` and `description` only. Preserve all other fields. Write `indent=2, ensure_ascii=False`.

**6b. Cooldown JSON:** Append to `data/seo-cooldown.json`:
```json
{"<slug>": {
  "action": "rewrite_meta",
  "flagged_at": "<ISO-now>",
  "locked_until": "<ISO-now + 28d>",
  "attempt": 1,
  "metrics_at_flag": {"impressions": X, "clicks": Y, "ctr": Z, "position": R},
  "changes": {"old_title": "...", "new_title": "...", "old_description": "...", "new_description": "..."},
  "lever_title": "<which title lever>",
  "lever_meta":  "<which meta lever>",
  "reason": "<one sentence>"
}}
```

**6c. Google Sheet — MANDATORY (team/stakeholder visibility):**

Use `mcp__google-workspace__modify_sheet_values` on `<tracking_sheet_id>` → tab `"SEO Changelog"`. Append one row:

| Col | Content |
|---|---|
| A Date | `<YYYY-MM-DD>` |
| B Page | `/blog/<slug>/` |
| C Change Type | `Meta rewrite (title + description)` (append `— FLAG: cannibalization cluster` if flagged) |
| D Description | `Old title: '<old>' → New: '<new>'. Old meta: '<old>' → New: '<new>'. Reason: <rationale>. Lever: <title>+<meta>.` |
| E Impact | `Baseline: <X> impr, <Y> clicks, <Z>% CTR, rank <R>. Locked until <unlock-date>. Measure lift: <unlock-date>.` |

Sheet write failure → post JSON and cooldown JSON already wrote, so **don't roll back**. Surface error, tell user to retry `--log-only`.

**6d. Summary output:**
```
✓ <slug>
  Title: <old>  →  <new>
  Meta:  <old>  →  <new>
  Baseline: imps=X clicks=Y ctr=Z% rank=R
  Locked until: <date>  |  Measure lift: <date>
  Logged: cooldown.json ✓  |  SEO Changelog ✓
```

---

## ROLLBACK MODE (`--rollback --slug X`)

Used when `/measure-seo-change` flags a prior rewrite as `Outcome=loss` and the threshold table specifies `auto_rollback=True`. Can also be run manually if a stakeholder wants to revert a rewrite for any reason.

### R0. Load context

Same as Phase 0 freshness gate (GSC must be < 48h old). Read `data/seo-cooldown.json` and locate the entry for `--slug`.

**STOP conditions:**
- Slug not found in cooldown → no recorded prior state to revert to. Surface error with a list of similar slugs.
- Cooldown entry's `changes.old_title` or `changes.old_description` is missing → can't revert without baseline. Surface error.
- Page is currently inside its 28-day cooldown window AND `/measure-seo-change` did NOT explicitly request the rollback → ask for `--force` confirmation.

### R1. Restore the post JSON

- Load `<posts_dir>/<slug>.json`.
- Set `title` = cooldown entry's `changes.old_title`.
- Set `description` = cooldown entry's `changes.old_description`.
- Preserve all other fields. Write `indent=2, ensure_ascii=False`.

### R2. Update cooldown entry

Mark the cooldown entry with:
- `rolled_back: true`
- `rolled_back_at: <ISO-now>`
- `rolled_back_reason: "<--reason value or default 'measured loss'>"`
- `soft_cooldown_until: <now + 60d>` — don't rewrite same page for 60 days, the data is too noisy to redraft yet.

### R3. Log to SEO Changelog Sheet

Append one row via MCP:

| Col | Content |
|---|---|
| A Date | today |
| C Action | `Snippet rollback — restored prior title/meta` |
| D / Description columns | `Reverted to: title='<old>', desc='<old>'. Reason: <reason>. Failed lever: <title-lever>+<meta-lever>.` |
| Outcome | `rolled_back` |

This row is for human visibility — it does NOT trigger another `/measure-seo-change` cycle.

### R4. Summary output

```
↩ <slug> rolled back
  Title: <new>  →  <old>  (restored)
  Meta:  <new>  →  <old>  (restored)
  Reason: <reason>
  Soft cooldown until: <date>
  Logged: cooldown.json ✓  |  SEO Changelog ✓
```

---

## Persistent state

```
<project>/data/
  seo-cooldown.json      — lockouts + change history + rollback markers (JSON = source of truth)
  gsc-stats.json         — latest GSC pull (must be < 48h old)

<business-tracking-sheet>
  "SEO Changelog" tab    — human-readable mirror (Date / Business / Slug / Action / ... / Outcome)
                           Append-only. Rewrite rows logged here by Phase 6c; rollback rows by R3.
                           Outcome column populated later by /measure-seo-change at day 28.

~/.claude/skills/fix-page-snippet/SKILL.md
                         — this file. Gets amended by /measure-seo-change Phase 4 when a lever
                           reaches statistical signal (≥ 10 measured uses, win rate ≥ 70% or ≤ 30%).
```

JSON is source of truth for cooldown locks. Sheet is source of truth for change log + outcomes. SKILL.md self-improvement is driven by `/measure-seo-change`, not this skill.

---

## Self-improving rules (starting set — learned 2026-04-24 with Bill on globalhighlevel.com)

Every rule below resolved a specific judgment call during 5 pair-programmed rewrites. Not theory.

1. **Audience rule (GHL-specific).** GHL customers are a mix of agencies AND direct business owners. Default to universal framing ("your team," "your customers," "deal momentum") unless topic literally names an audience (e.g., "Indian Agencies" page is agency-by-design). Never default to "your agency" when "your team" works.

2. **The don't-rewrite rule.** If current title already has verb + number + specificity (e.g. "Enroll 1000+ Contacts in 60 Seconds"), LEAVE IT. Score on the 4 tests — if it passes ≥ 3, use the slot on a weaker page.

3. **Cliché banlist** (proven dead on this site):
   - **Openers:** `Learn how to...`, `How to [verb]...`, `Master...`
   - **Phrases:** `step-by-step guide`, `no coding required`, `start today`, `leverage`, `unlimited flexibility`, `tailored solutions`
   - **Adjectives:** `ultimate`, `complete`, `comprehensive`

4. **Mirror article pain.** Strongest pattern observed (4 of 5 shipped): pull 2-3 phrases from article's opening paragraph into the meta. "drowning in customer inquiries," "burnt-out team," "9 PM spreadsheets," "hit a wall," "scattered notes."

5. **Specificity beats cleverness.** Listing "Gemini, Claude, GPT, Voice AI" or "properties, policies, patient records" outperforms "flexible AI tools." Most specific nouns win the click.

6. **Article's own numbers are gold.** "8-10 clients," "10 per location," "1000+ contacts," "60 seconds" — if article has a number, put it in title or meta. Numbers break up a SERP list.

7. **Long-tail magnets.** 3-4 specific industries/tools/records in one title catches every long-tail variant. One title can match "gohighlevel gemini pricing" AND "ghl voice ai cost" simultaneously.

8. **Character limits are hard gates.** Title > 65 = Google truncates. Meta > 160 = Google truncates. Assert before writing. No exceptions.

9. **Cannibalization flag.** If slug shares ≥ 3 major tokens with another ranking slug, FLAG in Change Type column as `Meta rewrite — FLAG: cannibalization cluster`. Rewriting one twin while the other steals queries = wasted work. Route to `/site-structure-check` (future skill) for consolidation review.

10. **"How to" titles usually weak.** Most common SERP pattern on this niche. If yours looks like "How to Use X in Y," rewrite. Exception: target query literally is "how to X" and intent is pure tutorial.

## After each session involving this skill

1. Did we ship a rewrite that violated a rule above? → Tighten or add a rule.
2. Did the user correct framing/audience? → Update rule 1.
3. Did `/measure-seo-change` flag a rollback (HURT verdict)? → Read its Sheet `Outcome` and lever data, post-mortem: which lever failed, update lever scoring rules above.
4. Did `/measure-seo-change` auto-append a new rule below this section? → Review next session, prune if wrong.
5. Sheet write failed > 1 time? → Check `tracking_sheet_id` in business YAML, check MCP auth, surface to user.

Write rule updates directly into this file (above). Commit the diff. The skill compounds.
