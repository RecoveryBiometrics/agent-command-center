# National Virtual Addiction Treatment Platform
## Master Build Instructions for Claude Code Multi-Agent System
## Enhanced with Existing Infrastructure — April 1, 2026

---

## STATUS: PLANNING PHASE
- [ ] Domain selected and registered
- [ ] Project bootstrapped via /new-project
- [ ] Channels created in Slack
- [ ] Medical reviewer secured (hard blocker)
- [ ] Sunflower agreement confirmed

---

## STEP 0: DOMAIN SEARCH (RUN THIS FIRST)

Before building anything, find and register the domain.

**Primary domain checklist:**
- recoverysource.com
- virtualrecoverymd.com
- onlinerecoverycare.com
- recoveryaccess.com
- clearrecovery.com
- recoverygateway.com
- virtualaddictionmd.com
- recoveryhub.com
- treatmentgateway.com
- recoveryportal.com
- onlineaddictioncare.com
- virtualaddictioncare.com
- recoveryfinder.com
- addictioncaretoday.com
- onlinerecoverymd.com
- clearaddictioncare.com
- recoveryconnect.com
- treatmentconnect.com
- virtualtreatmentmd.com
- recoverysourceonline.com
- onlinesubstancecare.com
- virtualsubstancemd.com
- recoveryresource.com
- addictionresource.com
- treatmentresource.com
- recoverynow.com
- getrecoverynow.com
- recoverytoday.com
- onlinematclinic.com
- virtualmatclinic.com
- matclinic.com
- suboxoneonline.com
- onlinesuboxonedoctor.com
- buprenorphineonline.com
- glp1recovery.com
- glp1addiction.com

**Ranking criteria:**
1. SEO keyword match (does it match what people search?)
2. Acquirability (would a company like Sunflower want to buy this?)
3. Expandability (works beyond addiction into GLP-1, mental health)
4. Brevity (shorter = better)
5. Professionalism (passes LegitScript review standard)

**Also search for expired domains:**
Search GoDaddy Auctions and Namecheap for expired domains
containing: "recovery", "addiction", "treatment", "rehab", "mat",
"suboxone", "telehealth" that are 5+ years old with existing
backlink history. An aged domain in this vertical is worth
$500-2,000 and saves 6-12 months of authority building.

**Output:** Domain recommendations with:
- Full availability results table
- Top 3 recommendations with reasoning
- Any promising expired domain finds
- Final recommendation clearly marked

**WAIT FOR HUMAN DOMAIN REGISTRATION BEFORE PROCEEDING.**

---

## PROJECT OVERVIEW

Build a **national lead generation platform** for virtual addiction
treatment, MAT/Suboxone prescribing, GLP-1 prescribing, and
behavioral health telehealth across all 50 US states.

**Business model:** You own the infrastructure and domain.
Partner practices (starting with Sunflower Clinic,
sunflowerclinic.com) receive leads. Revenue via:
- Per-lead fees ($50-500 per qualified intake depending on service)
- Monthly retainer for exclusive state/regional access
- Asset sale — sell the ranked site to a practice or platform

**Starting client:** Sunflower Clinic
- CTA destination: https://app.sunflowersober.com/join/fit
- Phone: (717) 208-2889
- Reference site: sunflowerclinic.com
- Services: online addiction therapy, MAT (launching), GLP-1 (launching)
- Current geography: Pennsylvania (expanding nationally)

**You own this. They get the patients. You get paid.**

---

## SCOPE

**Phase 1 (Weeks 1-3): Pennsylvania launch**
Build all PA content first. Get indexed. Prove the model.
Show Sunflower attributable leads before expanding.

**Phase 2 (Weeks 4-8): High-value state expansion**
Expand to: New York, California, Texas, Florida, Ohio,
Illinois, Michigan, New Jersey, Georgia, North Carolina

**Phase 3 (Weeks 9-16): National coverage**
All 50 states. Every major city. Complete insurance matrix.
Full GLP-1 content library.

---

## EXISTING INFRASTRUCTURE TO REUSE

### From SafeBath Grab Bar (~/Developer/projects/safebath/)

**1. Daily Content Pipeline (6-agent pattern)**
- Path: `website/scripts/content-pipeline/`
- Pattern: Researcher → Fact Checker → Copywriter → Fact Checker → SEO Auditor → Engineer
- Reuse: Same orchestration pattern, swap event scraping for medical data sources
- State tracking: `pipeline-state.json` for resume support + batch rotation
- GitHub Actions workflow: `.github/workflows/daily-content-pipeline.yml`

**2. Business Directory Pipeline (4-agent discovery)**
- Path: `website/scripts/wiki-generator/`
- Pattern: Discoverer (Gemini grounded search) → Verifier → Quality Auditor (0-100 scoring) → Places Enricher
- Reuse: Discover real treatment facilities, MAT providers, GLP-1 prescribers per city
- Quality: Phone validation, website reachability, dedup, corrections-pending.json with 80% confidence threshold

