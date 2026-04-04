// ─── TYPES ──────────────────────────────────────────────────────

export type AgentStatus = "active" | "idle" | "error" | "scheduled";
export type ProjectStatus = "live" | "building" | "planned" | "paused" | "not-running";

// Layer 1: Individual Lego pieces — reusable worker definitions
export interface Role {
  id: string;
  name: string;
  title: string; // e.g., "Event Scraper", "Content Writer"
  description: string;
  duties: string[];
  inputs: string;
  outputs: string;
  selfHealing?: string;
  tools?: string[];
  cost?: string;
}

// Layer 2: Assembled Lego sets — roles snapped together
export interface TeamTemplate {
  id: string;
  name: string;
  skillId: string;
  description: string;
  roleIds: string[]; // ordered pipeline: role1 → role2 → role3
}

// Layer 2b: A deployed instance of a template for a specific business
export interface TeamInstance {
  id: string;
  templateId: string;
  businessId: string;
  status: AgentStatus;
  runsOn: string; // "GitHub Actions", "IONOS VPS", "local", "not deployed"
  schedule?: string; // "daily 6am ET", "weekly Tuesdays 9am ET", "24/7", etc.
  lastRun?: string;
  nextRun?: string;
}

// Layer 3: Who the sets are built for
export interface Business {
  id: string;
  name: string;
  status: ProjectStatus;
  path: string;
  website?: string;
  deploy?: string;
  github?: string;
  description: string;
  directorId: string; // which executive manages this business
}

// Skills — the instruction manuals
export interface Skill {
  id: string;
  name: string;
  description: string;
  configurable: boolean;
}

// Org chart — leadership layer
export type ExecLevel = "ceo" | "vp" | "director";

export interface Executive {
  id: string;
  name: string;
  title: string;
  level: ExecLevel;
  reportsTo: string; // ID of who they report to ("none" for CEO)
  description: string;
  responsibilities: string[];
}

// ─── LAYER 1: ROLE CATALOG ─────────────────────────────────────

