/**
 * Stage 3: Write Content
 *
 * Takes a research brief and produces an article JSON object.
 * Uses Claude Haiku for generation.
 */
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
    .slice(0, 60);
}

/**
 * Write an article from a research brief.
 */
async function writeArticle(researchResult, config) {
  const { keyword, brief, pageType } = researchResult;

  // Read references
  const voicePath = path.join(__dirname, '../../references/voice.md');
  const seoPath = path.join(__dirname, '../../references/seo-rules.md');
  const voice = fs.existsSync(voicePath) ? fs.readFileSync(voicePath, 'utf8') : '';
  const seoRules = fs.existsSync(seoPath) ? fs.readFileSync(seoPath, 'utf8') : '';

  const date = new Date().toISOString().split('T')[0];

  const client = getClient();
  const response = await client.messages.create({
    model: config.MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Write a local news/safety article for "${config.BRAND.name}".

KEYWORD: "${keyword}"
RESEARCH BRIEF:
${brief}

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences:
{
  "title": "string (max 60 chars, include keyword)",
  "slug": "string (lowercase-hyphenated, max 6 words)",
  "excerpt": "string (50-160 chars, used as meta description)",
  "body": "string (300+ chars, 2-3 paragraphs, mention the topic naturally)",
  "category": "safety-tip | local-news | community | seasonal | stats"
}

VOICE RULES:
${voice.slice(0, 800)}

SEO RULES:
${seoRules.slice(0, 500)}

IMPORTANT:
- Body must be 300+ characters
- Title must be under 60 characters
- Excerpt must be 50-160 characters
- Do NOT include any markdown formatting in the body
- Write naturally, not like AI
- Return ONLY the JSON object, nothing else`,
    }],
  });

  let articleData;
  try {
    // Strip any markdown fences if present
    let text = response.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    articleData = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse article JSON from Claude: ${e.message}`);
  }

  // Build the full article object
  const article = {
    id: `${date}-${String(Math.floor(Math.random() * 900) + 100)}`,
    title: (articleData.title || keyword).slice(0, 70),
    slug: slugify(articleData.slug || articleData.title || keyword),
    date,
    excerpt: (articleData.excerpt || '').slice(0, 160),
    body: articleData.body || '',
    category: articleData.category || 'safety-tip',
    sourceUrl: '',
    relatedLinks: [], // Filled by stage 05
  };

  console.log(`  Wrote: "${article.title}" (${article.body.length} chars, ${article.category})`);

  return article;
}

module.exports = { writeArticle };
