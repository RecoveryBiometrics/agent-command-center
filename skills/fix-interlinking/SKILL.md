---
name: fix-interlinking
version: 1.0.0
description: "Manages the internal link graph on any content site — concentrate juice on money pages, build hub-and-spoke clusters, rescue orphan pages, clean broken links, diversify spammy anchor patterns, refresh related-posts blocks. ONE verb (mutate the link graph) with multiple strategies as parameters. Calls /measure-seo-change after shipping a strategy. Replaces ad-hoc retrofit scripts."
invocation: /fix-interlinking
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
triggers:
  - fix interlinking
  - retrofit internal links
  - link juice
  - concentrate links on money page
  - rescue orphan pages
  - hub and spoke
  - clean broken internal links
  - diversify anchor text
  - update related posts
---

# /fix-interlinking — Manage the internal link graph

This skill is the **mutation half** of internal-link work. Every operation that adds, removes, retargets, or rebalances internal links runs through here. Read-only counts (audit) live in `scripts/audit.py` — used internally by this skill and by `/measure-seo-change` as a helper.

**One verb:** mutate the link graph. **Multiple strategies** as parameters — each strategy is a distinct playbook for a specific link-graph problem.

**Not in this skill:** measuring whether a change worked. That's `/measure-seo-change`. After a mutation ships, this skill logs to the SEO Changelog Sheet and `/measure-seo-change` picks it up at day 28.

## The rule

Every internal link should answer: *who is the target audience for this page, and why should a reader on the source page care?* If the link doesn't survive that test, don't add it. The link graph is editorial, not mechanical.

## Invocation (parameterized)

```
/fix-interlinking --strategy money-juice --target <url>           # concentrate inbound links on a money page
/fix-interlinking --strategy hub-spoke --hub <url>                # bidirectional hub ↔ child pages
/fix-interlinking --strategy orphan-rescue                        # find pages with 0 inbound, adopt them
/fix-interlinking --strategy broken-link-cleanup                  # find + fix dead internal links
/fix-interlinking --strategy anchor-diversify --target <url>      # spread overconcentrated anchor text
/fix-interlinking --strategy related-posts-refresh                # rebuild "you might also like" blocks
/fix-interlinking --diagnose                                      # no strategy → run audit, recommend strategy
```

Site is auto-detected from the working directory (project CLAUDE.md → site config). Override with `--site <id>`.

## Phase 0 — Load context (resolver)

Before any mutation, read in order:
1. **Project CLAUDE.md** — which site, which money pages, which directories hold posts
2. **`~/.claude/projects/<project>/memory/project_money_pages.md`** — designated money pages, what they consolidate
3. **`references/strategies.md`** (this skill) — the playbook for each strategy
4. **`references/seo-deploy-gate-contract.md`** (this skill) — what the deploy gate expects
5. Run `scripts/audit.py --site <id>` to get current link-graph state

If `project_money_pages.md` doesn't exist for the active project, **STOP** and ask the user to designate money pages before mutating anything.

## Phase 1 — Diagnose (when --diagnose, or no strategy specified)

**Issue:** User said "fix the interlinking" without saying which problem. The skill picks.

**Mechanism:** Run `scripts/audit.py --diagnose --site <id>`. The script returns a ranked list of issues:
- Money pages with <50 inbound links
- Pages with 0 inbound links (orphans)
- Pages where one anchor text is >70% of all inbound anchors
- Internal links pointing to 301/404 URLs
- Pages with no related-posts block (or stale block)

**Action:** Print the top 3 issues and recommend a strategy for each. Ask the user to pick.

## Phase 2 — Strategy execution

Each strategy is a separate sub-section. Pick the one that matches the user's `--strategy`. Each calls a deterministic script in `scripts/`.

### 2a. money-juice — concentrate inbound links on a money page

**When to use:** Money page exists (per `project_money_pages.md`) but has <50 inbound internal links and is buried at position >15 despite buyer-intent demand.

**Issue:** Google can't tell the page is important; nothing on the site treats it as important.