export const roles: Role[] = [
  // ── SEO Content Pipeline roles ──
  {
    id: "researcher",
    name: "Researcher",
    title: "Event Scraper",
    description:
      "Scrapes real upcoming events from multiple platforms for configured cities.",
    duties: [
      "Scrapes 3 live event platforms (Eventbrite, Patch.com, AllEvents.in) for real upcoming events",
      "Processes configured number of cities per daily run, cycling through all service areas",
      "Parses JSON-LD structured data from each platform, with HTML fallback scraping",
      "Deduplicates events by normalized title (removes punctuation, articles)",
      "Filters out junk patterns (navigation text like 'Sign Up', 'Browse', etc.)",
      "Converts ISO dates to human-readable format",
      "Returns max 5 unique events per city with: name, date, location, description, source URL",
    ],
    inputs:
      "City name, state, county from the service area rotation schedule",
    outputs:
      "Array of verified real upcoming events (max 5 per city) with full metadata",
    tools: ["Eventbrite scraper", "Patch.com scraper", "AllEvents.in scraper"],
  },
  {
    id: "fact-checker",
    name: "Fact Checker",
    title: "Data Validator",
    description:
      "Validates data quality and accuracy. Used at multiple pipeline stages for different checks.",
    duties: [
      "Research validation: validates every scraped event is future-dated, filters past events and junk data",
      "Copy validation: compares articles across cities, flags >85% similarity as duplicate",
      "Returns valid/invalid verdict per item with specific issues found",
      "If validation fails, triggers a retry of the previous step (up to 3 attempts)",
    ],
    inputs: "Data from the previous pipeline stage (research or copy)",
    outputs: "Filtered/validated data — only clean items pass through",
    selfHealing:
      "Retries the upstream step up to 3 times before skipping the item",
  },
  {
    id: "copywriter",
    name: "Copywriter",
    title: "Content Writer",
    description:
      "Writes articles that naturally tie local events to the business niche. Unique per city.",
    duties: [
      "Writes 2-3 paragraph articles for each validated event",
      "Naturally ties the event to the business niche (configurable tie-in template)",
      "Uses 5 rotating copy variation templates to keep content fresh",
      "Adds a call-to-action with business name, city, and correct phone number per region",
      "Deduplicates against existing articles already published for that city",
    ],
    inputs:
      "Validated events, business config (name, niche, phone numbers, CTA template)",
    outputs:
      "Array of articles with: id, title, slug, date, excerpt, body, category",
    tools: ["Claude API (Haiku)"],
    cost: "~$0.01 per city",
  },
  {
    id: "seo-auditor",
    name: "SEO Auditor",
    title: "Quality Assurance",
    description:
      "Validates SEO standards on content. Auto-fixes common issues.",
    duties: [
      "Validates title format: under 60 characters, includes city name and service keyword",
      "Validates meta description: 120-160 characters, compelling and accurate",
      "Validates slug format: hyphenated, lowercase, URL-safe",
      "Checks schema.org readiness (can the article generate valid structured data?)",
      "Validates H1 presence and format",
      "Auto-applies fixes for common issues (trimming titles, reformatting slugs, etc.)",
    ],
    inputs: "Fact-checked articles",
    outputs: "Pass/fail per article, plus auto-fixed versions where possible",
    selfHealing:
      "Auto-applies fixes, then re-audits. Up to 3 rounds before flagging for manual review.",
  },
  {
    id: "engineer",
    name: "Engineer",
    title: "Deployer",
    description:
      "Deploys content to production via git and hosting platform.",
    duties: [
      "Writes audited content as JSON files to the configured data directory",
      "Appends new content to existing arrays (doesn't overwrite previous content)",
      "Runs git add, git commit with dated message, git push to main branch",
      "Triggers auto-deploy via the push (Vercel, Cloudflare, etc.)",
      "Reports deployment count and generates review URLs",
    ],
    inputs: "Audited and approved content from SEO Auditor",
    outputs: "Committed files, deployed to production, live URLs",
    tools: ["Git", "Vercel/Cloudflare (auto-deploy on push)"],
  },
  // ── SEO Optimizer roles ──
  {
    id: "gsc-analyst",
    name: "GSC Analyst",
    title: "Opportunity Prioritizer",
    description:
      "Reads flagged pages from GSC data and prioritizes by optimization opportunity.",
    duties: [
      "Loads improvement suggestions from gsc-topics.json (low CTR + almost-page-1 pages)",
      "Scores pages by opportunity: impressions × CTR gap × position weight",
      "Filters out pages on cooldown (28-day window) or with max retries exhausted",
      "Validates post JSON exists for each flagged slug",
      "Selects top N pages per cycle (default 10)",
      "Passes prioritized list with existing content to downstream roles",
    ],
    inputs: "gsc-topics.json improvements list + seo-cooldown.json",
    outputs: "Prioritized list of pages with post data, action type, and opportunity score",
    tools: ["GSC data (via gsc-topics.json)", "Cooldown tracker"],
  },
  // ── Directory roles ──
  {
    id: "discoverer",
    name: "Discoverer",
    title: "Business Finder",
    description:
      "Uses AI-powered web search to find real, currently operating local businesses.",
    duties: [
      "Uses Gemini 2.0 Flash with grounded web search to find real businesses",
      "Searches for configured business categories in each city",
      "Processes configured number of cities per day, cycling through all service areas",
      "For each business: confirms name, phone, website, address, and description",
      "Returns raw business records with verification status",
    ],
    inputs: "City name, state, configured business categories",
    outputs:
      "Raw business records with: name, phone, website, address, description, verification flag",
    tools: ["Gemini 2.0 Flash (grounded search)"],
    cost: "~$0.02 per city",
  },
  {
    id: "verifier",
    name: "Verifier",
    title: "Business Validator",
    description:
      "Independently re-confirms each discovered business exists and is currently operating.",
    duties: [
      "Takes every business from the Discoverer and independently re-verifies it exists",
      "Asks Gemini: 'Does {business name} exist in {city}, {state}? Is it currently operating?'",
      "Only businesses that pass verification move forward — never publish unconfirmed listings",
      "Marks each business as verified/unverified with a timestamp",
    ],
    inputs: "Discovered businesses from the Discoverer",
    outputs: "Verified businesses only — unverified ones are dropped entirely",
    tools: ["Gemini 2.0 Flash"],
  },
  {
    id: "quality-auditor",
    name: "Quality Auditor",
    title: "Listing QA",
    description: "Scores every business listing on quality and accuracy.",
    duties: [
      "Scores every business listing on a 0-100 quality scale",
      "Checks phone format (valid US pattern: 10-11 digits)",
      "Checks website reachability (HTTP HEAD request — is the site actually live?)",
      "Checks address plausibility (does it look like a real address?)",
      "Runs duplicate detection (fuzzy name matching across all listings)",
      "Checks description quality (no placeholders, minimum 30 characters, no generic text)",
      "Verifies business type accuracy (is a pharmacy actually a pharmacy?)",
    ],
    inputs:
      "Verified businesses + all existing listings in the directory",
    outputs:
      "Quality score (0-100) per listing, specific flags (phone-invalid, website-dead, duplicate, etc.)",
    tools: ["HTTP client", "Gemini (verification)", "Fuzzy matching"],
  },
  {
    id: "places-enricher",
    name: "Places Enricher",
    title: "Data Enrichment",
    description:
      "Adds Google Places data — star ratings, hours, photos, verified addresses.",
    duties: [
      "Searches Google Places API for each business listing",
      "Enriches with: Google Maps URL, star rating, review count",
      "Adds operating hours (weekday text descriptions)",
      "Verifies and corrects addresses against Google's data",
      "Pulls first 3 photo references for the listing",
      "Checks business operational status (is it permanently closed?)",
      "Rate-limited: 1 request per second to stay within free tier",
      "Idempotent: only enriches listings that don't already have Places data",
    ],
    inputs: "Verified business listings without existing Google Places data",
    outputs:
      "Enriched listings with: maps URL, rating, reviews, hours, photos, verified address",
    tools: ["Google Places API"],
    cost: "Free tier covers most usage",
  },
  // ── SEO Reporting roles ──
  {
    id: "gsc-fetcher",
    name: "GSC Fetcher",
    title: "Data Collector",
    description:
      "Fetches performance data from Google Search Console.",
    duties: [
      "Fetches current 28-day performance data (clicks, impressions, CTR, avg position)",
      "Fetches prior 28-day period for comparison (period-over-period trends)",
      "Pulls data by two dimensions: page-level and query-level",
      "Archives previous week's data for historical trend analysis",
      "Stores results in dated backup files",
    ],
    inputs: "Google Search Console API via service account",
    outputs:
      "Structured performance data: current period, prior period, per-page and per-query breakdowns",
    tools: ["Google Search Console API", "Google Service Account"],
  },
  {
    id: "indexing-inspector",
    name: "Indexing Inspector",
    title: "Index Checker",
    description:
      "Checks which pages Google has indexed via URL Inspection API.",
    duties: [
      "Checks indexing status of 200 pages per run via Google URL Inspection API",
      "Categorizes pages as: indexed, crawled-not-indexed, or errors",
      "Tracks last crawl time and fetch status for each page",
      "Maintains cumulative tracking for long-term trends",
      "Identifies newly indexed pages since the last report (wins!)",
      "Calculates overall index rate (% of all pages in Google's index)",
    ],
    inputs: "List of site pages + Google URL Inspection API",
    outputs:
      "Indexing status per page, newly indexed pages, cumulative index rate",
    tools: ["Google URL Inspection API", "Google Service Account"],
  },
  {
    id: "seo-analyst",
    name: "SEO Analyst",
    title: "Report Writer",
    description:
      "Analyzes ranking data, attributes movements to changes, writes weekly reports.",
    duties: [
      "Calculates period-over-period totals (clicks, impressions, CTR, avg position)",
      "Identifies wins: pages that moved up 3+ positions with 20+ impressions",
      "Identifies drops: pages that fell 3+ positions with 20+ impressions",
      "Identifies opportunities: pages at positions 8-20 with low CTR (almost page 1)",
      "Identifies gaps: queries with 50+ impressions but 0 clicks (missing landing pages)",
      "Connects page movements to deployed SEO changes with confidence levels",
      "Flags false correlations: bulk movements, competing explanations, premature attributions",
      "Generates full markdown report + plain-English email summary",
    ],
    inputs: "GSC performance data, indexing status, SEO-CHANGELOG.md",
    outputs:
      "Markdown report with wins/drops/opportunities/gaps/attribution + email summary",
    tools: ["Data analysis", "SEO-CHANGELOG parser", "Gmail SMTP"],
  },
  {
    id: "keyword-miner",
    name: "Keyword Miner",
    title: "Opportunity Finder",
    description:
      "Mines Google Search Console for missed opportunities and recommends new pages.",
    duties: [
      "Fetches all search queries from GSC (last 28 days, up to 1,000)",
      "Groups queries by city + service keyword",
      "Identifies queries with 50+ impressions but 0 clicks (no landing page exists)",
      "Checks if matching pages were recently created (avoids duplicating recent work)",
      "Recommends new city/service page combinations to generate",
      "Auto-updates page generation config for new pages on next build",
    ],
    inputs: "Google Search Console query data (last 28 days)",
    outputs:
      "List of new page recommendations, auto-updated page config",
    tools: ["Google Search Console API", "Content changelog"],
  },
  // ── Podcast Pipeline roles ──
  {
    id: "scheduler",
    name: "Scheduler",
    title: "Orchestrator",
    description:
      "Runs the full pipeline on configurable timer cycles.",
    duties: [
      "Runs continuously with configurable cycle intervals (default: 25 hours, synced to NotebookLM daily limit)",
      "Each cycle: triggers content discovery → audio → SEO → transcription → publishing → blog",
      "Processes up to configured episodes per cycle (default 3, max 20 with NotebookLM Plus)",
      "Tracks last run time to enforce cycle intervals",
      "Counts successes and failures from each run",
      "Sends optional daily email summary of what was published",
      "Logs all activity with timestamps",
    ],
    inputs: "Cycle timer + all configured content sources",
    outputs: "Orchestrates the full pipeline — triggers all other roles in sequence",
    tools: ["Python scheduler", "Gmail SMTP (optional summary)"],
  },
  {
    id: "content-scraper",
    name: "Content Scraper",
    title: "Source Finder",
    description:
      "Discovers content from multiple sources. Tries each in priority order.",
    duties: [
      "Tries content sources in configured priority order until it finds unpublished content",
      "Website mode: crawls full site, specific section, or sitemap (up to 500 pages)",
      "YouTube mode: extracts transcripts from channel videos via yt-dlp",
      "RSS mode: parses RSS/Atom feeds, fetches full article if summary too short",
      "Manual mode: reads from topics list or CLI flag, researches via web search",
      "Auto-discovery mode: searches web + Reddit for fresh topics when other sources exhausted",
      "Caches all discovered content to prevent re-processing",
      "Skips any content that's already been published as an episode",
    ],
    inputs:
      "Configured content sources (website URL, YouTube channel, RSS feed, topic list, or niche keyword)",
    outputs: "Content object with: title, body text, source URL, source type",
    tools: ["Web scraper", "yt-dlp", "RSS parser", "DuckDuckGo search"],
  },
  {
    id: "audio-producer",
    name: "Audio Producer",
    title: "Podcast Generator",
    description:
      "Generates natural two-host podcast conversation via NotebookLM.",
    duties: [
      "Creates a temporary text file with the episode content",
      "Uses browser automation (Playwright) to interact with Google NotebookLM",
      "Creates a new NotebookLM notebook with the episode title",
      "Uploads the content as a source document",
      "Triggers 'Generate Audio' — produces a natural two-host conversation",
      "Waits for generation to complete (typically several minutes)",
      "Downloads the finished audio as MP4",
      "Cleans up the temporary notebook and files",
    ],
    inputs: "Content object (title + body) from the Content Scraper",
    outputs: "MP4 audio file",
    tools: ["Google NotebookLM", "Playwright (browser automation)"],
    cost: "Free (3 eps/day) or $20/mo Plus (20 eps/day)",
  },
  {
    id: "seo-writer",
    name: "SEO Writer",
    title: "Metadata Optimizer",
    description:
      "Writes optimized episode titles, descriptions, and keyword tags.",
    duties: [
      "Takes the original content title and first 2,000 characters of body",
      "Writes an SEO-optimized episode title (50-70 characters, varied phrasing)",
      "Writes a compelling podcast app description (150-250 characters)",
      "Generates 5-8 keyword tags for discoverability",
      "Falls back to original title if Claude API is not configured",
    ],
    inputs: "Original content title, body excerpt, podcast name, niche",
    outputs: "SEO metadata: optimized title, description, and keyword tags",
    tools: ["Claude API (Haiku)"],
    cost: "~$0.003 per episode",
  },
  {
    id: "transcriber",
    name: "Transcriber",
    title: "Audio-to-Text",
    description:
      "Converts podcast audio to text with speaker labels.",
    duties: [
      "Uploads the MP4 audio file to Gemini API",
      "Sends a transcription prompt requesting full accuracy with speaker labels",
      "Returns complete transcript text with Host 1 / Host 2 labels",
      "Enables full-text search within podcast apps",
      "Improves accessibility for hearing-impaired listeners",
      "Optional — pipeline continues without transcription if this fails or is disabled",
    ],
    inputs: "MP4 audio file from the Audio Producer",
    outputs: "Full transcript text with speaker labels",
    tools: ["Google Gemini 2.0 Flash"],
    cost: "~$0.05/day",
  },
  {
    id: "publisher",
    name: "Publisher",
    title: "Distribution",
    description:
      "Uploads episodes to Transistor.fm for distribution to all podcast platforms.",
    duties: [
      "Requests an authorized upload URL from Transistor.fm API",
      "Uploads the audio file directly to Transistor's storage",
      "Creates the episode record with: SEO title, description, tags, transcript, audio URL",
      "Sets episode status to 'published' (immediately live)",
      "Transistor auto-distributes to: Spotify, Apple Podcasts, Amazon Music, Google Podcasts",
      "Returns the episode's share URL and embeddable HTML player",
      "Logs the episode to prevent re-processing",
    ],
    inputs: "Audio file, SEO metadata (title, description, tags), transcript text",
    outputs: "Published episode with: Transistor ID, share URL, embed HTML",
    tools: ["Transistor.fm API"],
    cost: "$19/mo (Transistor hosting)",
  },
  {
    id: "blog-researcher",
    name: "Blog Researcher",
    title: "Web + Reddit Scraper",
    description:
      "Searches the web and Reddit for real data and community perspectives.",
    duties: [
      "Searches DuckDuckGo for '{episode title} {niche}' — pulls top 5 results with snippets",
      "Searches targeted subreddits relevant to the niche for real discussions",
      "Searches general Reddit via 'site:reddit.com {title}' for broader community takes",
      "Compiles SERP snippets + Reddit thread summaries into a structured research package",
      "Gives the writer real data and perspectives to reference (not AI-generated fluff)",
    ],
    inputs: "Episode title, podcast niche, configured subreddits",
    outputs: "Research object with: SERP results + Reddit discussions",
    tools: ["DuckDuckGo search", "Reddit scraper"],
  },
  {
    id: "blog-writer",
    name: "Blog Writer",
    title: "SEO Content Writer",
    description:
      "Writes full SEO blog post from episode content and research.",
    duties: [
      "Writes 800-1,200 word SEO blog post using episode content + research findings",
      "Structures with H2/H3 headings optimized for search",
      "Generates a clickable table of contents with anchor links",
      "Includes a 'Pro Tip' callout box highlighting key actionable advice",
      "Writes an FAQ section using expandable Q&A format",
      "Embeds the podcast player so readers can listen inline",
      "Places affiliate link CTA if configured",
      "Assigns a category from the configured category list",
    ],
    inputs:
      "Episode content, SEO metadata, research findings, podcast embed HTML",
    outputs: "Full HTML blog post + assigned category",
    tools: ["Claude API (Haiku)"],
    cost: "~$0.01 per post",
  },
  {
    id: "blog-fact-checker",
    name: "Blog Fact Checker",
    title: "Content Validator",
    description:
      "Validates blog posts for factual accuracy, fabricated stats, and compliance.",
    duties: [
      "Reviews the entire blog post for factual accuracy",
      "Catches fabricated or made-up statistics (a common AI hallucination)",
      "Verifies product and company name spellings",
      "Checks any pricing claims against known data",
      "Flags potential legal or compliance issues",
      "Applies custom fact-check rules if configured",
      "Returns corrected HTML if issues found, or passes original through if clean",
    ],
    inputs: "Blog post HTML from the Blog Writer",
    outputs: "Passed/failed verdict, corrected HTML, list of issues found",
    tools: ["Claude API (Haiku)"],
  },
  {
    id: "site-builder",
    name: "Site Builder",
    title: "Static Site Generator",
    description:
      "Builds the blog website from published post data.",
    duties: [
      "Reads all published blog posts from post data files",
      "Auto-discovers categories from post metadata",
      "Generates homepage with responsive post grid",
      "Generates individual post pages",
      "Generates category listing pages",
      "Generates sitemap.xml, robots.txt, and llms.txt",
      "Applies configurable theme (dark/light), accent color, and font",
      "Outputs complete static site ready for any host",
    ],
    inputs: "Blog post data files",
    outputs: "Complete static site: HTML pages, sitemap, robots.txt, llms.txt",
    tools: ["Python static site generator"],
  },
  // ── OM Generation roles ──
  {
    id: "county-scraper",
    name: "County Scraper",
    title: "Property Data Collector",
    description:
      "Pulls property data from county auditor websites.",
    duties: [
      "Takes a parcel ID and queries the county auditor website",
      "Extracts 25 property data fields: sqft, year built, tax, zoning, lot size, etc.",
      "Handles multi-parcel lookups for properties spanning multiple parcels",
      "Returns structured property data that feeds the OM Generator",
      "No API key needed — scrapes public county records",
    ],
    inputs: "Parcel ID (e.g., 076-0002-0138-00)",
    outputs:
      "Structured property data: 25 fields including sqft, year built, tax, zoning, lot size, assessed value",
    tools: ["County auditor website scraper"],
  },
  {
    id: "om-generator",
    name: "OM Generator",
    title: "Document Writer",
    description:
      "AI-generates professional offering memorandum sections.",
    duties: [
      "Takes property data + deal details from the input wizard",
      "Generates 11 professional OM sections using Claude Haiku",
      "Sections: executive summary, property overview, financial analysis, market analysis, etc.",
      "Uses investment-grade language and formatting standards",
      "Calculates NOI, cap rate, debt service coverage from inputs",
      "Generates in ~43 seconds total (~4 seconds per section)",
      "Each section can be individually regenerated",
    ],
    inputs:
      "Property data from County Scraper + deal details (price, units, rents, expenses)",
    outputs: "11 complete OM sections ready for editing",
    tools: ["Claude API (Haiku 3.5)"],
    cost: "~$0.15 per OM (charging clients $9 = 98% margin)",
  },
  {
    id: "pdf-builder",
    name: "PDF Builder",
    title: "Document Export",
    description:
      "Renders investment-grade branded PDF from OM content.",
    duties: [
      "Takes finalized OM content from the editor",
      "Renders a professional, investment-grade branded PDF using Puppeteer",
      "Applies the premium PDF template with client branding",
      "Handles photo placement from the editor",
      "Generates table of contents with page numbers",
      "Optimizes for printing and digital viewing",
    ],
    inputs: "Finalized OM content from the editor (HTML)",
    outputs: "Investment-grade branded PDF file",
    tools: ["Puppeteer (headless Chrome PDF rendering)"],
  },
  // ── Sales & Operations roles ──
  {
    id: "conversational-ai-agent",
    name: "AI Sales Agent",
    title: "SMS Outreach",
    description:
      "Handles warm SMS conversations with business owners who claimed directory listings. Texts as 'Bill'.",
    duties: [
      "Responds to inbound SMS from business owners via GHL Conversation AI",
      "Follows 7-message discovery sequence over 14 days",
      "25 hard rules for sounding human (no emojis, no bullet points, max 2-3 sentences)",
      "Leads with free visibility audit, then featured listing ($99-199/mo)",
      "Only pitches AI agent package ($279-497/mo) after trust is established",
      "Gracefully exits if not interested — listing stays active",
    ],
    inputs: "Contact info, business name, conversation history from GHL",
    outputs: "SMS responses via GHL, pipeline stage updates",
    tools: ["GHL Conversation AI (auto-pilot)", "GHL Workflow"],
    cost: "$0.01-0.03 per message",
  },
  {
    id: "daily-reporter",
    name: "Daily Reporter",
    title: "Executive Briefing",
    description:
      "Generates plain-English CEO report: what each agent did, what went wrong, what's next.",
    duties: [
      "Pulls data from content changelog, wiki state, quality scores, directory stats",
      "Calculates coverage metrics (% cities, days to full coverage)",
      "Writes scannable CEO summary — bottom line, agent statuses, gaps, changes",
      "Sends via Gmail API and Slack webhook",
    ],
    inputs: "Pipeline state files, content changelog, directory data",
    outputs: "Email + Slack daily briefing",
    tools: ["Gmail API (OAuth)", "Slack webhook"],
    cost: "$0 (Gmail free tier)",
  },
  {
    id: "pipeline-doctor",
    name: "Pipeline Doctor",
    title: "Diagnostics & Auto-Fix",
    description:
      "Analyzes pipeline runs, diagnoses failures, implements fixes, pushes. Invoked via /pipeline-doctor.",
    duties: [
      "Pulls GitHub Actions logs for latest run",
      "Categorizes issues: CRITICAL / DEGRADED / QUALITY",
      "Identifies root causes (API keys, thresholds, broken scrapers, dedup)",
      "Implements fixes directly in source code",
      "Enables missing APIs via gcloud CLI",
      "Commits and pushes all fixes",
    ],
    inputs: "GitHub repo, Actions run logs",
    outputs: "Issue table + committed code fixes",
    tools: ["GitHub CLI", "gcloud CLI", "Source code editing"],
    cost: "$0 (on-demand)",
  },
  {
    id: "data-cleaner",
    name: "Data Cleaner",
    title: "Quality Enforcer",
    description:
      "Scans listings for fabricated/templated content and purges it. Nothing fake gets published.",
    duties: [
      "Detects templated patterns ('{CityName} Senior Center', fake VNAs, etc.)",
      "Removes businesses with generic descriptions and no contact info",
      "Deduplicates state-level resources (1 per state, not per city)",
      "Produces verification report CSV",
      "Supports dry-run and apply modes",
    ],
    inputs: "City wiki JSON files",
    outputs: "Cleaned data files, verification report",
    tools: ["verify-and-clean.js"],
    cost: "$0",
  },
];

