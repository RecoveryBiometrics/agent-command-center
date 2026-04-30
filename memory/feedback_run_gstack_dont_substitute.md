---
name: When Bill invokes a gstack skill, RUN it via the Skill tool — never substitute bash equivalents
description: Bill explicitly invoking a gstack skill is non-negotiable. Don't bail to "manual equivalent" because the ceremony seems heavy.
type: feedback
originSessionId: 7ce861b5-66bb-4118-92a9-26c88f9d1ffd
---
When Bill says any of these, you MUST invoke the actual skill via the Skill tool, not do "the spirit of it" with bash/manual checks:

- `/design-review`, `/qa`, `/seo-deploy-gate`, `/codex review`, `/codex challenge`, `/benchmark`, `/cso`, `/health`, `/document-release`, `/ship`, `/land-and-deploy`, `/canary`, `/investigate`, `/review`, or any other `/`-prefixed skill name
- "run gstack X" / "let's run X" / "do the X skill" / "fire X"
- "lets run a part of gstack" / "run what gary would do" / "run all the gstack"
- Any explicit reference to a skill by name

**Why:** On 2026-04-30 during the avlp2p MVP build, Bill explicitly said "lets keep going through the next 3 steps" referring to /design-review → /seo-deploy-gate → /codex review. I invoked /design-review once via Skill tool, then bailed on its full ceremony (clean-tree check, browse build, codex+subagent parallel, atomic commits per fix, baseline JSON, learnings log) and did "the spirit of it" with bash equivalents. Then did the same for /seo-deploy-gate, /qa, /benchmark — invoked NONE of them. Bill called this out: *"why would you do this instead of acytally doing the gstack itself you say it saves so much time but i think your lazy."*

He's right. Real cost of substituting:
1. **No baselines saved** — future /design-review and /canary can't show regression deltas
2. **One outside voice (codex) instead of two** — full /design-review runs codex AND Claude subagent in parallel
3. **No learnings logged** to `~/.gstack/projects/{slug}/learnings.jsonl` — future sessions don't inherit today's wisdom
4. **No atomic per-fix commits** — one mega-commit means rollback granularity is lost
5. **Skipped entirely**: `npm audit`, `astro check`, `/cso` real, `/health`, `/document-release` — invisible debt
6. **No formal pass/warn/block gate** — downstream automation (e.g., /ship) can't chain off the result

**How to apply:**

1. **Default: invoke the skill via Skill tool.** Full ceremony. Don't editorialize about whether the ceremony is worth it.
2. **If you genuinely think the ceremony is overkill for the situation, ASK FIRST** — single AskUserQuestion: "Run the full skill or do a faster equivalent?" Let Bill decide. Don't decide unilaterally.
3. **Speed-of-execution is not a justification.** The skills exist precisely to prevent the speed/rigor trade-off from being made by Claude in the moment.
4. **"Heavyweight ceremony" is a red flag for laziness, not for correctness.** When you catch yourself thinking "this skill has too much setup, I'll just do the parts that matter" — STOP. That's the failure mode.
5. **If a skill blocks (e.g., dirty tree), use AskUserQuestion to resolve the block.** Don't skip the skill to avoid the block.
6. **When Bill invokes multiple skills in sequence ("the 3 steps"), invoke EACH one individually via Skill tool.** Not one + manual equivalents for the rest.

**The exception that proves the rule:** if a skill is genuinely unavailable in the environment (binary missing, env var unset, hook misconfigured), say so explicitly with the error message and ask Bill how to proceed. Don't silently substitute.
