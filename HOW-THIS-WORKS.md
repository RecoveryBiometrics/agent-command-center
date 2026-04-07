# How This System Works

This is a plain English guide for you (Bill), not for Claude. Come back to this when you need to remember how everything fits together.

## The Big Idea

Claude has no memory between sessions. So we use files on disk as its memory. The folder structure IS the product. Claude reads only the files relevant to each task, which keeps costs low.

## Three Things to Understand

### 1. Skills = How to Do Things

A skill is a markdown file (SKILL.md) that teaches Claude how to do a specific job. Think of it like a training manual for a new employee.

- `skills/seo-content-pipeline/SKILL.md` — how to run the daily SEO content engine
- `skills/podcast-pipeline/SKILL.md` — how to produce podcasts and blog posts

You write a skill once. Every business that uses it reads the same file. If you improve the skill, all businesses benefit automatically.

### 2. Business YAMLs = Who Needs What

Each business has a YAML config file in `businesses/`. It says what the business is, what skills it uses, and fills in the blanks (business name, phone numbers, service areas, etc.).

- `businesses/safebath.yaml` — SafeBath's config
- `businesses/hatch.yaml` — Hatch's config
- `businesses/_template.yaml` — copy this to add a new business

The YAML never contains instructions. The skill never contains business-specific info. They meet in the middle.

### 3. CLAUDE.md = The Rules

Every project has a CLAUDE.md at its root. Claude reads this automatically at the start of every session. It tells Claude what the project is, how to behave, and where to find things.

Keep these short (under 500 words). The shorter they are, the less you spend on tokens.

## Adding a New Business

1. Copy `businesses/_template.yaml` → rename to `your-business.yaml`
2. Fill in the business details
3. Run `/new-project` to create the project directory
4. Run `/deploy-team` to set up pipelines
5. Create a Google Sheet tracker for the business, add the sheet ID to the YAML

## Changing How a Skill Works

Edit the SKILL.md file. That's it. Every business using that skill gets the change next time it runs.

## Adding Something Only One Business Needs

If it's a config difference (like a different article length), add a field to that business's YAML. The skill checks for it.

If it's a whole new capability, write a new SKILL.md and only assign it to that business's YAML.

## Where Everything Lives

| What | Where |
|------|-------|
| Business configs | `businesses/*.yaml` |
| Skill playbooks | `skills/*/SKILL.md` |
| Pipeline code | `pipelines/` |
| Dashboard | `dashboard/` (live on Vercel) |
| Each business's project | Its own folder in ~/Projects/ or ~/Developer/projects/ |
| Tracking (SEO changes, TODOs) | Google Sheets (one per business, linked in YAML) |

## The One Rule

Never copy a skill. Never fork a skill. One file, one truth. If a business needs something different, use config (YAML) to handle it.
