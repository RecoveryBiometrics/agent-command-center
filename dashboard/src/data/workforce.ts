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
          },
          {
            id: "sb-indexing-inspector",
            name: "Indexing Inspector",
            role: "Index Checker",
            status: "scheduled",
            nextRun: "2026-04-01 09:15 ET",
            description:
              "Checks indexing status of 200 pages via URL Inspection API.",
          },
          {
            id: "sb-analyst",
            name: "SEO Analyst",
            role: "Report Writer",
            status: "scheduled",
            nextRun: "2026-04-01 09:25 ET",
            description:
              "Analyzes wins, drops, opportunities, gaps. Attributes movements to SEO changes.",
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
          },
          {
            id: "ghl-notebooklm",
            name: "Audio Producer",
            role: "Podcast Generator",
            status: "idle",
            description:
              "Sends content to NotebookLM. Generates natural two-host podcast conversation.",
          },
          {
            id: "ghl-seo-writer",
            name: "SEO Writer",
            role: "Metadata Optimizer",
            status: "idle",
            description:
              "Claude writes optimized episode title, description, and tags.",
          },
          {
            id: "ghl-transcriber",
            name: "Transcriber",
            role: "Audio-to-Text",
            status: "idle",
            description:
              "Gemini transcribes audio with speaker labels for search and accessibility.",
          },
          {
            id: "ghl-publisher",
            name: "Publisher",
            role: "Distribution",
            status: "idle",
            description:
              "Uploads to Transistor.fm. Auto-distributes to Spotify, Apple, Amazon.",
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
          },
          {
            id: "hatch-generator",
            name: "OM Generator",
            role: "Document Writer",
            status: "idle",
            description:
              "Claude generates 11 OM sections in 43 seconds using Haiku 3.5.",
          },
          {
            id: "hatch-pdf",
            name: "PDF Builder",
            role: "Document Export",
            status: "idle",
            description:
              "Puppeteer renders investment-grade branded PDF from generated content.",
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
    teams: [],
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
