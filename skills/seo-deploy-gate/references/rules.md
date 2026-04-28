# SEO Deploy Gate — The 8 Rules

Every rule has: **threshold**, **severity**, **how to check**, **why it exists**.

Severity contract: `PASS` = green, `WARN` = yellow (deploy allowed but logged), `BLOCK` = red (deploy halted unless `--force`).

---

## Rule 1: 8-Week Rule

**Check:** For every URL or area touched by this deploy, query the tracker sheet for rows where the same URL/area was changed. If any row has `Date` less than 56 days before today AND the current change would reverse/conflict with that row, fail.

**Severity:** BLOCK

**Threshold:** 56 days (8 weeks)

**How to implement:**
- Parse `git diff --name-only HEAD origin/main` to get affected files
- Map files to URLs (e.g., `src/app/[location]/[service]/page.tsx` → all city/service combo URLs)
- For each affected URL, search tracker tab rows where `URLs Affected` column contains the URL
- Compare dates: if latest matching row < 56 days ago AND current change is structural, BLOCK

**Why:** Google needs 8+ weeks to evaluate most SEO changes. Reversing early means you never learn if the change worked, and the rapid churn itself is a negative signal.

**Example of failure (real, 2026-04-10):**
- NV/SC pages added 2026-03-13
- Removed 2026-04-10 (only 4 weeks later)
- Violated this rule

**Exception:** Quality fixes (Rule 6) bypass this rule.

---

## Rule 2: Internal Link Audit

**Check:** If deploy includes route changes, redirect additions, or file deletions in `src/app/`, run a full grep across the repo for internal links pointing to any removed URL pattern. Any found references = BLOCK.

**Severity:** BLOCK

**Threshold:** Zero broken internal links allowed.

**How to implement:**
- Detect structural change: any change to `next.config.ts` redirects, any deletion under `src/app/`, any change to `generateStaticParams()` that reduces paths
- If structural: for each removed URL pattern, run `rg "href.*{pattern}"` across `src/`, `components/`
- Any hit = BLOCK with file:line list

**Why:** Removing a page without cleaning up internal links means users hit 301 chains that land on wrong-context pages, killing UX even if SEO technically works.

**Example of failure (real, 2026-04-10):**
- 18+ internal links across `src/app/[location]/page.tsx`, `DowningtownGrabBarContent.tsx`, `grab-bar-installation/page.tsx`, `local-news/[slug]/page.tsx` still pointed to removed city-service URLs
- All silently redirected, dumped users on wrong pages

**Exception:** If every broken link is explicitly updated to point to a new destination in the same commit, PASS.

---

## Rule 3: Strategic Intent Check

**Check:** For any URL being removed (via constants.ts changes or redirect additions), query tracker for when it was added. If added <56 days ago AND removal reason is "thin content" or "no clicks," BLOCK.

**Severity:** BLOCK

**Threshold:** Added less than 56 days ago.

**How to implement:**
- Identify URLs being removed (lost from `generateStaticParams()` or gaining redirect rules in `next.config.ts`)
- Query tracker for the earliest row that added those URLs
- If earliest row < 56 days ago, BLOCK with message: "URL was added <8 weeks ago. 'New market entry' ≠ 'thin content'. Reconsider."

**Why:** New pages haven't had time to rank yet. Google needs ~8 weeks to evaluate. Killing new pages as "thin content" discards strategic intent.

**Example of failure (real, 2026-04-10):**
- Clark County NV + Horry County SC added 2026-03-13 as strategic market expansion
- Removed 2026-04-10 classified as "thin pages with low clicks"
- They were 4 weeks old — they hadn't had time to rank

**Override:** `--confirm-new-market-removal` flag acknowledges the risk and allows removal.

---

## Rule 4: UX Preview Verification

**Check:** For any deploy with structural changes, the deployer must have verified the change on a Vercel preview URL before pushing to main.

