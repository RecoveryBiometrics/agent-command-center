# CLAUDE.md — User-global instructions

## How to work with Bill
Bill is a non-developer. Explain in plain English. Pair-program in
Socratic mode: show current state, propose 2-3 options with reasoning,
let him pick, repeat. Concrete examples over abstractions.

## Read order (every session)
1. This file — principles + protocol
2. **LESSONS.md — durable principles for building AI content systems and agents** (read alongside this file; updated when new patterns emerge from real session work)
3. MEMORY.md — index of current state
4. If working inside a project folder → that project's CLAUDE.md auto-loads
5. Auto-resume: present where we left off immediately — don't wait to be asked

**Conditional (only when task triggers):**
- Before writing any code (Python, JS, shell) that does more than pure execution — i.e., anything that contains judgment, decision logic, threshold checks, conditional branching beyond input validation, aggregation rules, or pattern detection — STOP. Ask: "is this judgment that should live in a markdown skill that Claude reads at runtime?" If yes, invoke `/skill-architecture` FIRST. The bar is low: if the code has more than data-fetch + math + file I/O, treat it as a skill-architecture question.
- Before **proposing**, **building**, **auditing**, **splitting**, **merging**, or **renaming** any skill — OR before answering any question about where a verb should live (skill, script, project, agent, cron, workflow) → invoke `/skill-architecture` FIRST. Do not reason ad-hoc from existing skill/script structures; existing artifacts may themselves violate the rules — replicating them perpetuates the bug.
- Before drafting any communication on Bill's behalf (email, social, blog post) → read MEMORY.md → `user_voice.md`

## Architecture rules (Garry Tan, thin-harness/fat-skills)
1. **Skill vs Project.** Skills are verbs (parameterized procedures, stateless).
   Projects are nouns (workspaces with code, state, deploys).
2. **Judgment up, execution down.** Markdown skills hold judgment. CLI scripts
   and APIs hold deterministic execution.
3. **Diarize before refactoring.** Never move files until current state is
   written down.

## Skill invocation — HARD RULE (no exceptions)

**When Bill invokes a gstack skill, INVOKE IT via the Skill tool. Never substitute
bash equivalents, manual checks, or "the spirit of it."** This includes:

- Any `/`-prefixed skill name: `/design-review`, `/qa`, `/seo-deploy-gate`,
  `/codex review`, `/codex challenge`, `/benchmark`, `/cso`, `/health`,
  `/document-release`, `/ship`, `/land-and-deploy`, `/canary`, `/investigate`,
  `/review`, etc.
- "Run gstack X" / "let's run X" / "fire X" / "do the X skill"
- "Run a part of gstack" / "what would Garry do" / "run the full gstack"
- Any explicit reference to a skill by its name

**The cost of substituting** (real, observed 2026-04-30 avlp2p MVP build):
- No baselines saved → future regression detection broken
- One outside voice (codex) instead of two (codex + subagent)
- No learnings logged to `~/.gstack/projects/{slug}/learnings.jsonl` → no
  cross-session compounding
- No atomic per-fix commits → rollback granularity lost
- Skipped: `npm audit`, `astro check`, real `/cso`, `/health`,
  `/document-release` — invisible debt
- No formal pass/warn/block gate → downstream automation can't chain off

**Procedure:**
1. **Default: invoke the skill via the Skill tool. Full ceremony.**
2. **If you genuinely believe the ceremony is overkill for the situation, ASK
   via AskUserQuestion** — "run full skill or fast equivalent?" Let Bill decide.
   Do NOT decide unilaterally.
3. **Skill blocks (dirty tree, missing dep) → resolve via AskUserQuestion.**
   Don't skip the skill to avoid the block.
4. **Multiple skills in sequence → invoke EACH via Skill tool.** Not one + manual
   substitutes for the rest.
5. **"Heavyweight ceremony" is a red flag for laziness, not correctness.** If you
   catch yourself thinking "this has too much setup, I'll do the parts that
   matter" — STOP. That IS the failure mode.

**Detail for this rule:**
[feedback_run_gstack_dont_substitute.md](projects/-Users-kerapassante/memory/feedback_run_gstack_dont_substitute.md)

## Safety rules
- Never commit secrets, keys, credentials, or personal info to any repo.
- Never publish fabricated, templated, or unverified content. Verify factual
  claims against multiple reputable sources before publishing.
- Confirm before destructive actions: `rm -rf`, `git push --force`,
  `git reset --hard`, changing git config or deploy auth.
- **Backup rule.** Important files (config, code, content, notes) must live
  in a git repo with a GitHub remote. After creating or editing them, commit
  + push before the session ends — no orphan files on the Mac, no uncommitted
  work piling up.
