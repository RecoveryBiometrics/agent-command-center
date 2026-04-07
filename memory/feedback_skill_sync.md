---
name: Skill Sync Rule — Skills First Architecture
description: Everything built must be a reusable skill FIRST. No baking logic into triggers, pipelines, or one-off scripts without a skill wrapper.
type: feedback
---

## Rule 1: Skills First
Every new capability MUST be built as a skill first. Not after the fact — from the start. If it does something useful, it's a skill. This includes:
- New agents or pipeline steps
- Reporting tasks (CEO briefing, content monitor, etc.)
- Any reusable logic that a trigger, pipeline, or manual invocation might need

**Why:** The user's architecture is "build once, use everywhere." If logic gets baked directly into a trigger prompt or a one-off script, it can't be reused, improved centrally, or invoked manually. This happened during the 2026-04-07 trigger build — CEO briefing got shoved into Pipeline Doctor instead of being its own skill. The user caught it and said "anything we build has to be a skill."

**How to apply:** When building anything new, ask: "Should this be a skill?" If it does something a human might want to invoke OR that multiple triggers/pipelines might reference, the answer is yes. Create the skill in `~/.claude/skills/` FIRST, then wire it into whatever trigger or pipeline needs it.

## Rule 2: Skill Sync on Changes
Any time a script, agent, or pipeline file is created, renamed, or deleted, the matching skill in `~/.claude/skills/` MUST be updated in the same session.

**Why:** Skills are the instruction manual for future sessions. If a script exists but isn't in a skill, it's invisible. The user spent a full day auditing and fixing this gap on 2026-04-06 — 5 duplicate skill files were found, podcast pipeline skill was missing 40% of its scripts.

**How to apply:** Before ending any session where code was added/changed, check if a skill references that code. If not, update it. This rule is also enforced in `~/Projects/CLAUDE.md`.
