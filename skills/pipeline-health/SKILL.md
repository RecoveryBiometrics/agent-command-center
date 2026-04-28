---
name: Pipeline Health
description: Proactive alignment check between VPS (content generator), GitHub origin (source of truth), and Cloudflare (live site). Catches stranded content, divergent VPS, and missing deploys BEFORE they cause incidents.
invocation: /pipeline-health
when_to_use: Daily sanity check, or immediately after any manual intervention on VPS or origin. Run this when you suspect the site is stale, when VPS deploys have been silent too long, or when new content isn't showing up on globalhighlevel.com.
user-invocable: true
---

# Pipeline Health

Answers one question: **"Is what's on the live site what I think is on the live site?"**

Built after the 2026-04-10 incident where VPS silently stopped pushing for 5 days — 913 posts piled up locally on VPS while everyone assumed the daily pipeline was shipping content. Pipeline Doctor only runs when someone notices something wrong. This skill runs proactively and alerts before anyone notices.

## Checks (all run, independent)

| # | Check | Failure severity |
|---|-------|------------------|
| 1 | **VPS ↔ origin sync** — `git rev-parse HEAD` on both sides, report if diverged | BLOCK if VPS has N unpushed commits OR is N behind origin |
| 2 | **VPS working tree clean** — `git status --porcelain` should be empty (barring known-untracked) | WARN if dirty |
| 3 | **Cloudflare served ↔ origin** — curl `/sitemap.xml`, count `<url>` entries, compare to expected | WARN if mismatch >5% |
| 4 | **Language hub metas** — curl `/es/`, `/ar/`, `/in/`, verify meta description language matches URL | BLOCK if mismatch (site shipping with wrong-lang snippets) |
| 5 | **Deploy log silence** — VPS pipeline log should have an `Auto-deploy` line in last 48h | WARN if no push in 48h |

## Usage

```
/pipeline-health                        # run all checks, report findings
/pipeline-health --alert                # also post failures to #ops-log Slack
```

Or from code / cron:
```bash
node ~/.claude/skills/pipeline-health/run.js --alert
# Exit codes: 0 = all pass, 1 = warn, 2 = block
```

## Stages

1. **Load** — SSH to VPS, fetch origin state, identify expected post count from local repo
2. **Check** — Run 5 checks, accumulate findings
3. **Report** — Print findings table; if `--alert` and any failure, post to #ops-log
4. **Auto-remediate** — If verdict is BLOCK, invoke `/pipeline-doctor` as the final step, passing the BLOCK details (which check failed, observed vs expected state, affected URLs/paths). Do NOT exit before doctor runs. If doctor cannot fix it, doctor itself will escalate to #ceo. The chain is: detect → fix → escalate, all in one invocation.

## When NOT to use

- **Right after a deploy you just ran** — Cloudflare build takes 1-3 min; check 5 would false-alarm. Wait 5 min or run without `--alert`.
- **During a known divergence window** — e.g., if you've deliberately paused VPS deploys, this skill will complain.

## Cross-skill relationship

- **Owns** `/pipeline-doctor` invocation on BLOCK verdicts (Stage 4 above). Detect → fix is one chain, not two separate human-summoned skills.
- Uses the same VPS SSH credentials and paths documented in `pipeline-doctor/SKILL.md`.
- Fires into `#ops-log` (same channel as `scheduler.py deploy_site()` failures), so one channel tells the full story.

## Self-improving rules

- **2026-04-27** — Detection without execution is just noise. /ar/ 404 was flagged Apr 16, /es/ 404 was flagged Apr 22, both stayed broken until Apr 27 because a human had to manually summon /pipeline-doctor. Stage 4 (auto-remediate) added so BLOCK verdicts trigger the fix in the same invocation.
- After every session: if a BLOCK was reported but no fix attempted, that's a Stage 4 bug — investigate why doctor wasn't invoked.

## References

- Incident log: see git commit `ce0e7a2` (Apr 15 2026) — the Apr 10-14 stranded-content incident that motivated this skill.
- Auto-remediation incident: SEO Changelog Sheet rows 27-29 (Apr 27, 2026) — `/es/`, `/in/`, `/ar/` 404 regression that took 9 days to fix manually before Stage 4 existed.
- VPS architecture: `/Users/kerapassante/Developer/projects/marketing/podcast-pipeline/CLAUDE.md`