**Severity:** WARN (not BLOCK because gate can't actually verify a human looked at a preview)

**How to implement:**
- If structural change detected (per Rule 2 criteria): check git branch
- If current branch is `main` and change is structural, WARN: "Structural change detected — confirm you verified this on Vercel preview before merging"
- Log to incident-log.md regardless

**Why:** The April 10 deploy skipped preview verification. A human clicking through city-service pages on the preview would have caught "Professional Professional" in H1, broken service links, and the redirect chains.

---

## Rule 5: Atomic Deploy Size

**Check:** Count files modified and redirect rules added in the current change.

**Severity:** WARN

**Threshold:**
- Files modified: >100 → WARN
- Redirect rules added in `next.config.ts`: >50 → WARN
- Both: BLOCK unless `--confirm-large-deploy`

**How to implement:**
- `git diff --name-only HEAD origin/main | wc -l`
- Parse `next.config.ts` diff for added `{ source: ..., destination: ..., permanent: ... }` blocks

**Why:** Large deploys have large blast radius. When something goes wrong, bisecting is hard. Better to ship structural changes in 3-5 smaller deploys than one mega-deploy.

**Example of failure (real, 2026-04-10):**
- 5 files changed (manageable)
- 80+ redirect rules added in single commit (huge)
- Revert was all-or-nothing; couldn't keep quality fixes while reverting structure

---

## Rule 6: Quality Fix Carve-Out

**Check:** If the change ONLY modifies content (no routing, no redirects, no constants.ts, no sitemap.ts), allow PASS regardless of other rules.

**Severity:** PASS (never fails)

**How to implement:**
- Get list of changed files
- If ALL changed files are: markdown, text content in JSX components, FAQ data, service descriptions
- AND NONE are: `next.config.ts`, `src/lib/constants.ts`, `sitemap.ts`, files under `src/app/` that change routes
- Then return PASS early, skip rules 1-5 and 8

**Why:** Content quality fixes (typos, broken template variables, keyword stuffing cleanup) are always safe to ship. They help the site on the next crawl. Blocking these for "8-week rule" reasons would paralyze content improvements.

---

## Rule 7: Tracker Logging

**Check:** Every deploy must result in a row added to the tracker sheet.

**Severity:** BLOCK

**How to implement:**
- Stage 03-report ALWAYS writes a row to `{business}_SEO Safeguard` tab (auto-creates if missing)
- Row fields: Date, Severity, Business, Summary, Rules Fired, Exit Code, Commit SHA
- If sheet write fails (auth, network, etc.), BLOCK the deploy — don't let undocumented changes ship

**Why:** Undocumented changes compound. Six months from now, if a page is ranking weird, we need to know what happened when. The tracker is the only durable record.

---

## Rule 8: Active Evaluation Window

**Check:** Count how many rows in the tracker have status "Pending" or "Deployed — monitoring" AND affect overlapping URL patterns.

**Severity:** WARN

**Threshold:** More than 2 overlapping active changes.

**How to implement:**
- Query tracker for active rows (status contains "Pending" or "Deployed — monitoring")
- For each active row, extract URL patterns from `URLs Affected` column
- Count overlaps with current change's affected URLs
- If overlap count >2, WARN

**Why:** If 3+ changes are already in flight on the same area, adding a 4th makes the data unreadable. You can't tell which change caused a rank shift. Better to wait for existing changes to stabilize.

**Example:**
- March 11: new city pages (status: Pending)
- March 12: internal linking fix (status: Pending)
- April 2: www redirect (status: Deployed — monitoring)
- All three affect site-wide. A 4th structural change = too much noise.

---

## Rule evolution

This file is git-tracked. When a new failure mode emerges:
1. Document it in `incident-log.md`
2. Add a new rule here (or tighten an existing threshold)
3. Implement in `lib/check-{rule-name}.js`

Rules should be easy to reason about, auditable, and tunable without code changes.

---

## Rule 9: Findability — Attribution-URL Protection + LLM Discoverability

**Check:** Four sub-checks:
1. If a URL is in `robots.txt Disallow` AND the page has >500 words or rich schema (FAQPage, Offer, Product, etc.), BLOCK — unless the URL is in the `KNOWN_ATTRIBUTION_PATHS` allowlist (documented intentional Disallows like `/trial/`, `/coupon/`, `/start/`).
2. `robots.txt` must explicitly Allow GPTBot, ClaudeBot, Google-Extended, PerplexityBot. Missing any = BLOCK.
3. `/llms.txt` must exist and be <30 days old. Missing = WARN, stale = WARN.
4. (Future) Money pages missing Offer/Product schema = WARN.

**Severity:** BLOCK (checks 1-2), WARN (checks 3-4)

**How to implement:**
- Parse `robots.txt` for Disallow rules under `User-agent: *`
- For each Disallowed path, read the built HTML, count words, check for rich schema types
- Compare against `KNOWN_ATTRIBUTION_PATHS` — documented exceptions don't trigger
- Check each required AI crawler has its own `User-agent:` block with `Allow: /`
- Stat `/llms.txt` for existence and mtime

**Why:** The April 2026 `/trial/` incident — 1,900 words of SEO content + Offer + FAQPage schema behind a `Disallow`, wasting weeks of optimization work. Attribution URLs are intentionally Disallowed (podcast/blog CTA tracking), but the gate had no way to distinguish "intentional attribution Disallow" from "accidental SEO page behind Disallow." This rule makes the distinction explicit.

**Example of what it catches:**
- New page `/pricing-test/` with 1,200 words + Product schema, accidentally added to `robots.txt Disallow` → BLOCK
- Someone removes `GPTBot` Allow from robots.txt → BLOCK
- `/llms.txt` stops being regenerated after a build.py refactor → WARN after 30 days

**Adding new attribution paths:** If a new intentionally-Disallowed content page is created, add its path to `KNOWN_ATTRIBUTION_PATHS` in `lib/check-findability.js` AND document it in `globalhighlevel-site/CLAUDE.md`.