// ─── SKILLS ────────────────────────────────────────────────────

export const skills: Skill[] = [
  {
    id: "seo-content-pipeline",
    name: "SEO Content Pipeline",
    description:
      "Daily local content generation, business discovery, directory management, GSC mining, weekly SEO reports",
    configurable: true,
  },
  {
    id: "podcast-pipeline",
    name: "Podcast Pipeline",
    description:
      "Content-to-podcast automation with blog generation. Supports website, YouTube, RSS, manual, and auto-discovery sources",
    configurable: true,
  },
  {
    id: "om-generation",
    name: "OM Generation",
    description:
      "AI-generated Offering Memorandums from parcel data. Wizard input, county scraper, editor, PDF export",
    configurable: false,
  },
];

// ─── LAYER 2: TEAM TEMPLATES ───────────────────────────────────

export const teamTemplates: TeamTemplate[] = [
  {
    id: "seo-content-team",
    name: "SEO Content Team",
    skillId: "seo-content-pipeline",
    description:
      "Scrapes local events, writes unique articles tied to business niche, validates quality, deploys to production.",
    roleIds: [
      "researcher",
      "fact-checker",
      "copywriter",
      "fact-checker",
      "seo-auditor",
      "engineer",
    ],
  },
  {
    id: "directory-team",
    name: "Directory Team",
    skillId: "seo-content-pipeline",
    description:
      "Discovers real local businesses, verifies they exist, scores quality, enriches with Google data.",
    roleIds: ["discoverer", "verifier", "quality-auditor", "places-enricher", "data-cleaner"],
  },
  {
    id: "seo-reporting-team",
    name: "SEO Reporting Team",
    skillId: "seo-content-pipeline",
    description:
      "Fetches search performance data, checks indexing, analyzes wins/drops/gaps, mines for opportunities.",
    roleIds: [
      "gsc-fetcher",
      "indexing-inspector",
      "seo-analyst",
      "keyword-miner",
    ],
  },
  {
    id: "content-production-team",
    name: "Content Production Team",
    skillId: "podcast-pipeline",
    description:
      "Full podcast + blog pipeline: discovers content, generates audio, optimizes SEO, transcribes, publishes, writes blog, fact-checks.",
    roleIds: [
      "scheduler",
      "content-scraper",
      "audio-producer",
      "seo-writer",
      "transcriber",
      "publisher",
      "blog-researcher",
      "blog-writer",
      "blog-fact-checker",
      "site-builder",
    ],
  },
  {
    id: "sales-team",
    name: "Sales Team",
    skillId: "seo-content-pipeline",
    description:
      "Handles inbound directory claims, texts business owners via AI, discovers their needs, leads toward featured listings and AI agent packages.",
    roleIds: ["conversational-ai-agent"],
  },
  {
    id: "operations-team",
    name: "Operations Team",
    skillId: "seo-content-pipeline",
    description:
      "Monitors pipeline health, diagnoses failures, sends daily executive reports, enforces data quality.",
    roleIds: ["daily-reporter", "pipeline-doctor", "data-cleaner"],
  },
  {
    id: "seo-optimizer-team",
    name: "SEO Optimizer Team",
    skillId: "seo-content-pipeline",
    description:
      "Takes flagged pages (low CTR, almost-page-1) and executes fixes — researches competitors, rewrites titles/descriptions, expands content, fact-checks, deploys. Tracks results and auto-retries.",
    roleIds: [
      "gsc-analyst",
      "researcher",
      "copywriter",
      "fact-checker",
      "engineer",
    ],
  },
  {
    id: "om-builder-team",
    name: "OM Builder Team",
    skillId: "om-generation",
    description:
      "Scrapes county property data, AI-generates offering memorandum sections, exports branded PDF.",
    roleIds: ["county-scraper", "om-generator", "pdf-builder"],
  },
];

