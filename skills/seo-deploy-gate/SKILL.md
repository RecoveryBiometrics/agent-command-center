---
description: Pre-deploy safety gate for SEO changes. Runs 9 rules and returns pass/warn/block before any SEO change ships. ICM-structured with staged context loading.
invocation: /seo-deploy-gate
when_to_use: BEFORE any SEO deploy. Required before pushing changes that touch routes, redirects, sitemaps, constants.ts (city/county data), service pages, or any file that affects how Google sees the site. Required for manual deploys AND automated pipelines.
---

# SEO Deploy Gate

Safety gate that every SEO change must pass before hitting production. One skill for all businesses — reads their YAML config to know which tracker, which Slack channel, which repo.

**This skill exists because on 2026-04-10 a SafeBath restructure shipped that:**
- Reverted a 4-week-old change (violated 8-week rule)
- Broke 18+ internal links (no link audit)
- Confused "new market entry" with "thin content" (killed NV/SC prematurely)
- Deployed 80+ redirect rules in a single commit (no deploy size check)

The rules in this skill encode those lessons. Read `references/incident-log.md` for the full case file.

## Usage

```
/seo-deploy-gate safebath "Restructure: remove 680 city-service pages"
/seo-deploy-gate ghl "Add new podcast category pages"
/seo-deploy-gate safebath --force "Emergency: revert broken deploy"   # Override, logs loudly
```

Or from code:
```bash
node ~/.claude/skills/seo-deploy-gate/run.js \
  --business safebath \
  --summary "Restructure: remove 680 city-service pages"

# Exit codes: 0 = pass, 1 = warn (deploy allowed), 2 = block (halt)
```

## Stages

Run sequentially. Each has its own CONTEXT.md with inputs/process/outputs.

1. **01-load** — Read business YAML, detect change set via `git diff`, classify change type
2. **02-check** — Run all 8 rules, accumulate findings, determine severity
3. **03-report** — Log to tracker sheet, alert Slack if warn/block, return exit code

## The 8 Rules (enforced in stage 02)

See `references/rules.md` for full thresholds. Short version:

| # | Rule | Severity on failure |
|---|------|---------------------|
| 1 | **8-week rule** — no reversing changes <8 weeks old | BLOCK |
| 2 | **Link audit** — structural changes must not break internal links | BLOCK |
| 3 | **Strategic intent** — don't kill pages <8 weeks old as "thin" | BLOCK |
| 4 | **UX preview** — preview must be verified for structural changes | WARN |
| 5 | **Atomic deploy size** — >100 files or >50 redirects needs override | WARN |
| 6 | **Quality fix carve-out** — pure content fixes always PASS | PASS |
| 7 | **Tracker logging** — every deploy must log a tracker row | BLOCK |
| 8 | **Active eval window** — >2 active changes in same area | WARN |

## References (Layer 3 — stable, shared)

- `references/rules.md` — Full rule definitions, thresholds, examples
- `references/incident-log.md` — Failure history (starts with 2026-04-10)
- `references/exit-codes.md` — Contract for pipelines calling this skill

## Config

Each business has a YAML at `~/Projects/agent-command-center/businesses/{id}.yaml` with:
- `tracking_sheet_id` — tracker sheet for logging gate runs
- `slack.business_channel` — where warn/block alerts go
- `org.path` — repo path for git diff analysis
- `org.github` — for branch/commit context
- `seo.gsc_site_url` — for GSC context (optional, used by some rules)

## Adding a new business

1. Business YAML must have `tracking_sheet_id`, `slack.business_channel`, `org.path`
2. Add a "SEO Safeguard" tab to the tracker sheet (auto-created on first run)
3. That's it — skill auto-discovers

## Design principles

- **Advisory by default.** Skill returns exit codes; pipelines decide how to react.
- **Versioned rules.** `references/rules.md` is git-tracked; thresholds tunable over time.
- **Institutional memory.** `references/incident-log.md` grows with every block/warn. Future agents read past failures.
- **Zero ambient token cost.** No memory files created. Skill loads only when invoked.
- **Override exists.** `--force` flag for true emergencies; logs loudly with reason.

## Integration

Pipelines must call the gate before their deploy step:
```javascript
const { runGate } = require('~/.claude/skills/seo-deploy-gate/lib/run');
const result = await runGate({ businessId: config.id, summary });
if (result.exitCode === 2) throw new Error(`Gate blocked: ${result.findings}`);
if (result.exitCode === 1) logger.warn(`Gate warned: ${result.findings}`);
// Proceed with deploy
```

Agents (Claude sessions) must run `/seo-deploy-gate` before any `git push origin main` on SEO repos.
