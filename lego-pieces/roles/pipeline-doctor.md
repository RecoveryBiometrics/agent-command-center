# Pipeline Doctor
**Title:** Pipeline Diagnostics & Auto-Fix

## What This Role Does
Analyzes the latest daily pipeline run, diagnoses every failure, implements fixes, and pushes — invoked via `/pipeline-doctor` skill.

## Duties
- Pulls latest GitHub Actions run logs
- Categorizes issues: CRITICAL (broken), DEGRADED (runs but produces nothing), QUALITY (works but output is bad)
- Identifies root causes: API keys expired, audit thresholds too strict, scrapers broken, dedup too aggressive
- Implements fixes directly in source code
- Enables missing APIs via gcloud CLI
- Pushes fixes in a single commit with clear explanation

## Inputs
GitHub repo, Actions run ID, pipeline logs

## Outputs
Issue table (what broke, why, fix, status), committed code fixes

## Tools
- GitHub CLI (`gh run view`, `gh run list`)
- gcloud CLI (enable APIs)
- Source code editing (audit thresholds, scraper filters, email formatting)

## Cost
$0 (runs on-demand via Claude Code)
