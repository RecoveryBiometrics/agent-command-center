export type AgentStatus = "active" | "idle" | "error" | "scheduled";
export type ProjectStatus = "live" | "building" | "planned" | "paused";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastRun?: string;
  nextRun?: string;
  description: string;
  duties: string[];
  inputs: string;
  outputs: string;
  selfHealing?: string;
  tools?: string[];
  cost?: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  deployedTo: string[]; // business IDs using this skill
  agentCount: number;
  configurable: boolean;
}

export interface Team {
  id: string;
  name: string;
  businessId: string;
  skillId: string;
  agents: Agent[];
  status: AgentStatus;
  dailyReport?: string;
}

export interface Business {
  id: string;
  name: string;
  status: ProjectStatus;
  path: string;
  website?: string;
  deploy?: string;
  github?: string;
  teams: Team[];
  description: string;
}

// ─── YOUR SKILLS ───────────────────────────────────────────────
export const skills: Skill[] = [
  {
    id: "seo-content-pipeline",
    name: "SEO Content Pipeline",
    description:
      "Daily local content generation, business discovery, directory management, GSC mining, weekly SEO reports",
    deployedTo: ["safebath"],
    agentCount: 6,
    configurable: true,
  },
  {
    id: "podcast-pipeline",
    name: "Podcast Pipeline",
    description:
      "Content-to-podcast automation with blog generation. Supports website, YouTube, RSS, manual, and auto-discovery sources",
    deployedTo: ["globalhighlevel"],
    agentCount: 5,
    configurable: true,
  },
  {
    id: "om-generation",
    name: "OM Generation",
    description:
      "AI-generated Offering Memorandums from parcel data. 8-step wizard, county scraper, WYSIWYG editor, PDF export",
    deployedTo: ["hatch"],
    agentCount: 3,
    configurable: false, // skill not yet written
  },
  {
    id: "ghl-integration",
    name: "GHL Integration",
    description:
      "GoHighLevel webhook handling, pipeline automation, CRM sync, contact management",
    deployedTo: ["hatch", "reiamplifi"],
    agentCount: 2,
    configurable: false, // skill not yet written
  },
];