// ─── LAYER 2b: DEPLOYED TEAM INSTANCES ─────────────────────────

export const teamInstances: TeamInstance[] = [
  // SafeBath
  {
    id: "sb-seo",
    templateId: "seo-content-team",
    businessId: "safebath",
    status: "scheduled",
    runsOn: "GitHub Actions",
    schedule: "Daily, 6:00 AM ET",
    lastRun: "2026-03-29 06:00 ET",
    nextRun: "2026-03-30 06:00 ET",
  },
  {
    id: "sb-directory",
    templateId: "directory-team",
    businessId: "safebath",
    status: "scheduled",
    runsOn: "GitHub Actions",
    schedule: "Daily, 6:00 AM ET",
    lastRun: "2026-03-29 06:15 ET",
    nextRun: "2026-03-30 06:15 ET",
  },
  {
    id: "sb-reporting",
    templateId: "seo-reporting-team",
    businessId: "safebath",
    status: "scheduled",
    runsOn: "GitHub Actions",
    schedule: "Weekly, Tuesdays 9:07 AM ET",
    nextRun: "2026-04-01 09:07 ET",
  },
  {
    id: "sb-sales",
    templateId: "sales-team",
    businessId: "safebath",
    status: "active",
    runsOn: "GHL Conversation AI + Vercel",
    schedule: "Always on — responds to inbound claims",
  },
  {
    id: "sb-operations",
    templateId: "operations-team",
    businessId: "safebath",
    status: "scheduled",
    runsOn: "GitHub Actions",
    schedule: "Daily, 6:00 AM ET (report) + on-demand (doctor)",
    lastRun: "2026-03-31 06:00 ET",
  },
  // GlobalHighLevel
  {
    id: "ghl-production",
    templateId: "content-production-team",
    businessId: "globalhighlevel",
    status: "active",
    runsOn: "IONOS VPS ($2/mo)",
    schedule: "24/7 — 25-hour cycles, 20 episodes/day",
    lastRun: "2026-03-29 (continuous)",
  },
  {
    id: "ghl-seo-optimizer",
    templateId: "seo-optimizer-team",
    businessId: "globalhighlevel",
    status: "scheduled",
    runsOn: "IONOS VPS ($2/mo)",
    schedule: "Weekly (inside podcast pipeline scheduler)",
  },
  // Hatch
  {
    id: "hatch-om",
    templateId: "om-builder-team",
    businessId: "hatch",
    status: "idle",
    runsOn: "Local only (not deployed)",
    schedule: "Manual — triggered from localhost:3000",
  },
];