**3. SEO Reporting Pipeline (weekly)**
- Path: `seo/scripts/seo-agent/`
- Pattern: GSC Fetcher → Indexing Inspector (200 pages/run) → SEO Analyst → Keyword Miner
- Reuse: Deploy as-is with new GSC property for addiction keywords

**4. Lead Capture + GHL Integration**
- ClaimForm.tsx → GHL webhook → contact + tags + pipeline + AI bot
- AI Sales Agent: Claude Sonnet via `/api/ghl-webhook/route.ts`
- Reuse: Same GHL webhook pattern for lead routing to Sunflower
- GHL Location: VL5PlkLBYG4mKk3N6PGw (AmplifiREI)

**5. Daily Email Report**
- Path: `website/scripts/daily-email.js`
- Gmail API OAuth pattern
- Supports Slack webhook (`SLACK_WEBHOOK_URL`)

**6. Directory Architecture**
- Data layer: JSON files → deduplicated index → dynamic routes
- Sitemap auto-generation from data
- Filter UI: search, state, county, type
- Schema markup: LocalBusiness JSON-LD

### From Content Autopilot (~/Developer/projects/podcast-pipeline/)

**7. 3-Agent Blog Pipeline**
- Path: `scripts/blog.py`
- Pattern: Blog Researcher (DuckDuckGo + Reddit) → Blog Writer (Claude, 800-1200 words with TOC/FAQ/pro tips) → Blog Fact Checker
- Reuse: Clinical blog articles on GLP-1 research, MAT guidelines, insurance explainers
- Adapt: Replace DuckDuckGo with PubMed/NIDA, add FACT_CHECK_RULES for healthcare

**8. Content Scraper Framework**
- Path: `scripts/scrapers/`
- Pluggable sources: web.py, rss.py, manual.py, discover.py
- Standardized output format, dedup against published.json
- Reuse: Adapt for medical news feeds, FDA announcements, research papers

**9. Static Site Builder**
- Path: `site/build.py`
- Handles 1000+ posts, auto-discovered categories (topic silos), sitemap/robots.txt/llms.txt
- Reuse: Pattern for blog section generation

### From Agent Command Center (~/Projects/agent-command-center/)

**10. Global Skills (deploy via /deploy-team)**
- `/seo-content-pipeline` — deploy adapted version for healthcare
- `/podcast-pipeline` — optional clinical podcast later
- `/deploy-team` — bootstrap all teams for this project
- `/new-project` — set up repo with standard structure
- `/org-status` — monitor across all businesses
- `/pipeline-doctor` — diagnose and fix pipeline failures

**11. Lego Pieces (30 reusable roles)**
Key roles to assign:
- Researcher, Fact Checker, Copywriter, SEO Auditor, Engineer (content team)
- Discoverer, Verifier, Quality Auditor, Places Enricher (directory team)
- GSC Fetcher, Indexing Inspector, SEO Analyst, Keyword Miner (SEO reporting)
- Blog Researcher, Blog Writer, Blog Fact Checker (blog team)
- Conversational AI Agent (lead qualification)
- Daily Reporter (executive briefing)
- Data Cleaner (prevent fake content — critical for healthcare)
- Pipeline Doctor (self-healing)

**12. Team Templates**
- SEO Content Team (6 roles) — adapt for healthcare content
- Directory Team (4 roles) — adapt for treatment facility discovery
- SEO Reporting Team (4 roles) — deploy as-is
- Content Production Team (10 roles) — adapt blog portion for clinical articles

### From YC/GHL Strategy

