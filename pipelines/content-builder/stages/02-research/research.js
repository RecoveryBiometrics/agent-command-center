/**
 * Stage 2: Research Keyword
 *
 * Takes a classified TODO (gap type) and researches the keyword using:
 *   1. DuckDuckGo SERP scrape (what's ranking now)
 *   2. Reddit questions (what real people ask)
 *   3. Existing site content (what we already cover)
 *   4. Claude brief generation with all that context
 */
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { scrapeDuckDuckGo, scrapeReddit } = require('../../lib/scrape');

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

/**
 * Check if a keyword is already targeted by an existing page.
 */
function checkCannibalization(keyword, constants) {
  const lower = keyword.toLowerCase();

  // Check services
  for (const service of constants.services) {
    if (service.name.toLowerCase().includes(lower) || lower.includes(service.slug.replace(/-/g, ' '))) {
      return { exists: true, type: 'service', slug: service.slug, name: service.name };
    }
  }

  // Check locations
  for (const county of constants.counties) {
    for (const city of county.cities) {
      if (lower.includes(city.name.toLowerCase()) && lower.includes(city.state.toLowerCase())) {
        return { exists: true, type: 'location', slug: city.slug, name: city.name };
      }
    }
  }

  return { exists: false };
}

/**
 * Determine what type of page this keyword needs.
 */
function classifyKeyword(keyword) {
  const lower = keyword.toLowerCase();

  // Location keywords contain city/state names
  const statePatterns = /\b(pa|de|md|nv|sc|pennsylvania|delaware|maryland|nevada|south carolina)\b/i;
  if (statePatterns.test(lower)) return 'location';

  // Service keywords are about the product/installation
  const servicePatterns = /\b(install|grab bar|shower|bathtub|rail|toilet|seat|handheld|stair|railing|ada|handicap|safety)\b/i;
  if (servicePatterns.test(lower)) return 'service';

  // Default to informational article
  return 'article';
}

/**
 * Scan existing content to understand what we already cover on this topic.
 */
function getExistingCoverage(keyword, newsDir) {
  const lower = keyword.toLowerCase();
  const related = [];

  try {
    const files = fs.readdirSync(newsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const articles = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
      if (!Array.isArray(articles)) continue;
      for (const a of articles) {
        const titleMatch = (a.title || '').toLowerCase().includes(lower);
        const bodyMatch = (a.body || '').toLowerCase().includes(lower);
        if (titleMatch || bodyMatch) {
          related.push({ title: a.title, slug: a.slug, category: a.category });
        }
      }
    }
  } catch { /* no existing content — fine */ }

  return related.slice(0, 5);
}

/**
 * Get subreddits from business config or use defaults.
 */
function getSubreddits(config) {
  // Business YAML may have content.subreddits
  if (config.SUBREDDITS && config.SUBREDDITS.length > 0) {
    return config.SUBREDDITS;
  }
  // Fallback defaults
  return ['HomeImprovement', 'AgingParents', 'eldercare', 'AskReddit'];
}

/**
 * Research a keyword and produce a content brief with real data.
 */
async function research(todo, config, constants) {
  const keyword = todo.keyword;

  // Check for cannibalization
  const cannibal = checkCannibalization(keyword, constants);
  if (cannibal.exists) {
    console.log(`  Keyword "${keyword}" already targeted by ${cannibal.type}: ${cannibal.name}`);
    return {
      skip: true,
      reason: `Already targeted by ${cannibal.type} page: ${cannibal.name}`,
    };
  }

  const pageType = classifyKeyword(keyword);

  // ── Real web research ──────────────────────────────────────────
  console.log('  Researching: SERP + Reddit + existing content...');

  // 1. Scrape DuckDuckGo for what's currently ranking
  const serpResults = await scrapeDuckDuckGo(keyword, 5);

  // 2. Scrape Reddit for real user questions
  const subreddits = getSubreddits(config);
  const redditQuestions = await scrapeReddit(keyword, subreddits, 5);

  // 3. Check what we already cover on this topic
  const existingCoverage = getExistingCoverage(keyword, config.LOCAL_NEWS_DIR);

  // ── Build context strings ──────────────────────────────────────
  const serpContext = serpResults.length > 0
    ? serpResults.map(r => `- "${r.title}": ${r.snippet}`).join('\n')
    : 'No SERP data available — write from expertise.';

  const redditContext = redditQuestions.length > 0
    ? redditQuestions.map(q => `- ${q}`).join('\n')
    : 'No Reddit questions found.';

  const existingContext = existingCoverage.length > 0
    ? existingCoverage.map(a => `- "${a.title}" (${a.category})`).join('\n')
    : 'No existing content on this topic.';

  // Read voice + SEO references (full, not truncated)
  const voicePath = path.join(__dirname, '../../references/voice.md');
  const seoPath = path.join(__dirname, '../../references/seo-rules.md');
  const voice = fs.existsSync(voicePath) ? fs.readFileSync(voicePath, 'utf8') : '';
  const seoRules = fs.existsSync(seoPath) ? fs.readFileSync(seoPath, 'utf8') : '';

  // ── Generate brief with real data ──────────────────────────────
  const client = getClient();
  const response = await client.messages.create({
    model: config.MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a content researcher for "${config.BRAND.name}".

KEYWORD: "${keyword}"
IMPRESSIONS: ${todo.impressions}/month (people searching this)
PAGE TYPE NEEDED: ${pageType}

WHAT'S CURRENTLY RANKING (DuckDuckGo top results):
${serpContext}

REAL QUESTIONS PEOPLE ASK (Reddit):
${redditContext}

OUR EXISTING CONTENT ON THIS TOPIC:
${existingContext}

BRAND CONTEXT:
${voice}

SEO RULES:
${seoRules}

BUSINESS DETAILS:
- Name: ${config.BRAND.name}
- CTA: ${config.BRAND.cta || ''}
- Pricing: ${config.BRAND.pricing_text || config.BRAND.pricing || ''}
- Phone: ${config.BRAND.phone_display || config.BRAND.phone || ''}

Produce a detailed content brief:

1. TOPIC: What this keyword is really about (2-3 sentences, informed by SERP data)
2. SEARCH INTENT: What the searcher wants — information, a service, a comparison, etc.
3. AUDIENCE: Who searches for this and what stage they're in (awareness, consideration, decision)
4. KEY QUESTIONS TO ANSWER: 5 questions drawn from Reddit + SERP data (real questions, not made up)
5. COMPETITOR ANGLE: What the top-ranking pages cover that we should cover better
6. LOCAL ANGLE: How to tie this to our local service area
7. SUGGESTED STRUCTURE: H1, 3-4 H2 sections, FAQ section if applicable
8. SUGGESTED TITLE: Under 60 characters, includes keyword
9. SUGGESTED CATEGORY: One of: safety-tip, local-news, community, seasonal, stats
10. SOURCES: List any facts, stats, or claims from the SERP data that we can reference

Be specific. This brief will guide a writer to create an 800+ word page.`,
    }],
  });

  const brief = response.content[0].text;

  console.log(`  Researched: "${keyword}" → ${pageType} page (${serpResults.length} SERP, ${redditQuestions.length} Reddit)`);

  return {
    skip: false,
    pageType,
    keyword,
    impressions: todo.impressions,
    position: todo.position,
    brief,
    serpResults,
    redditQuestions,
    existingCoverage,
    todo,
  };
}

module.exports = { research, classifyKeyword, checkCannibalization };
