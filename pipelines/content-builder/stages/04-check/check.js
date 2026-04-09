/**
 * Stage 4: Fact Check + SEO Audit
 *
 * Two layers:
 *   1. Structural validation (placeholders, length, similarity, slug)
 *   2. Claude fact-check (verify claims against SERP data + business config)
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
 * Calculate word overlap similarity between two texts.
 */
function similarity(textA, textB) {
  const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return Math.round((overlap / union) * 100);
}

/**
 * Run structural checks on an article.
 */
function structuralCheck(article, config) {
  const issues = [];

  // Placeholders
  const placeholders = ['[CITY]', '[STATE]', '[COUNTY]', 'Lorem ipsum', 'TODO', '[INSERT'];
  for (const ph of placeholders) {
    if (article.body.includes(ph) || article.title.includes(ph)) {
      issues.push(`BLOCK: Placeholder "${ph}" found`);
    }
  }

  // Word count (upgraded from 200 chars to 400 words minimum)
  const wordCount = article.body.split(/\s+/).length;
  if (wordCount < 400) {
    issues.push(`BLOCK: Body too short (${wordCount} words, min 400)`);
  }

  if (!article.excerpt || article.excerpt.length < 20) {
    issues.push(`BLOCK: Excerpt too short (${(article.excerpt || '').length} chars, min 20)`);
  }

  // SEO audit
  if (article.title.length > 70) {
    issues.push(`WARN: Title too long (${article.title.length} chars, max 70)`);
  }

  if (article.excerpt && article.excerpt.length > 160) {
    issues.push(`WARN: Excerpt too long (${article.excerpt.length} chars, max 160)`);
  }

  if (!/^[a-z0-9-]+$/.test(article.slug)) {
    issues.push(`BLOCK: Invalid slug format: "${article.slug}"`);
  }

  // Cross-content similarity
  const newsDir = config.LOCAL_NEWS_DIR;
  if (fs.existsSync(newsDir)) {
    for (const file of fs.readdirSync(newsDir).filter(f => f.endsWith('.json'))) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
        for (const entry of (Array.isArray(existing) ? existing : [])) {
          const sim = similarity(article.body, entry.body);
          if (sim > config.MAX_SIMILARITY) {
            issues.push(`BLOCK: ${sim}% similar to "${entry.title}" in ${file}`);
          }
        }
      } catch { /* skip */ }
    }
  }

  // Slug collision
  if (fs.existsSync(newsDir)) {
    for (const file of fs.readdirSync(newsDir).filter(f => f.endsWith('.json'))) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
        for (const entry of (Array.isArray(existing) ? existing : [])) {
          if (entry.slug === article.slug) {
            issues.push(`BLOCK: Slug "${article.slug}" already exists in ${file}`);
          }
        }
      } catch { /* skip */ }
    }
  }

  return issues;
}

/**
 * Claude-powered fact-check — verifies claims against SERP data + business config.
 */
async function factCheck(article, config, researchData) {
  const issues = [];

  // Build context for the fact-checker
  const serpContext = (researchData?.serpResults || []).length > 0
    ? researchData.serpResults.map(r => `- "${r.title}": ${r.snippet}`).join('\n')
    : 'No SERP data to check against.';

  const brandFacts = [
    config.BRAND.name ? `Business name: ${config.BRAND.name}` : '',
    config.BRAND.pricing_text ? `Correct pricing: ${config.BRAND.pricing_text}` : '',
    config.BRAND.phone_display ? `Correct phone: ${config.BRAND.phone_display}` : '',
    config.BRAND.cta ? `Correct CTA: ${config.BRAND.cta}` : '',
  ].filter(Boolean).join('\n');

  const client = getClient();
  const response = await client.messages.create({
    model: config.MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a fact-checker reviewing an article before it goes live on a business website.

ARTICLE TITLE: "${article.title}"
ARTICLE BODY:
${article.body.slice(0, 3000)}

BUSINESS FACTS (must be correct in the article):
${brandFacts}

WHAT TOP SEARCH RESULTS SAY ABOUT THIS TOPIC:
${serpContext}

Check for:
1. WRONG BUSINESS INFO — wrong phone number, wrong pricing, wrong business name
2. FABRICATED STATISTICS — made-up percentages, fake studies, invented numbers
3. MEDICAL/SAFETY CLAIMS — anything that sounds like medical advice we can't back up
4. LOCATION ERRORS — wrong city names, wrong state, wrong county
5. INCONSISTENCY WITH SERP DATA — claims that contradict what's actually ranking

Return ONLY valid JSON:
{
  "pass": true/false,
  "issues": ["string describing each issue found"],
  "severity": "none" | "minor" | "major"
}

If the article looks good, return {"pass": true, "issues": [], "severity": "none"}.
Be strict — if a stat is cited without a source and looks made up, flag it.`,
    }],
  });

  let result;
  try {
    let text = response.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    result = JSON.parse(text);
  } catch {
    // If we can't parse the response, don't block — just warn
    console.log('  Fact-check: could not parse response — skipping');
    return [];
  }

  if (!result.pass && result.issues) {
    for (const issue of result.issues) {
      const prefix = result.severity === 'major' ? 'BLOCK' : 'WARN';
      issues.push(`${prefix}: FACT-CHECK — ${issue}`);
    }
  }

  return issues;
}

/**
 * Run all checks on an article.
 * Returns { pass, issues }
 */
async function checkArticle(article, config, researchData) {
  // Layer 1: Structural validation
  const structuralIssues = structuralCheck(article, config);

  // Layer 2: Claude fact-check (only if structural checks pass)
  let factIssues = [];
  const structuralBlocks = structuralIssues.filter(i => i.startsWith('BLOCK:'));
  if (structuralBlocks.length === 0) {
    console.log('  Running fact-check...');
    factIssues = await factCheck(article, config, researchData);
  }

  const allIssues = [...structuralIssues, ...factIssues];
  const blocking = allIssues.filter(i => i.startsWith('BLOCK:'));

  if (factIssues.length > 0) {
    console.log(`  Fact-check: ${factIssues.length} issue(s) found`);
    for (const issue of factIssues) {
      console.log(`    ${issue}`);
    }
  }

  return {
    pass: blocking.length === 0,
    issues: allIssues,
  };
}

module.exports = { checkArticle, similarity };