// ─── YOUR BUSINESSES ───────────────────────────────────────────
export const businesses: Business[] = [
  {
    id: "safebath",
    name: "SafeBath Grab Bar",
    status: "live",
    path: "~/Developer/projects/safebath/",
    website: "safebathgrabbar.com",
    deploy: "Vercel",
    github: "RecoveryBiometrics/safebath",
    description: "Local service business — grab bar installation, bathroom safety. 5 states, 1,427 pages.",
    teams: [
      {
        id: "safebath-seo",
        name: "SEO Content Team",
        businessId: "safebath",
        skillId: "seo-content-pipeline",
        status: "active",
        agents: [
          {
            id: "sb-researcher",
            name: "Researcher",
            role: "Event Scraper",
            status: "scheduled",
            lastRun: "2026-03-28 06:00 ET",
            nextRun: "2026-03-29 06:00 ET",
            description:
              "Scrapes Eventbrite, Patch.com, AllEvents.in for real local events in 8 cities/day",
            duties: [
              "Scrapes 3 live event platforms (Eventbrite, Patch.com, AllEvents.in) for real upcoming events",
              "Processes 8 cities per daily run, cycling through 167 cities across all service areas",
              "Parses JSON-LD structured data from each platform, with HTML fallback scraping",
              "Deduplicates events by normalized title (removes punctuation, articles)",
              "Filters out junk patterns (navigation text like 'Sign Up', 'Browse', etc.)",
              "Converts ISO dates to human-readable format",
              "Returns max 5 unique events per city with: name, date, location, description, source URL",
            ],
            inputs: "City name, state, county from the service area rotation schedule",
            outputs: "Array of verified real upcoming events (max 5 per city) with full metadata",
            tools: ["Eventbrite scraper", "Patch.com scraper", "AllEvents.in scraper"],
          },
          {
            id: "sb-factcheck1",
            name: "Fact Checker #1",
            role: "Research Validator",
            status: "scheduled",
            lastRun: "2026-03-28 06:02 ET",
            nextRun: "2026-03-29 06:02 ET",
            description:
              "Validates events are future-dated, filters junk data. Self-healing with 3 retries.",
            duties: [
              "Validates every scraped event is future-dated (filters out past events)",
              "Checks for junk data that slipped through the scraper filters",
              "Returns a valid/invalid verdict for each event",
              "If validation fails, triggers a retry — researcher re-scrapes (up to 3 attempts)",
            ],
            inputs: "Raw scraped events from the Researcher",
            outputs: "Filtered array of only valid, future-dated events",
            selfHealing: "If invalid data found, retries the full research step up to 3 times before skipping the city",
          },
          {
            id: "sb-copywriter",
            name: "Copywriter",
            role: "Content Writer",
            status: "scheduled",
            lastRun: "2026-03-28 06:05 ET",
            nextRun: "2026-03-29 06:05 ET",
            description:
              "Writes 2-3 paragraph articles tying local events to bathroom safety. Unique per city.",
            duties: [
              "Writes 2-3 paragraph articles for each validated event",
              "Naturally ties the event to the business niche (e.g., bathroom safety for SafeBath)",
              "Uses 5 rotating safety-focused copy variation templates to keep content fresh",
              "Adds a call-to-action with business name, city, and correct phone number per region",
              "Deduplicates against existing articles already published for that city",
              "Uses the exact phone number per county/state (PA/DE/MD default, NV override, SC override)",
            ],
            inputs: "Validated events from Fact Checker #1, business config (name, niche, phone numbers, CTA template)",
            outputs: "Array of articles with: id, title, slug, date, excerpt, body, category",
            tools: ["Claude API (Haiku)"],
            cost: "~$0.01 per city",
          },
          {
            id: "sb-factcheck2",
            name: "Fact Checker #2",
            role: "Copy Validator",
            status: "scheduled",
            lastRun: "2026-03-28 06:08 ET",
            nextRun: "2026-03-29 06:08 ET",
            description:
              "Checks cross-city uniqueness (85% threshold). Flags duplicate phrasing.",
            duties: [
              "Compares every article against articles written for sibling cities",
              "Flags articles that are more than 85% similar to another city's article",
              "Checks for duplicate or overused phrasing patterns across the batch",
              "Validates that titles and body content are genuinely unique",
            ],
            inputs: "Generated articles from the Copywriter",
            outputs: "Valid/invalid verdict per article, plus specific issues found",
            selfHealing: "If articles are too similar, sends them back to the Copywriter for revision (up to 3 rounds)",
          },
          {
            id: "sb-seo-auditor",
            name: "SEO Auditor",
            role: "Quality Assurance",
            status: "scheduled",
            lastRun: "2026-03-28 06:10 ET",
            nextRun: "2026-03-29 06:10 ET",
            description:
              "Validates titles, meta descriptions, slugs, schema. Auto-fixes common issues.",
            duties: [
              "Validates title format: under 60 characters, includes city name and service keyword",
              "Validates meta description: 120-160 characters, compelling and accurate",
              "Validates slug format: hyphenated, lowercase, URL-safe",
              "Checks schema.org readiness (can the article generate valid structured data?)",
              "Validates H1 presence and format",
              "Auto-applies fixes for common issues (trimming titles, reformatting slugs, etc.)",
            ],
            inputs: "Fact-checked articles from Fact Checker #2",
            outputs: "Pass/fail per article, plus auto-fixed versions where possible",
            selfHealing: "Auto-applies fixes, then re-audits. Up to 3 rounds before flagging for manual review.",
          },
          {
            id: "sb-engineer",
            name: "Engineer",
            role: "Deployer",
            status: "scheduled",
            lastRun: "2026-03-28 06:12 ET",
            nextRun: "2026-03-29 06:12 ET",
            description:
              "Writes JSON to data directory, commits to git, pushes to main. Vercel auto-deploys.",
            duties: [
              "Writes audited articles as JSON files to /src/data/local-news/{city-slug}.json",
              "Appends new articles to existing city arrays (doesn't overwrite previous content)",
              "Runs git add, git commit with dated message, git push to main branch",
              "Triggers Vercel auto-deploy via the push (site live within 2-3 minutes)",
              "Reports deployment count and total articles per city",
              "Generates full URL for each new article for review",
            ],
            inputs: "Audited and approved articles from SEO Auditor",
            outputs: "Committed JSON files, deployed to production, live URLs",
            tools: ["Git", "Vercel (auto-deploy on push)"],
          },
        ],
      },
      {
        id: "safebath-directory",
        name: "Directory Team",
        businessId: "safebath",
        skillId: "seo-content-pipeline",
        status: "active",
        agents: [
          {
            id: "sb-discoverer",
            name: "Discoverer",
            role: "Business Finder",
            status: "scheduled",
            lastRun: "2026-03-28 06:15 ET",
            nextRun: "2026-03-29 06:15 ET",
            description:
              "Uses Gemini grounded search to find real local businesses. 10 cities/day.",
            duties: [
              "Uses Gemini 2.0 Flash with grounded web search to find real, currently operating businesses",
              "Searches for configured business categories (senior centers, pharmacies, VNAs, home health, etc.)",
              "Processes 10 cities per day, cycling through all service area cities",
              "For each business found: confirms name, phone, website, address, and description",
              "Returns raw business records with verification status",
            ],
            inputs: "City name, state, configured business categories",
            outputs: "Raw business records with: name, phone, website, address, description, verification flag",
            tools: ["Gemini 2.0 Flash (grounded search)"],
            cost: "~$0.02 per city",
          },
          {
            id: "sb-verifier",
            name: "Verifier",
            role: "Business Validator",
            status: "scheduled",
            lastRun: "2026-03-28 06:20 ET",
            nextRun: "2026-03-29 06:20 ET",
            description:
              "Re-confirms each discovered business exists and is currently operating.",
            duties: [
              "Takes every business from the Discoverer and independently re-verifies it exists",
              "Asks Gemini: 'Does {business name} exist in {city}, {state}? Is it currently operating?'",
              "Only businesses that pass verification move forward — we never publish unconfirmed listings",
              "Marks each business as verified/unverified with a timestamp",
            ],
            inputs: "Discovered businesses from the Discoverer",
            outputs: "Verified businesses only — unverified ones are dropped entirely",
            tools: ["Gemini 2.0 Flash"],
          },
          {
            id: "sb-auditor",
            name: "Quality Auditor",
            role: "Listing QA",
            status: "scheduled",
            lastRun: "2026-03-28 06:25 ET",
            nextRun: "2026-03-29 06:25 ET",
            description:
              "Scores each listing 0-100. Checks phone, website, address, description quality.",
            duties: [
              "Scores every business listing on a 0-100 quality scale",
              "Checks phone format (valid US pattern: 10-11 digits)",
              "Checks website reachability (HTTP HEAD request — is the site actually live?)",
              "Checks address plausibility (does it look like a real address?)",
              "Runs duplicate detection (fuzzy name matching across all listings)",
              "Checks description quality (no placeholders, minimum 30 characters, no generic text)",
              "Verifies business type accuracy (is a pharmacy actually a pharmacy?)",
              "Stores scores in quality-scores.json with flags for each issue found",
            ],
            inputs: "Verified businesses from the Verifier + all existing listings in the directory",
            outputs: "Quality score (0-100) per listing, specific flags (phone-invalid, website-dead, duplicate-exact, etc.)",
            tools: ["HTTP client (website checks)", "Gemini (verification)", "Fuzzy matching"],
          },
          {
            id: "sb-enricher",
            name: "Places Enricher",
            role: "Data Enrichment",
            status: "scheduled",
            lastRun: "2026-03-28 06:30 ET",
            nextRun: "2026-03-29 06:30 ET",
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
            outputs: "Enriched listings with: maps URL, rating, reviews, hours, photos, verified address",
            tools: ["Google Places API"],
            cost: "Free tier covers most usage",
          },
        ],
      },
      {
        id: "safebath-seo-report",
        name: "SEO Reporting Team",
        businessId: "safebath",
        skillId: "seo-content-pipeline",
        status: "active",
        agents: [
          {
            id: "sb-gsc-fetcher",
            name: "GSC Fetcher",
            role: "Data Collector",
            status: "scheduled",
            nextRun: "2026-04-01 09:07 ET",
            description:
              "Fetches 28 days of Search Console data — clicks, impressions, CTR, positions.",
            duties: [
              "Fetches current 28-day performance data from Google Search Console (clicks, impressions, CTR, avg position)",
              "Fetches prior 28-day period for comparison (period-over-period trends)",
              "Pulls data by two dimensions: page-level and query-level",
              "Archives previous week's data for historical trend analysis",
              "Stores results in /seo-data/latest.json and dated backup files",
            ],
            inputs: "Google Search Console API via service account",
            outputs: "Structured performance data: current period, prior period, per-page and per-query breakdowns",
            tools: ["Google Search Console API", "Google Service Account"],
          },
          {
            id: "sb-indexing-inspector",
            name: "Indexing Inspector",
            role: "Index Checker",
            status: "scheduled",
            nextRun: "2026-04-01 09:15 ET",
            description:
              "Checks indexing status of 200 pages via URL Inspection API.",
            duties: [
              "Checks indexing status of 200 pages per run via Google URL Inspection API",
              "Categorizes pages as: indexed, crawled-not-indexed, or errors",
              "Tracks last crawl time and fetch status for each page",
              "Maintains cumulative tracking in /seo-data/inspect-cumulative.json",
              "Identifies newly indexed pages since the last report (wins!)",
              "Calculates overall index rate (% of all pages in Google's index)",
            ],
            inputs: "List of site pages + Google URL Inspection API",
            outputs: "Indexing status per page, newly indexed pages, cumulative index rate",
            tools: ["Google URL Inspection API", "Google Service Account"],
          },
          {
            id: "sb-analyst",
            name: "SEO Analyst",
            role: "Report Writer",
            status: "scheduled",
            nextRun: "2026-04-01 09:25 ET",
            description:
              "Analyzes wins, drops, opportunities, gaps. Attributes movements to SEO changes.",
            duties: [
              "Calculates period-over-period totals (clicks, impressions, CTR, avg position)",
              "Identifies wins: pages that moved up 3+ positions with 20+ impressions",
              "Identifies drops: pages that fell 3+ positions with 20+ impressions",
              "Identifies opportunities: pages at positions 8-20 with low CTR (almost page 1)",
              "Identifies gaps: queries with 50+ impressions but 0 clicks (missing landing pages)",
              "Parses SEO-CHANGELOG.md and connects page movements to deployed SEO changes",
              "Assigns confidence levels to attributions (high/medium/low) based on timing and change type",
              "Flags false correlations: bulk movements (algorithm update?), competing explanations, premature attributions",
              "Generates full markdown report + plain-English email summary",
              "Sends weekly report email to configured recipients",
            ],
            inputs: "GSC performance data, indexing status, SEO-CHANGELOG.md",
            outputs: "Markdown report with wins/drops/opportunities/gaps/attribution + email summary",
            tools: ["Data analysis", "SEO-CHANGELOG parser", "Gmail SMTP"],
          },
          {
            id: "sb-gsc-miner",
            name: "Keyword Miner",
            role: "Opportunity Finder",
            status: "scheduled",
            lastRun: "2026-03-28 06:35 ET",
            nextRun: "2026-03-29 06:35 ET",
            description:
              "Mines GSC for queries with impressions but no clicks. Recommends new pages.",
            duties: [
              "Fetches all search queries from GSC (last 28 days, up to 1,000)",
              "Groups queries by city + service keyword",
              "Identifies queries with 50+ impressions but 0 clicks (no landing page exists for them)",
              "Checks if matching pages were recently created (avoids duplicating recent work)",
              "Recommends new city/service page combinations to generate",
              "Logs recommendations to content-changelog.json",
              "Updates constants.ts to auto-generate new pages on the next build",
            ],
            inputs: "Google Search Console query data (last 28 days)",
            outputs: "List of new city/service page recommendations, auto-updated page config",
            tools: ["Google Search Console API", "Content changelog"],
          },
        ],
      },
    ],
  },
  {
    id: "globalhighlevel",
    name: "GlobalHighLevel.com",
    status: "live",
    path: "~/Developer/projects/marketing/podcast-pipeline/globalhighlevel-site/",
    website: "globalhighlevel.com",
    github: "RecoveryBiometrics/content-autopilot",
    description: "GHL tutorial site + podcast. 80+ tutorials, 380 followers. Affiliate model.",
    teams: [
      {
        id: "ghl-podcast",
        name: "Podcast Production Team",
        businessId: "globalhighlevel",
        skillId: "podcast-pipeline",
        status: "active",
        agents: [
          {
            id: "ghl-scraper",
            name: "Content Scraper",
            role: "Source Finder",
            status: "idle",
            description:
              "Discovers content from website, YouTube, RSS, or web search. Tries sources in priority order.",
            duties: [
              "Tries content sources in configured priority order until it finds unpublished content",
              "Website mode: crawls full site, specific section, or sitemap (up to 500 pages)",
              "YouTube mode: extracts transcripts from channel videos via yt-dlp",
              "RSS mode: parses RSS/Atom feeds, fetches full article if summary is too short (<300 chars)",
              "Manual mode: reads from topics.json or CLI --topic flag, researches via DuckDuckGo",
              "Auto-discovery mode: searches web + Reddit for fresh topics in your niche when other sources are exhausted",
              "Caches all discovered content to prevent re-processing",
              "Skips any content that's already been published as an episode",
            ],
            inputs: "Configured content sources (website URL, YouTube channel, RSS feed, topic list, or niche keyword)",
            outputs: "Content object with: title, body text, source URL, source type",
            tools: ["Web scraper", "yt-dlp", "RSS parser", "DuckDuckGo search"],
          },
          {
            id: "ghl-notebooklm",
            name: "Audio Producer",
            role: "Podcast Generator",
            status: "idle",
            description:
              "Sends content to NotebookLM. Generates natural two-host podcast conversation.",
            duties: [
              "Creates a temporary text file with the episode content",
              "Uses browser automation (Playwright) to interact with Google NotebookLM",
              "Creates a new NotebookLM notebook with the episode title",
              "Uploads the content as a source document",
              "Triggers 'Generate Audio' — NotebookLM produces a natural two-host conversation",
              "Waits for generation to complete (typically several minutes)",
              "Downloads the finished audio as MP4",
              "Cleans up the temporary notebook and files",
            ],
            inputs: "Content object (title + body) from the Content Scraper",
            outputs: "MP4 audio file saved to data/audio/{title}.mp4",
            tools: ["Google NotebookLM", "Playwright (browser automation)"],
            cost: "Free (3 eps/day) or $20/mo Plus (20 eps/day)",
          },
          {
            id: "ghl-seo-writer",
            name: "SEO Writer",
            role: "Metadata Optimizer",
            status: "idle",
            description:
              "Claude writes optimized episode title, description, and tags.",
            duties: [
              "Takes the original content title and first 2,000 characters of body",
              "Writes an SEO-optimized episode title (50-70 characters, varied phrasing)",
              "Writes a compelling podcast app description (150-250 characters)",
              "Generates 5-8 keyword tags for discoverability",
              "If Claude API is not configured, falls back to using the original title and a trimmed description",
            ],
            inputs: "Original content title, body excerpt, podcast name, niche",
            outputs: "SEO metadata: optimized title, description, and keyword tags",
            tools: ["Claude API (Haiku)"],
            cost: "~$0.003 per episode",
          },
          {
            id: "ghl-transcriber",
            name: "Transcriber",
            role: "Audio-to-Text",
            status: "idle",
            description:
              "Gemini transcribes audio with speaker labels for search and accessibility.",
            duties: [
              "Uploads the MP4 audio file to Gemini API",
              "Sends a transcription prompt requesting full accuracy with speaker labels",
              "Returns complete transcript text with Host 1 / Host 2 labels",
              "Enables full-text search within podcast apps (listeners can search for topics)",
              "Improves accessibility for hearing-impaired listeners",
              "Cleans up the uploaded file from Gemini after transcription",
              "Optional — pipeline continues without transcription if this fails or is disabled",
            ],
            inputs: "MP4 audio file from the Audio Producer",
            outputs: "Full transcript text with speaker labels",
            tools: ["Google Gemini 2.0 Flash"],
            cost: "~$0.05/day",
          },
          {
            id: "ghl-publisher",
            name: "Publisher",
            role: "Distribution",
            status: "idle",
            description:
              "Uploads to Transistor.fm. Auto-distributes to Spotify, Apple, Amazon.",
            duties: [
              "Requests an authorized upload URL from Transistor.fm API",
              "Uploads the audio file directly to Transistor's S3 storage",
              "Creates the episode record with: SEO title, HTML description, tags, transcript, and audio URL",
              "Sets episode status to 'published' (immediately live)",
              "Transistor automatically distributes to: Spotify, Apple Podcasts, Amazon Music, Google Podcasts",
              "Returns the episode's share URL and embeddable HTML player",
              "Logs the episode to published.json to prevent re-processing",
            ],
            inputs: "Audio file, SEO metadata (title, description, tags), transcript text",
            outputs: "Published episode with: Transistor ID, share URL, embed HTML",
            tools: ["Transistor.fm API"],
            cost: "$19/mo (Transistor hosting)",
          },
        ],
      },
      {
        id: "ghl-blog",
        name: "Blog Production Team",
        businessId: "globalhighlevel",
        skillId: "podcast-pipeline",
        status: "active",
        agents: [
          {
            id: "ghl-researcher",
            name: "Researcher",
            role: "Web + Reddit Scraper",
            status: "idle",
            description:
              "Searches DuckDuckGo and targeted subreddits for related content and discussions.",
            duties: [
              "Searches DuckDuckGo for '{episode title} {niche}' — pulls top 5 results with snippets",
              "Searches targeted subreddits relevant to the niche for real discussions and opinions",
              "Searches general Reddit via 'site:reddit.com {title}' for broader community takes",
              "Compiles SERP snippets + Reddit thread summaries into a structured research package",
              "Gives the Blog Writer real data and community perspectives to reference (not just AI-generated fluff)",
            ],
            inputs: "Episode title, podcast niche, configured subreddits",
            outputs: "Research object with: SERP results (title, snippet, URL) + Reddit discussions",
            tools: ["DuckDuckGo search", "Reddit scraper"],
          },
          {
            id: "ghl-blog-writer",
            name: "Blog Writer",
            role: "SEO Content Writer",
            status: "idle",
            description:
              "Claude writes 800-1200 word SEO blog post with TOC, FAQ, pro tips, and podcast embed.",
            duties: [
              "Writes 800-1,200 word SEO blog post using the episode content + research findings",
              "Structures with H2/H3 headings optimized for search",
              "Generates a clickable table of contents with anchor links",
              "Includes a 'Pro Tip' callout box highlighting key actionable advice",
              "Writes an FAQ section using <details> tags (expandable Q&A)",
              "Embeds the Transistor podcast player so readers can listen inline",
              "Places affiliate link CTA twice if configured (mid-article and end)",
              "Assigns a category from the configured category list",
              "Uses a conversational, expert tone — not robotic or generic",
            ],
            inputs: "Episode content, SEO metadata, research findings, podcast embed HTML, affiliate link",
            outputs: "Full HTML blog post + assigned category",
            tools: ["Claude API (Haiku)"],
            cost: "~$0.01 per post",
          },
          {
            id: "ghl-fact-checker",
            name: "Fact Checker",
            role: "Content Validator",
            status: "idle",
            description:
              "Claude validates facts, catches fabricated stats, checks product names and pricing claims.",
            duties: [
              "Reviews the entire blog post for factual accuracy",
              "Catches fabricated or made-up statistics (a common AI hallucination)",
              "Verifies product and company name spellings",
              "Checks any pricing claims against known data",
              "Flags potential legal or compliance issues",
              "Applies custom fact-check rules if configured (e.g., 'never mention competitor X')",
              "Can apply region-specific verification if TARGET_MARKET is set",
              "Returns corrected HTML if issues are found, or passes the original through if clean",
            ],
            inputs: "Blog post HTML from the Blog Writer",
            outputs: "Passed/failed verdict, corrected HTML, list of specific issues found",
            tools: ["Claude API (Haiku)"],
          },
        ],
      },
    ],
  },
  {
    id: "hatch",
    name: "Hatch Investments",
    status: "building",
    path: "~/Projects/hatch-investments/",
    website: "localhost:3000",
    github: "RecoveryBiometrics/hatch-investments",
    description: "AI operations platform for RE syndicators. OM Builder built, needs deploy.",
    teams: [
      {
        id: "hatch-om",
        name: "OM Builder Team",
        businessId: "hatch",
        skillId: "om-generation",
        status: "idle",
        agents: [
          {
            id: "hatch-scraper",
            name: "County Scraper",
            role: "Data Collector",
            status: "idle",
            description:
              "Scrapes Hamilton County Auditor for 25 fields from parcel ID.",
            duties: [
              "Takes a parcel ID and queries the Hamilton County Auditor website (wedge.hcauditor.org)",
              "Extracts 25 property data fields: square footage, year built, tax amount, zoning, lot size, etc.",
              "Handles multi-parcel lookups for properties spanning multiple parcels",
              "Returns structured property data that feeds the OM Generator",
              "No API key needed — scrapes public county records",
            ],
            inputs: "Parcel ID (e.g., 076-0002-0138-00)",
            outputs: "Structured property data: 25 fields including sqft, year built, tax, zoning, lot size, assessed value",
            tools: ["Hamilton County Auditor website scraper"],
          },
          {
            id: "hatch-generator",
            name: "OM Generator",
            role: "Document Writer",
            status: "idle",
            description:
              "Claude generates 11 OM sections in 43 seconds using Haiku 3.5.",
            duties: [
              "Takes property data + deal details from the 8-step wizard",
              "Generates 11 professional OM sections using Claude Haiku 3.5",
              "Sections include: executive summary, property overview, financial analysis, market analysis, etc.",
              "Uses investment-grade language and formatting standards",
              "Calculates NOI, cap rate, debt service coverage from wizard inputs",
              "Generates in ~43 seconds total (~4 seconds per section)",
              "Each section can be individually regenerated from the editor",
            ],
            inputs: "Property data from County Scraper + deal details from 8-step wizard (price, units, rents, expenses)",
            outputs: "11 complete OM sections ready for editing",
            tools: ["Claude API (Haiku 3.5)"],
            cost: "~$0.15 per OM (charging clients $9 = 98% margin)",
          },
          {
            id: "hatch-pdf",
            name: "PDF Builder",
            role: "Document Export",
            status: "idle",
            description:
              "Puppeteer renders investment-grade branded PDF from generated content.",
            duties: [
              "Takes the finalized OM content from the WYSIWYG editor",
              "Renders a professional, investment-grade branded PDF using Puppeteer",
              "Applies the premium PDF template with Hatch branding",
              "Handles photo placement (drag-and-drop images from the editor)",
              "Generates table of contents with page numbers",
              "Optimizes for printing and digital viewing",
            ],
            inputs: "Finalized OM content from the WYSIWYG editor (HTML)",
            outputs: "Investment-grade branded PDF file",
            tools: ["Puppeteer (headless Chrome PDF rendering)"],
          },
        ],
      },
    ],
  },
  {
    id: "reiamplifi",
    name: "REI Amplifi",
    status: "live",
    path: "~/Projects/reiamplifi/",
    description: "Parent agency. 3.5 years on GHL. Serves RE syndicators + recovery/behavioral health.",
    teams: [
      {
        id: "rei-pipeline",
        name: "GHL Pipeline",
        businessId: "reiamplifi",
        skillId: "ghl-integration",
        status: "active",
        agents: [
          {
            id: "rei-ghl",
            name: "GHL Automator",
            role: "Pipeline Manager",
            status: "active",
            lastRun: "always-on",
            description:
              "Runs on IONOS VPS. Fully automated GHL pipeline handling.",
            duties: [
              "Runs 24/7 on IONOS VPS — always on, always processing",
              "Handles GoHighLevel pipeline automations for the agency",
              "Processes webhook events when deals move between pipeline stages",
              "Triggers downstream automations (emails, tasks, notifications)",
              "Manages CRM data flow between GHL and external systems",
            ],
            inputs: "GHL webhook events (pipeline stage changes, form submissions, etc.)",
            outputs: "Automated pipeline actions, CRM updates, triggered workflows",
            tools: ["GoHighLevel API", "IONOS VPS"],
          },
        ],
      },
    ],
  },
  {
    id: "podcast-pipeline",
    name: "Podcast Pipeline (Engine)",
    status: "live",
    path: "~/Developer/projects/podcast-pipeline/",
    github: "RecoveryBiometrics/content-autopilot",
    description: "The core podcast engine. Powers GlobalHighLevel and future podcast clients.",
    teams: [
      {
        id: "pp-core",
        name: "Core Pipeline Team",
        businessId: "podcast-pipeline",
        skillId: "podcast-pipeline",
        status: "active",
        agents: [
          {
            id: "pp-scheduler",
            name: "Scheduler",
            role: "Orchestrator",
            status: "active",
            description:
              "Runs 25-hour cycles. Triggers content discovery, audio generation, publishing, and blog creation.",
            duties: [
              "Runs continuously with configurable cycle intervals (default: 25 hours, synced to NotebookLM daily limit reset)",
              "Each cycle: triggers content discovery → audio generation → SEO → transcription → publishing → blog",
              "Processes up to EPISODES_PER_DAY episodes per cycle (default 3, max 20 with Plus)",
              "Tracks last run time in scheduler-state.json to enforce cycle intervals",
              "Counts successes and failures from each run",
              "Sends optional daily email summary of what was published",
              "Logs all activity to logs/scheduler.log with timestamps",
              "Can run in background: nohup python3 scheduler.py &",
            ],
            inputs: "Cycle timer + all configured content sources",
            outputs: "Orchestrates the full pipeline — triggers all other agents in sequence",
            tools: ["Python scheduler", "Gmail SMTP (optional daily summary)"],
          },
          {
            id: "pp-discoverer",
            name: "Auto-Discoverer",
            role: "Topic Finder",
            status: "idle",
            description:
              "Searches web and Reddit for fresh topics when all other content sources are exhausted.",
            duties: [
              "Activates as a fallback when website, YouTube, RSS, and manual topics are all exhausted",
              "Generates 12 dynamic search queries based on your niche (tips, mistakes, how-to, trends, FAQs, etc.)",
              "Searches DuckDuckGo for each query to find relevant articles and discussions",
              "Searches Reddit (via site:reddit.com operator) for community discussions in your niche",
              "Scrapes Reddit threads for real user opinions and discussion context",
              "Prevents duplicate topics by checking 70%+ word overlap with already-published episode titles",
              "Caches discovered topics in data/discovered-topics.json",
            ],
            inputs: "Podcast niche keyword, configured subreddits",
            outputs: "Fresh topic with title, research context, and source URLs",
            tools: ["DuckDuckGo search", "Reddit scraper"],
          },
          {
            id: "pp-site-builder",
            name: "Site Builder",
            role: "Static Site Generator",
            status: "idle",
            description:
              "Builds blog from published posts — homepage, post pages, categories, sitemap, robots.txt, llms.txt.",
            duties: [
              "Reads all published blog posts from site/posts/*.json",
              "Auto-discovers categories from post metadata",
              "Generates homepage with responsive post grid",
              "Generates individual post pages at blog/{slug}/index.html",
              "Generates category listing pages at category/{slug}/index.html",
              "Generates sitemap.xml for search engine discovery",
              "Generates robots.txt with crawler directives",
              "Generates llms.txt for AI model discovery",
              "Applies configurable theme (dark/light), accent color, and Google Font",
              "Outputs everything to site/public/ — ready for any static host",
            ],
            inputs: "Blog post JSON files from the Blog Writer",
            outputs: "Complete static site: HTML pages, sitemap, robots.txt, llms.txt",
            tools: ["Python static site generator"],
          },
        ],
      },
    ],
  },
  {
    id: "mailer",
    name: "Mailer Dashboard",
    status: "building",
    path: "~/Developer/projects/marketing/mailer-dashboard/",
    description: "Email campaign management with Claude AI. In development.",
    teams: [],
  },
  {
    id: "recovery",
    name: "Recovery Biometrics",
    status: "paused",
    path: "~/Projects/recovery-biometrics/",
    description: "Oura Ring + FeatherStone biometrics for recovery. Low priority.",
    teams: [],
  },
];

// ─── SUMMARY STATS ─────────────────────────────────────────────
export function getStats() {
  const allTeams = businesses.flatMap((b) => b.teams);
  const allAgents = allTeams.flatMap((t) => t.agents);
  const activeAgents = allAgents.filter(
    (a) => a.status === "active" || a.status === "scheduled"
  );

  return {
    totalBusinesses: businesses.length,
    liveBusinesses: businesses.filter((b) => b.status === "live").length,
    totalTeams: allTeams.length,
    activeTeams: allTeams.filter(
      (t) => t.status === "active" || t.status === "scheduled"
    ).length,
    totalAgents: allAgents.length,
    activeAgents: activeAgents.length,
    totalSkills: skills.length,
    readySkills: skills.filter((s) => s.configurable).length,
  };
}
