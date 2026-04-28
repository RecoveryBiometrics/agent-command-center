---
name: skill-architecture
version: 1.0.0
description: "Reference guide for building new skills using Garry Tan's Thin Harness, Fat Skills architecture + ICM internal structure. Read this before creating any skill."
invocation: /skill-architecture
allowed-tools:
  - Read
triggers:
  - how to build a skill
  - skill template
  - new skill
  - garry tan
  - thin harness
  - fat skills
  - skill architecture
---

# How to Build Skills — Thin Harness, Fat Skills + ICM

Reference guide. Read before creating any new skill file. Based on Garry Tan's "Thin Harness, Fat Skills" (April 2026) + Van Clief ICM 5-layer structure.

Source: https://github.com/garrytan/gbrain/blob/master/docs/ethos/THIN_HARNESS_FAT_SKILLS.md

## The one-sentence version

**ICM is how you write a recipe card. Garry's framework is how you organize the kitchen.**

ICM structures each phase INSIDE a skill (Issue, Context, Mechanism, Action, Verification). Garry's framework structures the SYSTEM around skills (resolvers load the right skill, diarization builds persistent state, skills self-improve after mistakes).

---

## Five definitions (memorize these)

### 1. Skill file
A reusable markdown document that teaches the model HOW to do something. The user supplies WHAT. The skill supplies the process.

Skills are method calls with parameters. Same skill, different arguments, different outcomes:
```
/consolidate --canonical page-a --losers page-b,page-c
/consolidate --canonical page-x --losers page-y,page-z
```
Same process. Different inputs. Different results.

### 2. Harness
The program that runs the LLM. Does four things: runs the model in a loop, reads/writes files, manages context, enforces safety. This should be THIN (~200 lines). Claude Code is the harness. Don't rebuild it.

**Anti-pattern (fat harness, thin skills):**
- 40+ tool definitions eating half the context window
- God tools with 2-5 second MCP round-trips
- REST API wrappers turning every endpoint into a tool
- Python scripts with 800 lines mixing judgment + execution

### 3. Resolver
A routing table for context. When task type X appears, load document Y first.

Skills address HOW. Resolvers address WHAT to load and WHEN.

In Claude Code, resolvers work via the `description` and `triggers` fields in SKILL.md frontmatter. Write these well — they ARE your resolver. When a user says "build the homepage," Claude Code matches that to the skill with `triggers: [build the site, website pages, homepage]` and loads it automatically.

### 4. Latent vs Deterministic
Every step falls on one side.

**Latent space** = intelligence. The model reads, interprets, decides, synthesizes. Put judgment here. "Which pages to build. What copy to write. How to merge content."

**Deterministic space** = reliability. Same input → same output. Put execution here. "Generate HTML. Write redirect. Deploy to Cloudflare. Send email."

**The rule:** Push intelligence UP into skills (markdown). Push execution DOWN into deterministic tools (CLI scripts, APIs). Keep the harness THIN between them.

### 5. Diarization
The model reads everything about a subject and writes a structured profile. Read 10 data sources → produce 1-page state summary.

This is NOT caching. It's synthesis. The model reads contradictions, notices patterns, and writes a judgment-laden profile that a SQL query or grep could never produce.

Every project should have a `/system-state` skill that diarizes the project state at session start.

---

## Three-layer architecture

```
┌─────────────────────────────────────────────┐
│  FAT SKILLS (top)                           │
│  Markdown procedures encoding judgment,     │
│  process, and domain knowledge.             │
│  90% of the value lives here.               │
├─────────────────────────────────────────────┤
│  THIN HARNESS (middle)                      │
│  Claude Code. ~200 lines equivalent.        │
│  JSON in, text out. Read-only by default.   │
├─────────────────────────────────────────────┤
│  DETERMINISTIC TOOLS (bottom)               │
│  CLI scripts, APIs, SQL, file I/O.          │
│  Same input = same output. Always.          │
└─────────────────────────────────────────────┘
```

**Principle:** Push intelligence UP into skills. Push execution DOWN into deterministic tools. Keep the harness THIN.

---

## Skill file template

Every new skill should follow this structure:

```markdown
---
name: skill-name
version: 1.0.0
description: "One sentence that acts as a resolver — when should this skill load? Be specific to the domain, not generic."
invocation: /skill-name
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
triggers:
  - phrase a user would say that should activate this skill
  - another phrase
  - another phrase
---

# /skill-name — One-Line Purpose

Why this skill exists. What problem it solves. One paragraph max.

## The rule

One sentence that defines success or failure for this skill. The test every output must pass. Example: "Every page must answer 'What do I want this visitor to do next?' within 3 seconds."

## Invocation (parameterized)

/skill-name                        # default mode
/skill-name --mode specific-thing  # targeted invocation
/skill-name --audit                # check existing work

## Phase 0 — Load context (resolver)

Before any work, read these files in order:
1. CLAUDE.md — project config
2. [domain-specific files]
3. state/*.json — what's been done

If [critical file] doesn't exist, STOP and create it first.

## Phase 1 — [First step]

**Issue:** What's wrong or what needs to happen.
**Context:** Why it matters, what constraints exist.
**Mechanism:** How to do it — the actual process with judgment calls.
**Action:** What to produce — files to write, commands to run.
**Verification:** How to confirm it worked.

## Phase 2 — [Second step]
(Same ICM structure)

## Phase N — [Final step]
(Same ICM structure)

## Persistent state

skill-name/state/
  file.json  — what this tracks and why

## Self-improving rules

After every session involving this skill:
1. Did [specific failure pattern]? → Add check to Phase N.
2. Did the user correct something? → Update the relevant phase.
3. Did something work better than expected? → Log pattern.

Write new rules directly into this SKILL.md.
```

---

## Checklist before shipping a new skill

- [ ] `description` field is specific enough to act as a resolver (not "does stuff" but "builds Cloudflare Pages sites for local service businesses targeting mobile conversion")
- [ ] `triggers` list 3-5 phrases a user would actually say
- [ ] Phase 0 loads context BEFORE doing any work
- [ ] Every phase has ICM (Issue, Context, Mechanism, Action, Verification)
- [ ] Invocation is parameterized (`--page X`, `--mode Y`) not monolithic
- [ ] Persistent state directory exists with documented JSON schemas
- [ ] Self-improving rules section exists at the bottom
- [ ] Judgment lives in the skill markdown, execution lives in deterministic code
- [ ] Skill can be invoked 10 different ways with 10 different arguments and produce 10 different correct outputs (method-call test)
- [ ] No anti-patterns: no fat harness logic, no 40+ tool definitions, no God tools

---

## Common mistakes

**Writing a script, not a skill.** If your SKILL.md is mostly "run this command, then run that command" — you wrote a script in markdown. Skills encode JUDGMENT: when to choose A over B, how to evaluate quality, what "good" looks like in this domain. Scripts encode STEPS.

**Generic descriptions.** "Helps with SEO" doesn't resolve. "Writes knob-and-tube content for Asheville electrical contractors targeting homeowners and realtors" resolves to exactly the right moment.

**No Phase 0.** Every skill that doesn't load context first will make wrong assumptions. Phase 0 is not optional — it's the resolver firing.

**No self-improvement.** A skill that doesn't rewrite itself after failures is a static document. Garry measured: 12% "OK" ratings → 4% after skills learned what "OK" meant. Skills must learn.

**Confusing latent and deterministic.** "Decide which pages to build" = latent (skill). "Generate the HTML" = deterministic (script). If your skill contains `subprocess.run()` or your script contains "analyze the content and decide" — you crossed the line.

---

## Reference implementations

**GHL pipeline (18 skills):** `~/.claude/skills/` — domain-specific skills for podcast, SEO, content, analytics, deploy gate. ICM structure inside. Being restructured toward this pattern.

**P2P project (4 skills):** `/Users/kerapassante/Projects/power-to-the-people/.claude/skills/` — p2p-build, p2p-seo, p2p-mailer, system-state. Built from scratch using this template.

**Garry Tan's gstack (23 skills):** https://github.com/garrytan/gstack — generic software development skills. Good for greenfield SaaS projects. Don't install on existing projects with domain-specific skills (conflicts).

**Garry Tan's gbrain:** https://github.com/garrytan/gbrain — persistent knowledge graph with PGLite/Supabase. Overkill for <50 document projects. Claude Code's built-in memory is sufficient until you need vector search over thousands of entities.