**13. Hybrid GHL + Claude Architecture**
- GHL as invisible backend CRM (contacts, SMS, pipelines)
- Claude API as intelligence layer (intake analysis, lead qualification)
- Custom front-end — patients use your branded site, not GHL
- Template model: GHL snapshots + Claude prompt templates per client
- Validated by Sunflower Clinic (wife's company, VP of Therapy)

---

## SLACK INTEGRATION

### Single Channel: `#addiction-leads`
All updates, leads, alerts, and questions in one place.
Split later if volume warrants it (20+ leads/day threshold).

### Alon Posts Automatically

**Pipeline Updates:**
```
Daily Pipeline Complete — April 1, 2026
- 12 pages generated (PA MAT cities)
- 11 passed quality, 1 failed (insufficient local data)
- 847/2,400 total pages complete (35%)
- Next batch: PA insurance pages tomorrow
```

**Lead Notifications:**
```
New Lead — Philadelphia, PA
- Service: Online Suboxone Doctor
- Insurance: Highmark
- Source: /pa/philadelphia/online-mat-suboxone
- Routed to: Sunflower Clinic
```

**Questions & Blockers (Bill answers when ready):**
```
DECISION NEEDED — Domain Registration
Top 3 available domains ranked:
1. recoverygateway.com
2. onlinerecoverycare.com
3. virtualaddictioncare.com
React or reply with choice.
```

```
RESEARCH GAP — Wyoming, PA
No overdose data found at city/county level.
Options: A) Use Luzerne County data  B) Use PA state data  C) Skip
Will use option A in 24h if no response.
```

### Agent Decision Escalation Protocol

```
IF agent can't make a decision autonomously:
  1. Post question to #addiction-leads with:
     - Context (what agent was doing)
     - Options (ranked by recommendation)
     - Default action + timeout ("will do X in 24h if no response")
  2. Continue processing other items (don't block pipeline)
  3. Pick up paused item when Bill replies

IF agent hits a hard failure:
  1. Post to #addiction-leads with error details
  2. Log to failed.json
  3. Continue with next item
  4. Tag @Bill if 3+ failures in one run
```

### Event → Slack Message Matrix

| Event | Format |
|---|---|
| Pipeline run starts | Status: starting batch X |
| Pipeline run completes | Summary with counts |
| Page fails quality 1x | Warning + reason |
| Page fails quality 2x | Escalation, needs human review |
| New lead captured | Lead details + routing confirmation |
| Research data missing | Question with options + 24h timeout |
| Domain/compliance decision | Question, blocks until answered |
| Weekly SEO report | Full GSC analysis summary |
| Indexing milestone | Stats celebration |
| Pipeline Doctor runs | Fix summary |
| GHL webhook failure | Error + suggested fix |

---

## TECH STACK

- **Framework:** Next.js 14 (App Router)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS
- **CRM/Lead Routing:** GoHighLevel (existing — hybrid architecture)
- **Database:** Supabase (lead analytics, not PHI)
- **Content storage:** JSON data files in /data/
- **Schema markup:** JSON-LD via next/head
- **Sitemap:** next-sitemap
- **Analytics:** Google Search Console + GA4
- **Call tracking:** CallRail (unique numbers per page cluster)
- **Email:** Gmail API OAuth (existing pattern) + Resend (lead forwarding)
- **Notifications:** Slack MCP (#addiction-leads)
- **AI:** Claude API (writing, fact-checking, lead qualification) + Gemini (grounded search)

---

## DESIGN SYSTEM

Reference: sunflowerclinic.com

Recreate their aesthetic — do NOT copy their code or assets.
Build original components that match the feel:
- Warm, approachable, clinical
- Primary: warm yellow/gold
- Secondary: soft sage green
- Typography: clean sans-serif (Inter or similar)
- Imagery: abstract watercolor-style illustrations (not photos)
- No stock photos of people — use illustrations only
  (avoids stigma and licensing issues)
- CTA buttons: warm gold, rounded, "Get Started" / "Book Free Call"

---

## NATIONAL SITE ARCHITECTURE

```
/                                    → National homepage
/[state]/                            → State hub pages (50 states)
/[state]/[city]/                     → City landing pages
/[state]/[city]/[service]/           → City + service pages

/treatments/                         → Treatment hub
/treatments/[substance]/             → Substance-specific pages
/treatments/[substance]/[state]/     → State-specific substance pages

/mat/                                → MAT national hub
/mat/[state]/                        → State MAT hub
/mat/[state]/[city]/                 → City MAT pages
/mat/suboxone/                       → Suboxone national hub
/mat/buprenorphine/                  → Buprenorphine national hub

/glp1/                               → GLP-1 national hub
/glp1/[condition]/                   → Condition-specific GLP-1
/glp1/[state]/                       → State GLP-1 prescribers
/glp1/research/                      → Clinical research library

/insurance/                          → Insurance national hub
/insurance/[insurer]/                → National insurer pages
/insurance/[insurer]/[state]/        → State-specific insurer pages
/insurance/medicaid/[state]/         → State Medicaid pages
/insurance/medicare/                 → Medicare coverage

/online-therapy/                     → Virtual therapy hub
/online-therapy/[state]/             → State therapy pages
/online-therapy/[state]/[city]/      → City therapy pages

/providers/                          → Provider directory (NEW — from SafeBath pattern)
/providers/[state]/                  → State provider listing
/providers/[state]/[city]/           → City provider listing

/blog/                               → Clinical content hub
/blog/[category]/                    → Category archives
/blog/[slug]/                        → Individual posts

/about/                              → About the platform
/about/reviewers/                    → Medical reviewer profiles
/privacy/                            → Privacy policy
/terms/                              → Terms of service
/hipaa/                              → HIPAA notice
```

---

## CONTENT TARGET MATRIX

### Services (generate pages for each x state x city)

**Addiction treatment:**
- online-mat-suboxone
- online-buprenorphine-prescription
- online-alcohol-treatment
- online-opioid-treatment
- online-fentanyl-treatment
- online-meth-treatment
- online-cocaine-treatment
- online-cannabis-treatment
- telehealth-addiction-therapy
- virtual-iop
- online-dual-diagnosis-treatment
- online-eating-disorder-treatment
- online-gambling-addiction-treatment

**MAT specific:**
- suboxone-online-doctor
- buprenorphine-telehealth
- naltrexone-online-prescription
- vivitrol-telehealth
- medication-assisted-treatment-online

**GLP-1 services:**
- glp1-online-prescriber
- semaglutide-online-prescription
- wegovy-online-doctor
- ozempic-online-prescription
- tirzepatide-online-prescription
- mounjaro-online-doctor
- glp1-weight-loss-telehealth

**GLP-1 + addiction intersections:**
- glp1-alcohol-use-disorder
- glp1-opioid-cravings
- glp1-binge-eating-disorder
- glp1-nicotine-addiction
- glp1-food-addiction
- semaglutide-addiction-recovery
- ozempic-alcohol-cravings
- wegovy-binge-eating

**Virtual therapy:**
- online-addiction-therapist
- telehealth-substance-use-counseling
- virtual-cbt-addiction
- online-motivational-interviewing
- telehealth-relapse-prevention

### All 50 States + Major Cities

Build state hub pages for all 50 states.
Build city pages for top 10-20 cities per state by population.

**Priority states (Phase 1-2):**
Pennsylvania, New York, California, Texas, Florida, Ohio,
Illinois, Michigan, New Jersey, Georgia, North Carolina,
Virginia, Washington, Arizona, Massachusetts, Tennessee,
Indiana, Missouri, Maryland, Wisconsin, Colorado, Minnesota,
South Carolina, Alabama, Louisiana, Kentucky, Oregon, Oklahoma,
Connecticut, Utah, Iowa, Nevada, Arkansas, Mississippi,
Kansas, New Mexico, Nebraska, West Virginia, Idaho, Hawaii,
New Hampshire, Maine, Montana, Rhode Island, Delaware,
South Dakota, North Dakota, Alaska, Vermont, Wyoming

**Pennsylvania cities (Phase 1 — build all):**
Philadelphia, Pittsburgh, Allentown, Erie, Reading, Scranton,
Bethlehem, Lancaster, Harrisburg, York, Wilkes-Barre, Chester,
Altoona, Easton, State College, Williamsport, Hazleton,
McKeesport, Norristown, Johnstown, Pottsville, Sharon, Butler,
Carbondale, Sunbury, Bloomsburg, Lock Haven, Lewisburg,
Meadville, Greensburg, Washington, Indiana, Chambersburg,
Gettysburg, Lebanon, Pottstown, Coatesville, West Chester,
Doylestown, Stroudsburg, Tunkhannock, Towanda, Wellsboro,
Clarion, Du Bois, Clearfield

**Top cities per priority state (Phase 2):**
New York: NYC, Buffalo, Rochester, Albany, Syracuse, Yonkers
California: LA, San Diego, San Jose, San Francisco, Fresno, Sacramento
Texas: Houston, San Antonio, Dallas, Austin, Fort Worth, El Paso
Florida: Jacksonville, Miami, Tampa, Orlando, St Petersburg
Ohio: Columbus, Cleveland, Cincinnati, Toledo, Akron
Illinois: Chicago, Aurora, Rockford, Joliet, Naperville
Michigan: Detroit, Grand Rapids, Warren, Sterling Heights, Ann Arbor
New Jersey: Newark, Jersey City, Paterson, Elizabeth, Edison

### Insurance Coverage Pages

**National insurers:**
Aetna, Cigna, UnitedHealthcare, Humana, Blue Cross Blue Shield (national),
Kaiser Permanente, Centene, Molina Healthcare, WellCare

**State Blue Cross plans:**
Anthem (multi-state), Independence Blue Cross (PA), Highmark (PA/WV/DE),
Capital BlueCross (PA), UPMC Health Plan (PA), Geisinger (PA),
Blue Cross of Northeastern PA, Empire BlueCross (NY), Excellus BlueCross (NY),
BCBS of Texas, Florida Blue, Premera Blue Cross (WA),
Regence (OR/WA/ID/UT), Blue Shield of California, BCBS of Michigan,
BCBS of Illinois, BCBS of Massachusetts, BCBS of North Carolina,
BCBS of Georgia, BCBS of Tennessee

**Government programs (one page per state):**
- Medicaid/[state] (50 pages)
- Medicare addiction coverage (national)
- CHIP (children's coverage)
- VA/Tricare (veterans)

**Insurance page template must include:**
- Does this plan cover online MAT? (yes/no/partial)
- Does this plan cover telehealth therapy?
- Does this plan cover GLP-1 for weight loss?
- Does this plan cover GLP-1 for addiction?
- Prior authorization requirements
- In-network vs out-of-network
- State parity law requirements
- How to verify your benefits (step by step)
- What to do if denied (appeals process)
- Federal parity law rights (MHPAEA)

---

## ENHANCED AGENT ARCHITECTURE

Each agent is a sub-agent with single responsibility + Slack integration.

### AGENT 1: ORCHESTRATOR
**File:** `/agents/orchestrator.md`
**Reuses:** SafeBath pipeline-state.json pattern, batch rotation, completed/failed tracking

**Role:** Master coordinator. Reads target matrix, spawns agents,
tracks progress, handles failures, never generates content itself.

**Inputs:**
- `/data/targets.json` — complete page target list
- `/data/completed.json` — already generated (resume support)
- `/data/failed.json` — failed pages for retry queue

**Process:**
```
FOR each target in targets.json NOT IN completed.json:
  1. Spawn KEYWORD AGENT → get keyword data
  2. Spawn RESEARCH AGENT → get content brief
  3. Spawn WRITING AGENT → get draft
  4. Spawn QUALITY AGENT → validate
  5. IF PASS → write to /content/[type]/[slug].json
               append to completed.json
  6. IF FAIL → log to failed.json with failure reasons
               post warning to #addiction-leads
               retry once with failure context
               if second fail → post escalation to #addiction-leads
               flag for human review
  7. Log progress every 10 pages → post summary to #addiction-leads

AFTER all content generated:
  8. Spawn BUILD AGENT
  9. Spawn SITEMAP AGENT
  10. Post final report to #addiction-leads
```

**Slack integration:**
- Posts run start/complete to #addiction-leads
- Posts questions to #addiction-leads with default timeouts
- Monitors for Bill's replies to unblock paused items

### AGENT 2: KEYWORD AGENT
**File:** `/agents/keyword.md`
**Reuses:** SafeBath GSC Keyword Miner pattern (post-launch optimization)
**New:** Pre-content keyword targeting (SafeBath doesn't have this)

**Role:** For each target page, determine exact keyword targets,
search volume estimates, and competition level.

**Process:**
1. Search Google for target keyword variations
2. Check People Also Ask for related questions
3. Check autocomplete suggestions
4. Identify primary keyword (highest volume, most specific)
5. Identify 3-5 secondary keywords
6. Estimate competition: LOW / MEDIUM / HIGH

**Output:**
```json
{
  "primary_keyword": "",
  "monthly_search_estimate": "",
  "competition": "LOW|MEDIUM|HIGH",
  "secondary_keywords": [],
  "people_also_ask": [],
  "related_searches": [],
  "keyword_intent": "informational|commercial|transactional",
  "featured_snippet_opportunity": true
}
```

Flag HIGH competition pages → post to #addiction-leads for human review.

### AGENT 3: RESEARCH AGENT
**File:** `/agents/research.md`
**Reuses:** SafeBath Researcher (Gemini grounded search) + Blog Researcher (DuckDuckGo/Reddit) + Discoverer pattern
**Critical rule:** NEVER fabricate statistics (feedback memory — SafeBath fake listings incident)

**Role:** Fetch all real data needed. Every statistic from a real source.

**Data sources by page type:**

**For all US state/city pages:**
1. CDC WONDER database — overdose mortality by state/county
2. SAMHSA NSDUH data — state-level substance use
3. SAMHSA treatment locator — facilities count per area
4. State-specific health department data
5. State Medicaid telehealth coverage rules
6. State insurance commissioner parity requirements

**For MAT pages:**
7. SAMHSA TIP 63
8. ASAM National Practice Guideline for OUD
9. PCSS MAT education resources
10. DEA regulations for telehealth prescribing

**For GLP-1 pages:**
11. PubMed — search relevant combinations
12. NIDA emerging research
13. FDA approvals for GLP-1 indications

**For insurance pages:**
14. CMS Medicaid telehealth coverage by state
15. SAMHSA parity compliance resources
16. KFF insurance coverage tracker
17. Each insurer's official coverage policy pages

**Slack integration:**
- Posts to #addiction-leads when data missing with options + 24h timeout
- Continues processing other items while waiting

**Output:** Full research JSON (see original spec for schema)

**RULES:**
- Never fabricate statistics
- If city data unavailable → use county data, note explicitly
- If county data unavailable → use state data, note explicitly
- If state data unavailable → use national data, note explicitly
- Always include source URL for every statistic
- Cross-reference key facts across minimum 2 sources
- Set research_confidence = "low" if >3 fields missing
- Flag unusual telehealth laws → post to #addiction-leads

### AGENT 4: WRITING AGENT
**File:** `/agents/writer.md`
**Reuses:** SafeBath Copywriter (5 copy rotation pattern) + Content Autopilot Blog Writer (TOC/FAQ/pro tips)

**Role:** Writes original, genuinely useful content from research brief.

**Voice rules — strictly enforced:**
- Warm, non-judgmental, hopeful but honest
- Address reader directly as "you"
- Acknowledge fear and stigma explicitly
- Clinical credibility without jargon
- Never use AI cliches (automatic FAIL):
  "embark on", "journey to recovery", "transformative",
  "holistic approach", "cutting-edge", "revolutionize",
  "comprehensive solution", "tailored to your needs",
  "we understand that", "in today's world", "it's important to note",
  "take the first step" (overused)

**Content minimums by page type:**
- State hub: 2,000-3,000 words
- City + service: 1,200-1,800 words
- GLP-1 intersection: 1,500-2,000 words
- Insurance: 1,000-1,500 words

(See original spec for detailed section templates per page type)

### AGENT 5: QUALITY AGENT
**File:** `/agents/quality.md`
**Reuses:** SafeBath SEO Auditor (auto-fix loop, up to 3 rounds) + Fact Checker (85% cross-page uniqueness threshold) + Content Autopilot fact checker (FACT_CHECK_RULES)

**Role:** Validates every page. Returns PASS or FAIL.

**Checklist categories:**
- Content quality (word count, citations, FAQs, no fabrication, no AI cliches, local specificity)
- SEO requirements (H1, meta title/description, internal links, schema, URL slug)
- E-E-A-T signals (reviewer byline, authoritative sources, crisis resources, HIPAA note, medical disclaimer)
- Compliance (no false prescribing claims, no guarantee language, LegitScript-compatible)
- Uniqueness (>70% different from other pages of same type)

**Slack integration:**
- First failure: warning to #addiction-leads
- Second failure: escalation with content + failure reasons for human review

### AGENT 6: BUILD AGENT
**File:** `/agents/build.md`
**Reuses:** SafeBath Engineer (git → Vercel deploy) + sitemap.ts pattern + directory architecture

**Role:** Generates Next.js pages, data files, schema markup, deploys.

**Tasks:**
1. Generate dynamic route files for all page types
2. Generate static data files from approved content JSON
3. Generate JSON-LD schema (MedicalBusiness, FAQPage, MedicalCondition, Drug)
4. Generate sitemap with priorities
5. Run `next build` — resolve all errors
6. Run `next-sitemap` — verify output
7. Post deployment confirmation to #addiction-leads

### AGENT 7: SITEMAP AND INDEXING AGENT
**File:** `/agents/indexing.md`
**Reuses:** SafeBath Indexing Inspector (200 pages/run)

**Tasks:**
1. Submit sitemap to Google Search Console
2. Submit IndexNow for all new pages (batches of 100)
3. Submit Bing sitemap
4. Create robots.txt
5. Verify Core Web Vitals via PageSpeed API
6. Post indexing milestones to #addiction-leads

### AGENT 8: PROVIDER DIRECTORY AGENT (NEW — from SafeBath pattern)
**File:** `/agents/directory.md`
**Reuses:** SafeBath Directory Team (Discoverer → Verifier → Quality Auditor → Places Enricher)

**Role:** Discover and verify real treatment facilities per city/state.

**Process:**
1. Discoverer: Gemini grounded search for treatment facilities, MAT providers, GLP-1 prescribers
2. Cross-reference: SAMHSA treatment locator for verification
3. Verifier: Confirm provider is licensed, currently operating, accepts telehealth
4. Quality Auditor: Score 0-100 (NPI verification, license status, telehealth capability, phone/website validation)
5. Places Enricher: Google Places data (ratings, reviews, hours)

**Output:** Provider listings in `/data/providers/[state]/[city].json`

### AGENT 9: BLOG PIPELINE AGENT (from Content Autopilot)
**File:** `/agents/blog.md`
**Reuses:** Content Autopilot 3-agent blog system

**Role:** Produce 2-3 clinical blog articles per week.

**Process:**
1. Blog Researcher: PubMed + NIDA + medical news feeds (not DuckDuckGo)
2. Blog Writer: Claude writes 800-1200 word SEO post with TOC, FAQ, citations
3. Blog Fact Checker: Healthcare-specific rules (drug names, dosages, FDA status, no cure language)

**Topics:** GLP-1 research updates, MAT guidelines, insurance explainers, state policy changes, clinical evidence reviews

### AGENT 10: LEAD CAPTURE + AI QUALIFIER (from SafeBath)
**File:** `/agents/leads.md`
**Reuses:** SafeBath ClaimForm + GHL webhook + AI Sales Agent

**Role:** Capture leads, qualify via conversational AI, route to partners.

**Flow:**
1. Lead form submission → Supabase (analytics) + GHL (CRM)
2. GHL creates contact with tags (service, state, insurance)
3. AI Qualifier (Claude Sonnet) sends initial SMS
4. Conversational qualification (insurance verification, urgency, service match)
5. Qualified lead → route to Sunflower webhook/email
6. Post lead notification to #addiction-leads
7. Track: lead → qualified → booked → admitted

### AGENT 11: DAILY REPORTER (from SafeBath)
**File:** `/agents/reporter.md`
**Reuses:** SafeBath daily-email.js + Gmail API OAuth

**Role:** Daily executive briefing via email + Slack.

**Report includes:**
- Pages published today
- Leads captured (by state, service)
- Pipeline health (agents succeeded/failed)
- Indexing progress (indexed vs total)
- Coverage stats (states, cities, insurance pages complete)
- Questions pending Bill's response

### AGENT 12: SEO REPORTING (from SafeBath)
**File:** `/agents/seo-report.md`
**Reuses:** SafeBath SEO Reporting Team (GSC Fetcher → Indexing Inspector → SEO Analyst → Keyword Miner)

**Role:** Weekly SEO analysis.

**Output:**
- Wins (pages gaining clicks/positions)
- Drops (pages losing)
- Gaps (search queries with no landing page)
- Opportunities (keywords at positions 8-20)
- Recommended new pages based on actual search demand
- Post summary to #addiction-leads

---

## LEAD CAPTURE AND ROUTING SYSTEM

### Lead capture form (every page)
Fields: name, phone, email, primary concern, insurance, state, city
Store to: Supabase leads table + GHL contact
Forward to: Partner practice webhook or email

### `/api/lead` endpoint
```typescript
POST /api/lead
Body: {
  name: string
  phone: string
  email: string
  concern: string
  insurance: string
  state: string
  city: string
  source_page: string
  source_keyword: string
  utm_source: string
  utm_campaign: string
  partner_id: string
}

Actions:
1. Validate all fields
2. Store to Supabase with timestamp
3. Create GHL contact with tags
4. Look up partner routing rules
5. Forward to partner via webhook or Resend email
6. Post to #addiction-leads
7. Trigger AI qualifier SMS via GHL
8. Return { success: true, lead_id: uuid }
```

### Partner routing table
```
Pennsylvania leads → Sunflower Clinic
  webhook: TBD
  email: TBD
  fallback: (717) 208-2889

Other states → [TBD — add as partners acquired]
```

### Lead dashboard
Build `/admin/leads` page (password protected):
- Total leads today/week/month
- Leads by state, source page, substance/service
- Conversion tracking (lead → intake → admit)
- Export to CSV

---

## DATA FILES — BUILD THESE FIRST

### `/data/targets.json`
Complete matrix of all pages to generate (services x states x cities)

### `/data/states.json`
All 50 states: abbreviation, capital, largest city, Medicaid program name,
telehealth MAT coverage, crisis line, health dept URL, parity law,
dominant insurers, opioid crisis severity, telehealth regulations, top cities

### `/data/insurers.json`
All major insurers: full name, type, primary states, telehealth MAT coverage,
GLP-1 coverage, prior auth requirements, member services phone, provider directory URL

### `/data/reviewers.json`
Medical reviewers with credentials, license states, NPI numbers.
**HARD BLOCKER: minimum 1 real reviewer before launch.**

### `/data/glp1_studies.json`
Published studies on GLP-1 + addiction. Pre-populate known studies,
Research Agent augments per page.

---

## CONTENT RULES — STRICTLY ENFORCED

### Never fabricate
If statistic unavailable for city → use county → use state → use national.
Always note the data level. Format: `(Source: CDC WONDER, 2024 — state-level data)`
Cross-reference key facts across minimum 2 sources.

### Always cite sources inline
Every statistic: `(Source: [org], [year])`
Every study: `([Author] et al., [Journal], [year])`

### Crisis resources — every single page
```
If you or someone you know needs immediate help:
National: 988 Suicide & Crisis Lifeline — call or text 988
National: SAMHSA Helpline — 1-800-662-4357 (free, confidential, 24/7)
Emergency: 911
[State-specific crisis line when available]
```

### HIPAA notice — every page
### Medical disclaimer — every page footer
### LegitScript compliance (no cure language, no guarantees)
### Prescribing claims — only claim what's confirmed live

---

## COMPLIANCE CHECKLIST

- [ ] LegitScript certification application submitted
- [ ] Privacy policy covers HIPAA and state laws
- [ ] Terms of service reviewed by healthcare attorney
- [ ] HIPAA Business Associate Agreement with Supabase
- [ ] No PHI stored in logs or analytics
- [ ] ADA accessibility (WCAG 2.1 AA minimum)
- [ ] SSL certificate active
- [ ] State-specific telehealth advertising laws reviewed (TX, FL, CA)
- [ ] Medical reviewer credentials verified
- [ ] All statistics sourced and verifiable

---

## EXECUTION ORDER

```
PHASE 0 — FOUNDATION (Days 1-2)
1. Run domain search → register domain
2. Run /new-project to bootstrap repo
3. Create #addiction-leads Slack channel
4. Create all /data/ seed files
5. Build base Next.js site (homepage + design system)
6. Deploy skeleton to Vercel with custom domain
7. Set up Google Search Console immediately
8. Set up GA4 + CallRail
9. Set up Supabase for lead storage
10. Register project in Agent Command Center dashboard

PHASE 1 — PENNSYLVANIA (Days 3-10)
11. Run /deploy-team → SEO Content Team (adapted for healthcare)
12. Run /deploy-team → Directory Team (treatment facilities)
13. Run Orchestrator → PA MAT city pages (highest priority)
14. Run Orchestrator → PA insurance pages
15. Run Orchestrator → PA state hub
16. Run Orchestrator → GLP-1 pages (national)
17. Run Build Agent → deploy PA content
18. Submit PA sitemap to Search Console
19. Post milestone to #addiction-leads
20. Begin showing Sunflower early rankings data

PHASE 2 — TOP 10 STATES (Days 11-25)
21. Expand targets.json
22. Run full pipeline for each state
23. Expand insurance pages nationally
24. Deploy incrementally
25. Run /deploy-team → SEO Reporting Team
26. Run /deploy-team → Blog Pipeline

PHASE 3 — NATIONAL (Days 26-45)
27. Complete all 50 states
28. Build blog content hub (10+ clinical articles)
29. Build complete treatment pages for all substances
30. Launch /about + reviewer profiles
31. Submit full national sitemap
32. Post national coverage milestone to #addiction-leads

ONGOING
33. Daily: Content pipeline runs, leads route, Slack updates
34. Weekly: SEO report to #addiction-leads
35. Monthly: Refresh state statistics with new data
36. Quarterly: Add new GLP-1 research as published
37. As needed: /pipeline-doctor to fix issues
38. As needed: /org-status for cross-project health check
```

---

## PRIORITY PAGES — WEEK 1

**MAT/Suboxone (national + PA):**
1. online-suboxone-doctor-philadelphia-pa
2. online-suboxone-doctor (national hub)
3. buprenorphine-online-prescription
4. online-mat-pittsburgh-pa
5. telehealth-mat-clinic

**GLP-1 (national):**
6. glp1-alcohol-use-disorder
7. semaglutide-alcohol-cravings
8. glp1-opioid-addiction-treatment
9. ozempic-for-alcohol-use-disorder
10. glp1-binge-eating-disorder

**Insurance (highest conversion):**
11. does-medicaid-cover-suboxone
12. does-medicaid-cover-online-addiction-treatment
13. does-highmark-cover-suboxone-pennsylvania
14. does-aetna-cover-online-mat
15. does-insurance-cover-glp1-weight-loss

**Pennsylvania state pages:**
16. online-addiction-treatment-pennsylvania
17. online-alcohol-treatment-philadelphia
18. virtual-addiction-therapy-pittsburgh
19. telehealth-addiction-treatment-pennsylvania
20. fentanyl-treatment-online-pennsylvania

---

## SUCCESS METRICS

**Week 1:** 20 priority pages live, GSC showing impressions, lead form functional
**Week 3:** 200+ pages indexed, first organic clicks, first lead
**Month 2:** 500+ pages, 50+ sessions/day, 5+ leads/month
**Valuation:** 100 leads/mo = ~$50-100k asset | 500 = ~$250-500k | 1,000 = acquisition target

---

## OPEN QUESTIONS — RESOLVE BEFORE LAUNCH

- [ ] Domain selected and registered
- [ ] Named medical reviewer secured
- [ ] Sunflower MAT prescribing confirmed live or timeline
- [ ] Sunflower GLP-1 confirmed live or timeline
- [ ] Lead routing destination from Sunflower (webhook/email)
- [ ] LegitScript application submitted
- [ ] Healthcare attorney review of TOS
- [ ] Business agreement with Sunflower
- [ ] CallRail phone numbers assigned by state
- [ ] Supabase HIPAA compliance tier confirmed

---

## FILE STRUCTURE

```
/
├── agents/
│   ├── orchestrator.md
│   ├── keyword.md
│   ├── research.md
│   ├── writer.md
│   ├── quality.md
│   ├── build.md
│   ├── indexing.md
│   ├── directory.md        ← NEW (from SafeBath)
│   ├── blog.md             ← NEW (from Content Autopilot)
│   ├── leads.md            ← NEW (from SafeBath)
│   ├── reporter.md         ← NEW (from SafeBath)
│   └── seo-report.md       ← NEW (from SafeBath)
├── app/
│   ├── [state]/
│   ├── treatments/[substance]/
│   ├── mat/[state]/[city]/
│   ├── glp1/[condition]/
│   ├── insurance/[insurer]/[state]/
│   ├── providers/[state]/[city]/   ← NEW directory
│   ├── blog/[slug]/
│   ├── api/lead/route.ts
│   ├── api/ghl-webhook/route.ts    ← AI qualifier
│   ├── api/admin/leads/route.ts
│   └── admin/leads/page.tsx
├── components/
│   ├── LeadForm.tsx
│   ├── CrisisResources.tsx
│   ├── ReviewerByline.tsx
│   ├── FAQSection.tsx
│   ├── InsuranceChecker.tsx
│   ├── StatBadge.tsx
│   ├── CTABlock.tsx
│   └── ProviderCard.tsx         ← NEW (from SafeBath DirectoryCard)
├── data/
│   ├── targets.json
│   ├── completed.json
│   ├── failed.json
│   ├── states.json
│   ├── insurers.json
│   ├── reviewers.json
│   ├── glp1_studies.json
│   ├── providers/               ← NEW directory data
│   └── generated/
├── scripts/
│   ├── content-pipeline/        ← Adapted from SafeBath
│   ├── provider-discovery/      ← Adapted from SafeBath wiki-generator
│   ├── seo-agent/               ← Copied from SafeBath SEO
│   ├── blog-pipeline/           ← Adapted from Content Autopilot
│   └── daily-email.js           ← From SafeBath
├── lib/
│   ├── supabase.ts
│   ├── ghl.ts                   ← GHL API integration
│   ├── lead-routing.ts
│   ├── schema.ts
│   ├── slack.ts                 ← Slack notification helpers
│   └── content-utils.ts
├── public/
│   └── images/
├── MASTER-BUILD-PLAN.md          ← THIS FILE
├── next.config.js
├── next-sitemap.config.js
└── package.json
```

---

*Enhanced with existing infrastructure from SafeBath, Content Autopilot,
Agent Command Center, and GHL hybrid architecture. ~60-70% of infrastructure
is proven and reusable. New pieces: medical data layer, insurance matrix,
GLP-1 research, HIPAA compliance, keyword targeting, medical reviewer system.*