**Mechanism:** `scripts/money-juice.py --site <id> --target <url> [--dry-run | --apply]`. The script:
1. Loads all posts for the site, filters by language (target's language)
2. Skips posts that already link to the target
3. Skips the target page itself
4. For each candidate, scans `html_content` for trigger phrases (defined in `references/triggers/<target-slug>.json`) — body text only, not headings, not inside existing `<a>` tags
5. Inserts ONE contextual link with anchor text rotated from a curated list (5+ phrasings to avoid spam patterns)
6. Writes the updated JSON, preserving original encoding

**Trigger + anchor config lives in JSON, NOT hardcoded:** `references/triggers/<target-slug>.json` defines the trigger phrases and anchor text rotation per target. New money page = add one JSON file, no script edit.

**Output:** Single-line JSON summary `{"strategy": "money-juice", "target": "...", "edited": N, "skipped": {...}, "anchors": {...}}`.

**Action after script returns:**
- Log to SEO Changelog Sheet via MCP (one row per target page, Action = `internal_link_retrofit`)
- Run `/seo-deploy-gate` before push
- Commit + push (ask user)

**Verification:** Re-run `scripts/audit.py --target <url>` to confirm new inbound count. Log discrepancy if expected vs actual differs by >5%.

### 2b. hub-spoke — bidirectional hub ↔ child pages

**When to use:** New hub page (e.g., `/for/marketing-agencies/`) just published OR existing hub has <30 children linking to it.

**Issue:** Hub page needs strong internal links FROM relevant children, AND should link TO each relevant child. Bidirectional creates a cluster Google recognizes as a topical authority.

**Mechanism:** `scripts/hub-spoke.py --site <id> --hub <url> [--children-glob <pattern>] [--dry-run | --apply]`.

**STATUS:** STUB. Today this script is a placeholder. Implementation pending — first usage triggers build. See `references/strategies.md` for the playbook.

### 2c. orphan-rescue — adopt pages with 0 inbound links

**When to use:** `audit.py --diagnose` flagged orphan pages (0 inbound).

**Issue:** Pages with no inbound links are invisible to Google's crawler beyond sitemap discovery, and pass no PageRank to anything. Wasted authority.

**Mechanism:** `scripts/orphan-rescue.py --site <id> [--dry-run | --apply]`.

**STATUS:** STUB. Implementation pending.

### 2d. broken-link-cleanup — fix dead internal links

**When to use:** Audit flagged internal links pointing to URLs that 301 or 404. Common after a consolidation event (today's master/pricing consolidation 301'd 7 URLs).

**Issue:** Internal links to redirected URLs leak link equity (1-step PageRank loss per Google) AND create extra crawl hops. Internal links to 404s are pure waste.

**Mechanism:** `scripts/broken-link-cleanup.py --site <id> [--dry-run | --apply]`.

**STATUS:** STUB. Implementation pending. **High priority** — today's consolidation may have left some stale `/coupon`, `/promo`, `/start` links in older posts that should be retargeted directly to the master.

### 2e. anchor-diversify — spread overconcentrated anchor text

**When to use:** Audit flagged a target page where one anchor text is >70% of all inbound anchors. Spam pattern signal.

**Mechanism:** `scripts/anchor-diversify.py --site <id> --target <url> [--dry-run | --apply]`.

**STATUS:** STUB. Implementation pending.

### 2f. related-posts-refresh — rebuild "you might also like" blocks

**When to use:** Posts have stale or missing related-posts blocks; new posts have published since the last refresh.

**Mechanism:** `scripts/related-posts-refresh.py --site <id> [--dry-run | --apply]`.

**STATUS:** STUB. Implementation pending.

## Phase 3 — Log + gate + ship

After ANY mutation strategy runs with `--apply`:

1. **Log to SEO Changelog Sheet** via MCP (`mcp__google-workspace__modify_sheet_values`):
   - `Action`: matches the strategy (`internal_link_retrofit`, `hub_spoke_buildout`, `orphan_rescue`, `broken_link_cleanup`, `anchor_diversify`, `related_posts_refresh`)
   - `Position (before)` / `Impressions (before)` / `CTR % (before)`: pulled from current GSC for the affected target page (so `/measure-seo-change` has a baseline 28 days from now)
   - `Old Title` / `New Title` / `Old Description` / `New Description`: leave blank (this skill doesn't touch metadata)
   - `Words Added`: number of links added (or removed, as negative)

2. **Run `/seo-deploy-gate`** with the active business config. Block on any rule violation.

3. **Commit with a descriptive message** including strategy name, target, count of changes, and a 1-line "why."

4. **Ask the user before push.** This skill never auto-pushes.

## Persistent state

```
state/
  last-run-<strategy>.json    — for each strategy, when it last ran + summary
  link-graph-snapshot.json    — periodic full audit dump for diff comparisons over time
```

`audit.py` writes to `link-graph-snapshot.json` so successive runs can compute deltas without re-scanning every time.

## Self-improving rules

After every strategy run:

1. **Did `scripts/audit.py --target <url>` show fewer added links than expected after `--apply`?** → Investigate the trigger phrases — maybe too narrow, missed valid contexts. Update `references/triggers/<target-slug>.json`.

2. **Did `/measure-seo-change` later judge this run a `loss`?** → Read the failure mode (anchor text too concentrated? wrong target?). Append to `references/strategies.md` as a "what NOT to do."

3. **Did the user manually adjust some inserted links after the run?** → Their adjustments are signal. Diff the post JSONs, infer the pattern, append to the strategy's playbook.

4. **Did `--diagnose` recommend a strategy that turned out wrong?** → Tighten the diagnostic threshold in `scripts/audit.py --diagnose`.

Write new rules directly into this SKILL.md or the relevant reference file.
