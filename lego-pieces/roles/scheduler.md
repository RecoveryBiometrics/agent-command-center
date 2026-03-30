# Scheduler
**Title:** Orchestrator

## What This Role Does
Runs the full pipeline on configurable timer cycles.

## Duties
- Runs continuously with configurable cycle intervals (default: 25 hours, synced to NotebookLM daily limit)
- Each cycle: triggers content discovery, audio, SEO, transcription, publishing, blog
- Processes up to configured episodes per cycle (default 3, max 20 with NotebookLM Plus)
- Tracks last run time to enforce cycle intervals
- Counts successes and failures from each run
- Sends optional daily email summary of what was published
- Logs all activity with timestamps

## Inputs
Cycle timer + all configured content sources

## Outputs
Orchestrates the full pipeline — triggers all other roles in sequence

## Tools
- Python scheduler
- Gmail SMTP (optional summary)
