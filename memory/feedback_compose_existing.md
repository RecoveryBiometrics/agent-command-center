---
name: Compose with existing pipeline agents
description: New skills must use existing researchers, fact-checkers, copywriters, and SEO auditors — never bypass them to do the work directly
type: feedback
---

When building new skills that create content or modify pages, ALWAYS compose with existing pipeline agents (researcher, fact-checker, copywriter, seo-audit, engineer). Don't build skills that do the writing/auditing themselves.

**Why:** The existing agents enforce quality — fact-checking, similarity thresholds, SEO validation, phone number routing, brand voice. Bypassing them means bypassing quality controls. The user explicitly does not trust skills that skip these.

**How to apply:** Before designing any new skill, read the existing pipeline scripts in `~/Projects/agent-command-center/pipelines/` and identify which agents already handle parts of the job. The new skill should orchestrate those agents, not replace them.