// ─── LAYER 3: BUSINESSES ───────────────────────────────────────

export const businesses: Business[] = [
  {
    id: "safebath",
    name: "SafeBath Grab Bar",
    status: "live",
    path: "~/Developer/projects/safebath/",
    website: "safebathgrabbar.com",
    deploy: "Vercel",
    github: "RecoveryBiometrics/safebath",
    description:
      "Local service business — grab bar installation, bathroom safety. 5 states, 1,427 pages, 366 directory listings.",
    directorId: "dir-safebath",
  },
  {
    id: "globalhighlevel",
    name: "GlobalHighLevel.com",
    status: "live",
    path: "~/Developer/projects/marketing/podcast-pipeline/",
    website: "globalhighlevel.com",
    github: "RecoveryBiometrics/content-autopilot",
    deploy: "IONOS VPS",
    description:
      "GHL tutorial site + podcast. 80+ tutorials, 380 followers. Affiliate model (30-day free trial). Runs on IONOS VPS 24/7.",
    directorId: "dir-ghl",
  },
  {
    id: "hatch",
    name: "Hatch Investments",
    status: "not-running",
    path: "~/Projects/hatch-investments/",
    website: "localhost:3000",
    github: "RecoveryBiometrics/hatch-investments",
    description:
      "AI operations platform for RE syndicators. OM Builder works locally, needs deploy to Cloudflare.",
    directorId: "dir-hatch",
  },
  {
    id: "reiamplifi",
    name: "REI Amplifi",
    status: "live",
    path: "~/Projects/reiamplifi/",
    description:
      "Parent agency. 3.5 years on GHL. No custom AI agents — uses GHL built-in automations only.",
    directorId: "dir-reiamplifi",
  },
  {
    id: "mailer",
    name: "Mailer Dashboard",
    status: "building",
    path: "~/Developer/projects/marketing/mailer-dashboard/",
    description: "Email campaign management with Claude AI. In development.",
    directorId: "dir-mailer",
  },
  {
    id: "recovery",
    name: "Recovery Biometrics",
    status: "paused",
    path: "~/Projects/recovery-biometrics/",
    description: "Oura Ring + FeatherStone biometrics for recovery. Low priority.",
    directorId: "dir-recovery",
  },
];

