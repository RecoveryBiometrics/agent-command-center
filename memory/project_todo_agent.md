---
name: TODO Agent Skill
description: /todo-agent skill reads Active TODOs from business Google Sheet and executes agent-handleable items (SEO optimization, new pages, drop investigation, analytics dispatch)
type: project
---

## Status: BUILT

Skill file: `~/.claude/skills/todo-agent/SKILL.md`
Repo backup: `~/Projects/agent-command-center/skills/todo-agent/SKILL.md`

## What it does

Reads "Active TODOs" tab from a business's tracking sheet, classifies each item, and executes agent-handleable ones:

- **SEO Opportunity** — optimize title, meta, add internal links to existing pages
- **SEO Gap** — create new pages targeting keywords with no coverage
- **SEO Investigate** — diagnose ranking drops, fix if possible, else mark Monitoring
- **Analytics** — dispatch instructions to other pipelines via Dispatch tab

Updates Sheet status after each item, commits changes to a PR branch, posts summary to Slack.

## Invocation

- `/todo-agent safebath` — run for SafeBath
- `/todo-agent` — run for all businesses with tracking_sheet_id
- `/todo-agent safebath --dry` — preview without executing

## Architecture decision

**Why:** Built as a Claude Code skill (not a pipeline) because it needs interactive judgment for investigations and code modifications. A pipeline can't read/edit arbitrary source files or create contextual internal links. The skill runs manually when the user is ready to process TODOs, with the option to wire into a trigger later for the safe automated subset.
