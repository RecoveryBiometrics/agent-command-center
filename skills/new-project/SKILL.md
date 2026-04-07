---
name: New Project
description: Start a new business project with standard structure — YAML config, CLAUDE.md, git repo, terminal shortcut. Every project starts clean and organized.
user-invocable: true
---

# New Project Setup

You are setting up a new project from scratch. Follow this checklist exactly so every project starts the same way.

## When to use this skill
- User says /new-project or wants to start a new business/project
- User mentions a new client, new website, or new product to build

## Setup Checklist

### Step 1: Ask the user
Before creating anything, ask:
1. What is the project name? (e.g., "CleanPro Plumbing")
2. What does it do in one sentence?
3. Which directory? ~/Projects/ (business) or ~/Developer/projects/ (dev)?
4. Which teams will it use? (SEO Content, Podcast, Directory, OM Builder, or none yet)

### Step 2: Create the business YAML (SINGLE SOURCE OF TRUTH)
Copy the template and fill in the details:
```
cp ~/Projects/agent-command-center/businesses/_template.yaml ~/Projects/agent-command-center/businesses/{slug}.yaml
```
Fill in: id, name, status, website, niche, description, org info, brand info, slack channels, and teams.

This YAML is the single source of truth for the business. The dashboard auto-generates from it. Skills read from it. Pipelines load config from it.

### Step 3: Create the project directory
```
mkdir -p ~/[directory]/[project-name]
cd ~/[directory]/[project-name]
git init
```

### Step 4: Write CLAUDE.md
Every project MUST have a CLAUDE.md with:
- What This Is (1-2 sentences)
- Business config: ~/Projects/agent-command-center/businesses/{slug}.yaml
- Tech Stack
- Key Context (owner, client, key people)
- RESUME HERE section (empty for now)

### Step 5: Add terminal shortcut
Add to ~/.zshrc:
```
projectname() { cd ~/[path] && claude -p "lets pick up where we left off"; }
```

### Step 6: Create tracker sheet
Every business gets a Google Sheet with 7 standard tabs:
1. SEO Changelog, 2. Analytics, 3. Active TODOs, 4. Build Queue, 5. Directory Log, 6. Weekly SEO Report, 7. Costs

Use `google-workspace` MCP → `create_spreadsheet` with `sheet_names` param. Share with `safebath-seo@gen-lang-client-0592529269.iam.gserviceaccount.com` as Editor via `manage_drive_access`. Add headers to each tab. Put the sheet ID in the YAML as `tracking_sheet_id`.

### Step 7: Deploy teams (if applicable)
If the user chose teams in step 1:
- Run /deploy-team which reads the YAML and sets up everything automatically
- This generates GitHub Actions workflows that point to the shared pipeline in agent-command-center/pipelines/

### Step 8: Register in ops
Add the new business to the ops registry so scheduled triggers know about it:
```
Edit ~/Developer/projects/ops/projects.yml
```
Add the business entry with its project path, teams, and schedule info.

### Step 9: Push agent-command-center
```
cd ~/Projects/agent-command-center
git add businesses/{slug}.yaml
git commit -m "Add {business name} to registry"
git push
```
Vercel auto-deploys the dashboard with the new business.

## Key Locations
- Business YAMLs: `~/Projects/agent-command-center/businesses/`
- Template: `~/Projects/agent-command-center/businesses/_template.yaml`
- Ops registry: `~/Developer/projects/ops/projects.yml`
- Dashboard: `~/Projects/agent-command-center/dashboard/`

## Standards
- ALWAYS create the YAML first — it's the source of truth
- ALWAYS use git from the start
- ALWAYS have a CLAUDE.md
- ALWAYS add the terminal shortcut
- ALWAYS register in ops/projects.yml
- NEVER hand-edit workforce.ts — it's auto-generated from YAMLs
- NEVER duplicate config that belongs in the YAML