// ─── ORG CHART: EXECUTIVES ─────────────────────────────────────

export const executives: Executive[] = [
  // CEO
  {
    id: "ceo",
    name: "Bill",
    title: "CEO",
    level: "ceo",
    reportsTo: "none",
    description:
      "Sets strategy, approves major decisions, reviews daily briefings. All VPs report here.",
    responsibilities: [
      "Set company strategy and priorities",
      "Review daily executive briefings",
      "Approve new business launches",
      "Approve skill updates that affect multiple businesses",
      "YC application and investor relations",
    ],
  },
  // VPs
  {
    id: "vp-growth",
    name: "VP of Growth",
    title: "VP of Growth",
    level: "vp",
    reportsTo: "ceo",
    description:
      "Owns all live, revenue-generating businesses. Gets daily rollup reports. Decides resource allocation.",
    responsibilities: [
      "Monitor daily output across all live businesses (SafeBath, GHL)",
      "Flag underperforming businesses or teams",
      "Decide resource allocation (which business gets more agent capacity)",
      "Approve new team deployments to existing businesses",
      "Report rollup metrics to CEO daily",
    ],
  },
  {
    id: "vp-product",
    name: "VP of Product",
    title: "VP of Product",
    level: "vp",
    reportsTo: "ceo",
    description:
      "Owns products being built or not yet live. Responsible for getting them to launch.",
    responsibilities: [
      "Get Hatch Investments deployed and live",
      "Oversee Mailer Dashboard development",
      "Manage the build-to-launch pipeline",
      "Decide when a product is ready to transfer to VP of Growth",
      "Coordinate with VP of Operations on shared infrastructure needs",
    ],
  },
  {
    id: "vp-operations",
    name: "VP of Operations",
    title: "VP of Operations",
    level: "vp",
    reportsTo: "ceo",
    description:
      "Owns shared infrastructure, quality standards, and the Skills Library. Ensures SOPs work across all businesses.",
    responsibilities: [
      "Maintain and improve the Skills Library (reusable SOPs)",
      "Ensure skill updates roll out cleanly to all businesses",
      "Own quality standards across all teams",
      "Manage shared infrastructure (IONOS VPS, GitHub Actions)",
      "Onboarding playbook for new businesses",
    ],
  },
  // Directors
  {
    id: "dir-safebath",
    name: "Director of SafeBath",
    title: "Director of SafeBath",
    level: "director",
    reportsTo: "vp-growth",
    description:
      "Owns SafeBath Grab Bar operations. 3 teams, 14 agent roles. Daily content + directory + weekly SEO reports.",
    responsibilities: [
      "Ensure daily content pipeline runs successfully (8 cities/day)",
      "Monitor directory quality scores (target: 80+ average)",
      "Review weekly SEO report and flag action items",
      "Track indexing progress (target: 90%+ index rate)",
      "Report daily status to VP of Growth",
    ],
  },
  {
    id: "dir-ghl",
    name: "Director of GlobalHighLevel",
    title: "Director of GlobalHighLevel",
    level: "director",
    reportsTo: "vp-growth",
    description:
      "Owns GlobalHighLevel.com operations. 1 team, 10 agent roles. 24/7 podcast + blog production on IONOS VPS.",
    responsibilities: [
      "Ensure 20 episodes/day production target is met",
      "Monitor blog post quality and fact-check pass rate",
      "Track affiliate conversions and listener growth",
      "Ensure IONOS VPS uptime and scheduler health",
      "Report daily status to VP of Growth",
    ],
  },
  {
    id: "dir-hatch",
    name: "Director of Hatch Investments",
    title: "Director of Hatch Investments",
    level: "director",
    reportsTo: "vp-product",
    description:
      "Owns Hatch Investments product. Getting OM Builder from local-only to deployed and live.",
    responsibilities: [
      "Get OM Builder deployed to Cloudflare",
      "Set up GHL integration (webhook → auto-generate OM)",
      "Onboard first client (Benjie) for testing",
      "Build remaining 5 services (public records, mailer, newsletter, SEO, GBP)",
      "Report progress to VP of Product",
    ],
  },
  {
    id: "dir-mailer",
    name: "Director of Mailer",
    title: "Director of Mailer Dashboard",
    level: "director",
    reportsTo: "vp-product",
    description:
      "Owns Mailer Dashboard development. Getting email campaign tool from concept to working product.",
    responsibilities: [
      "Define feature requirements for email campaign management",
      "Oversee Claude AI integration for email writing/optimization",
      "Get to MVP and first internal test",
      "Report progress to VP of Product",
    ],
  },
  {
    id: "dir-reiamplifi",
    name: "Director of REI Amplifi",
    title: "Director of REI Amplifi",
    level: "director",
    reportsTo: "vp-growth",
    description:
      "Owns the parent agency entity. No custom AI agents — manages GHL built-in automations and client relationships.",
    responsibilities: [
      "Manage GHL built-in automations for agency operations",
      "Client acquisition and relationship management",
      "Coordinate with other Directors on cross-business needs",
    ],
  },
  {
    id: "dir-recovery",
    name: "Director of Recovery Biometrics",
    title: "Director of Recovery Biometrics",
    level: "director",
    reportsTo: "vp-product",
    description: "Paused. Will reactivate when SafeBath and Hatch are stable.",
    responsibilities: [
      "Maintain project documentation",
      "Reactivate when VP of Product greenlights",
    ],
  },
  {
    id: "dir-quality",
    name: "Director of Quality & Skills",
    title: "Director of Quality & Skills",
    level: "director",
    reportsTo: "vp-operations",
    description:
      "Owns the Skills Library and Role Catalog. Ensures SOPs are consistent and improving across all businesses.",
    responsibilities: [
      "Maintain and improve shared Skills (SEO, Podcast, OM)",
      "Ensure Role definitions are accurate and up-to-date",
      "Review quality metrics across all businesses",
      "Approve skill updates before they roll out to production teams",
      "Build setup wizards for deploying skills to new businesses",
    ],
  },
];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────

