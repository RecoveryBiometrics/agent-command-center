# Agents Registry

Single source of truth for what agents exist, what they do, and where they run. Scan this file in 30 seconds to orient.

## Agents

| Agent | Does | Used by |
|---|---|---|
| `analytics-team` | GA4 analysis, surface insights, dispatch instructions to other pipelines | SafeBath Analytics, GHL Analytics |
| `content-builder` | Build pages from SEO TODOs — research, write, fact-check, interlink, deploy | SafeBath Content Builder, GHL Content Builder |
| `content-localizer` | Classify language + topic, localize CTAs/pricing/currency | Podcast, blog, trades pipelines |
| `deploy-team` | Deploy a team template (SEO Content, Directory, Podcast, OM Builder) to a business | Manual — new business setup |
| `interlinking` | Build and maintain internal link graph, neighbors, article retrofit | SafeBath SEO Content |
| `new-project` | Start a new business project — YAML, CLAUDE.md, git repo, tracker sheet | Manual — new business setup |
| `om-builder` | AI-powered Offering Memorandum generator (30–50pp PDF in 43s) | Hatch (on-demand via Render web UI) |
| `org-status` | Status check across all businesses, teams, agents. Doubles as CEO daily briefing | Manual + pipeline-doctor morning runs |
| `pipeline-doctor` | Diagnose + fix pipeline failures (GitHub Actions and IONOS VPS) | On failure + manual |
| `podcast-pipeline` | Podcast + blog production, multi-language, 20 eps/cycle | GHL (24/7 on IONOS VPS) |
| `reporting` | Weekly reports, error alerts, CEO digests. Silent on clean runs | SafeBath + GHL weekly reporting |
| `seo-content-pipeline` | Daily SEO content — event scraping, writing, fact-check, SEO audit | SafeBath (daily), GHL content builder |
| `seo-deploy-gate` | Pre-deploy safety gate — 8 rules, pass/warn/block | Required before any SEO deploy |
| `social-content` | Generate FB social posts from ops activity | Daily FB trigger |
| `todo-agent` | Execute Active TODOs from Google Sheet (SEO, new pages, investigations) | Manual per business |
| `topic-sourcer` | 3-tier topic sourcing (GHL docs, GSC gaps, market verticals) | Blog scripts, podcast pipeline |
| `verticals-pipeline` | Peter-Attia-style vertical-specific content for GHL, 9-part series, 4 markets (agencies, trades, pro services) | GHL (parallel 4-lang bundles of 3) |

## Live Deployments

| Business | Pipeline | Runs on | Schedule |
|---|---|---|---|
| SafeBath | SEO Content + Directory | GitHub Actions | Daily 6:00 AM ET |
| SafeBath | SEO Reporting | GitHub Actions | Weekly Tue 9:07 AM ET |
| SafeBath | Content Builder | GitHub Actions | Weekly Wed 6:00 AM ET |
| SafeBath | Analytics | GitHub Actions | Weekly Mon 8:00 AM ET |
| SafeBath | Sales Agent | GHL + Vercel | Always on (inbound) |
| SafeBath | Operations | GitHub Actions | Daily 6:00 AM ET + on-demand |
| GHL | Podcast (EN/ES/IN/AR) | IONOS VPS (systemd) | 24/7, 25h cycles, 20 eps/cycle |
| GHL | SEO Optimizer | IONOS VPS (scheduler) | Weekly (7-day cooldown) |
| GHL | Analytics | GitHub Actions | Weekly Mon 8:00 AM ET |
| GHL | Content Builder | GitHub Actions | Weekly Wed 6:00 AM ET |
| Hatch | OM Builder | Render (free tier) | On-demand via web UI |

## Businesses

| Slug | Name | Status | Notes |
|---|---|---|---|
| `safebath` | Safe Bath Grab Bars | live | Full stack — SEO, directory, sales, reporting, analytics |
| `globalhighlevel` | GlobalHighLevel.com | live | Podcast 24/7 + SEO optimizer + analytics |
| `reiamplifi` | REI Amplifi | live | Uses GHL built-in automations only |
| `hatch` | Hatch Investments | not-running | OM Builder on-demand only |
| `bass-forecast` | Bass Forecast | building | 90-day retainer, no pipelines yet |
| `power-to-the-people` | Power to the People | building | Andrew Holbein, Asheville electrician |
| `ice-machines` | Ice Machines | planning | Pre-revenue, no pipelines yet |
| `mailer` | Mailer Dashboard | building | No pipelines yet |
| `recovery` | Recovery Biometrics | paused | No pipelines |

## Maintenance

Hand-maintained today. When you add/rename/delete a skill or deploy a new pipeline, update this file in the same session. Future: auto-generate from parsing `~/.claude/skills/*/SKILL.md` + `businesses/*.yaml`.
