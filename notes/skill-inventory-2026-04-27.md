# Skill inventory snapshot — 2026-04-27

Diarization of `~/.claude/skills/` produced during the org-level refactor session on 2026-04-27.
Use this as the starting point when resuming the org refactor.

## Big finding (not yet investigated)

`~/Projects/agent-command-center/skills/` contains **18 of the 21 org-level skills as duplicates**
(missing only: pipeline-health, seo-deploy-gate, skill-architecture). Likely an old sync experiment.

`settings.local.json` has two `cp` permissions for `verticals-pipeline` syncing between the two
locations — evidence of the duplication pattern.

**Investigate before deleting:**
- Do any pipelines/scripts in `agent-command-center/pipelines/` (or on GitHub Actions, or on the
  GHL VPS) read skill files from `agent-command-center/skills/` instead of `~/.claude/skills/`?
- If yes → duplicates are load-bearing, migrate carefully.
- If no → deadweight, delete safely (also remove the cp permissions).

## The 21 skills, classified

### ✅ ORG-LEVEL — correctly placed (13)

Parameterized by business, stateless, cross-business by design.

| Skill | Purpose |
|---|---|
| skill-architecture | Garry Tan / ICM doctrine reference |
| new-project | Scaffolds new business projects |
| deploy-team | Wires team templates to a business |
| org-status | Reads ALL business YAMLs — org-wide status check |
| fix-page-snippet | Title/meta CTR rewrite + 28-day audit + self-improvement (gold standard) |
| analytics-team | GA4 analysis + dispatch to other pipelines |
| content-builder | Builds content from SEO Active TODOs |
| content-localizer | Language/topic classification + market localization |
| indexing-api | Forces Google same-day crawl on new URLs |
| reporting | Weekly / error / CEO digests |
| seo-content-pipeline | Daily 6-agent content engine |
| seo-deploy-gate | 9-rule pre-deploy safety gate |
| todo-agent | Executes Active TODOs from business Sheet |

### 🔄 PROJECT-LEVEL — mis-placed at org (4)

Hardcoded to one business. Should live in that project's `.claude/skills/`.

| Skill | Belongs to | Why |
|---|---|---|
| interlinking | SafeBath | Description: "across all SafeBath pages"; reads SafeBath constants.ts |
| pipeline-health | GHL | Built for GHL VPS → GitHub → Cloudflare flow after 2026-04-10 incident |
| topic-sourcer | GHL | Tier 1 = "GHL Documentation" hardcoded |
| verticals-pipeline | GHL | SKILL.md says *"GHL-only, hardcoded — this is correct"*; has cp duplicates |

### ⚠️ MASHED — project + skill conflated (3)

Need to be split: project (code/state) stays where it is; skill (procedure) moves into that
project's `.claude/skills/`.

| Skill | Project component | Skill component |
|---|---|---|
| om-builder | Express.js app at `~/Projects/hatch-investments/om-builder/` | Procedure for generating/editing OMs |
| pipeline-doctor | Bill's specific pipeline inventory (VPS IPs, SSH, paths) | Generic "diagnose pipeline failure" logic |
| podcast-pipeline | Two codebases (open-source + GHL VPS deployment) | Generic operate-podcast-for-a-business procedure |

### ❓ UNCLEAR (1)

| Skill | Question |
|---|---|
| social-content | References `#ops-log` and `#social` Slack channels — cross-business or single-tenant? |

## Pickup notes for future Bill (or future Claude)

When resuming the org refactor:

1. **Investigate duplication.** Grep `agent-command-center/pipelines/` and any CI workflows for
   references to `~/Projects/agent-command-center/skills/` or relative `skills/` paths. Determine
   whether the duplicates are load-bearing.
2. **If not load-bearing:** delete the `agent-command-center/skills/` folder and remove the two
   `cp` permissions in `~/.claude/settings.local.json`.
3. **Move the 4 mis-placed skills** into their projects. Suggested order:
   - `verticals-pipeline` → `~/Developer/projects/marketing/podcast-pipeline/.claude/skills/`
     (worst offender — has the live cp evidence; SKILL.md self-declares as GHL-only)
   - `topic-sourcer` → same GHL location
   - `pipeline-health` → same GHL location
   - `interlinking` → `~/Developer/projects/safebath/.claude/skills/`
4. **Split the 3 mashed skills.** Suggested order:
   - `om-builder` first (cleanest split — running app in `~/Projects/hatch-investments/om-builder/`
     is clearly a project; the operating procedure is the skill)
   - `pipeline-doctor` next (extract Bill's pipeline inventory into business YAMLs or
     `org-state`; keep generic diagnostic logic at org level)
   - `podcast-pipeline` last (open-source vs GHL deployment split is the trickiest)
5. **Resolve `social-content`** by reading SKILL.md deeper or asking Bill.

## Today's parked decision (2026-04-27)

User-global `~/.claude/CLAUDE.md` was shipped today — Garry Tan thin-harness/fat-skills + ICM
doctrine adopted. That file is the load-bearing piece of the org refactor.

The 21-skill cleanup is investment-in-future-velocity, not on fire. GHL ships money; the
duplication is ugly but not breaking anything. Per Garry's own *"build per business, no
premature abstraction"* rule (and Bill's existing memory of the same), refactoring what's
working can wait.

Pivoted to revenue work (P2P client delivery, GHL improvement) after this snapshot was saved.