export function getRoleById(id: string): Role | undefined {
  return roles.find((r) => r.id === id);
}

export function getTemplateById(id: string): TeamTemplate | undefined {
  return teamTemplates.find((t) => t.id === id);
}

export function getInstancesForBusiness(businessId: string): TeamInstance[] {
  return teamInstances.filter((ti) => ti.businessId === businessId);
}

export function getDirectReports(execId: string): Executive[] {
  return executives.filter((e) => e.reportsTo === execId);
}

export function getStats() {
  const uniqueRoleIds = new Set(
    teamTemplates.flatMap((t) => t.roleIds)
  );
  const activeInstances = teamInstances.filter(
    (ti) => ti.status === "active" || ti.status === "scheduled"
  );
  const activeRoleCount = activeInstances.reduce((sum, ti) => {
    const template = getTemplateById(ti.templateId);
    return sum + (template ? template.roleIds.length : 0);
  }, 0);
  const totalRoleCount = teamInstances.reduce((sum, ti) => {
    const template = getTemplateById(ti.templateId);
    return sum + (template ? template.roleIds.length : 0);
  }, 0);

  return {
    totalBusinesses: businesses.length,
    liveBusinesses: businesses.filter(
      (b) => b.status === "live"
    ).length,
    totalTeamInstances: teamInstances.length,
    activeTeamInstances: activeInstances.length,
    totalDeployedRoles: totalRoleCount,
    activeDeployedRoles: activeRoleCount,
    totalRoleTemplates: uniqueRoleIds.size,
    totalSkills: skills.length,
    readySkills: skills.filter((s) => s.configurable).length,
    totalExecutives: executives.length,
    vps: executives.filter((e) => e.level === "vp").length,
    directors: executives.filter((e) => e.level === "director").length,
  };
}

