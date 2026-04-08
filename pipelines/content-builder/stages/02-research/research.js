/**
 * Stage 2: Research Keyword
 *
 * Takes a classified TODO (gap type) and researches the keyword topic.
 * Uses Claude Haiku to generate a content brief.
 */
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

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
 * Research a keyword and produce a content brief.
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

  // Read voice reference for brand context
  const voicePath = path.join(__dirname, '../../references/voice.md');
  const voice = fs.existsSync(voicePath) ? fs.readFileSync(voicePath, 'utf8') : '';

  const client = getClient();
  const response = await client.messages.create({
    model: config.MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a content researcher for a local grab bar installation business called "${config.BRAND.name}".

KEYWORD: "${keyword}"
IMPRESSIONS: ${todo.impressions} (people searching for this)
CURRENT POSITION: ${todo.position}
PAGE TYPE: ${pageType}

Research this keyword and produce a content brief. Include:
1. TOPIC: What this keyword is really about (1 sentence)
2. AUDIENCE: Who searches for this (1 sentence)
3. QUESTIONS: 3 common questions people have about this topic
4. LOCAL ANGLE: How to tie this to a local service business
5. SUGGESTED TITLE: A title under 60 characters
6. SUGGESTED CATEGORY: One of: safety-tip, local-news, community, seasonal, stats

Keep it concise. This brief will be used to write the actual content.

BRAND CONTEXT:
${voice.slice(0, 500)}`,
    }],
  });

  const brief = response.content[0].text;

  console.log(`  Researched: "${keyword}" → ${pageType} page`);

  return {
    skip: false,
    pageType,
    keyword,
    impressions: todo.impressions,
    position: todo.position,
    brief,
    todo,
  };
}

module.exports = { research, classifyKeyword, checkCannibalization };