// ─── HEALTH / ATTENTION ITEMS ──────────────────────────────────

export type AlertLevel = "critical" | "warning" | "info" | "success";
export type AlertCategory = "not-running" | "no-teams" | "skill-gap" | "idle" | "overdue" | "healthy";

export interface HealthAlert {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  description: string;
  action: string;
  businessId?: string;
  teamInstanceId?: string;
}

export function getHealthAlerts(): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  // Check businesses that should be running but aren't
  businesses.forEach((b) => {
    if (b.status === "not-running") {
      const instances = getInstancesForBusiness(b.id);
      if (instances.length > 0) {
        alerts.push({
          id: `not-running-${b.id}`,
          level: "critical",
          category: "not-running",
          title: `${b.name} is not running`,
          description: `Has ${instances.length} team(s) configured but nothing is deployed or automated.`,
          action: "Deploy to hosting and set up automation (GitHub Actions, VPS, or Cloudflare)",
          businessId: b.id,
        });
      }
    }
  });

  // Check businesses with no teams at all
  businesses.forEach((b) => {
    const instances = getInstancesForBusiness(b.id);
    if (instances.length === 0 && b.status !== "paused") {
      alerts.push({
        id: `no-teams-${b.id}`,
        level: b.status === "building" ? "warning" : "info",
        category: "no-teams",
        title: `${b.name} has no agent teams`,
        description: b.status === "live"
          ? "This business is live but has no AI agents working on it."
          : "No teams deployed yet. Use /deploy-team when ready.",
        action: b.status === "live"
          ? "Consider deploying an SEO Content Team or other skill"
          : "Continue building, then deploy teams when the product is ready",
        businessId: b.id,
      });
    }
  });

  // Check for idle team instances (configured but not running)
  teamInstances.forEach((ti) => {
    if (ti.status === "idle") {
      const template = getTemplateById(ti.templateId);
      const biz = businesses.find((b) => b.id === ti.businessId);
      alerts.push({
        id: `idle-${ti.id}`,
        level: "warning",
        category: "idle",
        title: `${template?.name || ti.templateId} is idle on ${biz?.name || ti.businessId}`,
        description: `Team is configured but not actively running. Runs on: ${ti.runsOn}`,
        action: "Deploy and activate this team, or remove it if no longer needed",
        businessId: ti.businessId,
        teamInstanceId: ti.id,
      });
    }
  });

  // Check for skill gaps — skills that aren't configurable yet
  skills.forEach((s) => {
    if (!s.configurable) {
      alerts.push({
        id: `skill-gap-${s.id}`,
        level: "info",
        category: "skill-gap",
        title: `${s.name} skill is not ready to deploy`,
        description: "This skill exists as a concept but hasn't been written as a reusable, configurable playbook yet.",
        action: "Write the full SKILL.md with configuration variables and setup wizard steps",
      });
    }
  });

  // Check for missing skills that should exist based on team templates
  const templateSkillIds = new Set(teamTemplates.map((t) => t.skillId));
  const existingSkillIds = new Set(skills.map((s) => s.id));
  templateSkillIds.forEach((skillId) => {
    if (!existingSkillIds.has(skillId)) {
      alerts.push({
        id: `missing-skill-${skillId}`,
        level: "warning",
        category: "skill-gap",
        title: `Skill "${skillId}" is referenced but doesn't exist`,
        description: "A team template references this skill but it's not in the skills library.",
        action: "Create this skill in ~/.claude/skills/",
      });
    }
  });

  // Success items — things running well
  teamInstances.forEach((ti) => {
    if (ti.status === "active" || ti.status === "scheduled") {
      const template = getTemplateById(ti.templateId);
      const biz = businesses.find((b) => b.id === ti.businessId);
      alerts.push({
        id: `healthy-${ti.id}`,
        level: "success",
        category: "healthy",
        title: `${template?.name || ti.templateId} running on ${biz?.name || ti.businessId}`,
        description: `${ti.runsOn}${ti.schedule ? ` — ${ti.schedule}` : ""}${ti.lastRun ? `. Last run: ${ti.lastRun}` : ""}`,
        action: "No action needed — running as expected",
        businessId: ti.businessId,
        teamInstanceId: ti.id,
      });
    }
  });

  // Sort: critical first, then warning, info, success last
  const levelOrder: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2, success: 3 };
  alerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return alerts;
}
