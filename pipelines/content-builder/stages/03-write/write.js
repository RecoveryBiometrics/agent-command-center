/**
 * Stage 3: Write Content
 *
 * Takes a research brief (with real SERP + Reddit data) and produces
 * a full article — 800+ words, proper structure, real data.
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
 * Build SERP + Reddit context strings for the writer prompt.
 */
function buildResearchContext(researchResult) {
  const serpContext = (researchResult.serpResults || []).length > 0
    ? researchResult.serpResults.map(r => `- "${r.title}": ${r.snippet}`).join('\n')
    : '';

  const redditContext = (researchResult.redditQuestions || []).length > 0
    ? researchResult.redditQuestions.map(q => `- ${q}`).join('\n')
    : '';

  let context = '';
  if (serpContext) context += `\nWHAT'S CURRENTLY RANKING:\n${serpContext}\n`;
  if (redditContext) context += `\nREAL QUESTIONS PEOPLE ASK:\n${redditContext}\n`;
  return context;
}

/**
 * Write an article from a research brief.
 */
// Language-specific writing instructions
const LANG_INSTRUCTIONS = {
  en: 'Write in English.',
  es: `Write in Latin American Spanish (español latinoamericano).
- Use "tú" (informal), not "usted"
- Mention WhatsApp as the primary communication tool (not SMS)
- Mention MercadoPago, Conekta, or Stripe for payments
- Include pricing in USD with approximate MXN/COP equivalents
- Write naturally — NOT a translation from English`,
  'en-IN': `Write in English for the Indian market.
- Mention WhatsApp as the primary communication tool (saves SMS costs)
- Mention Razorpay, PayU, UPI for payments
- Include pricing in USD with INR equivalents (₹)
- Reference Indian cities and business types where relevant
- Mention DPDP Act for compliance context`,
  ar: `Write in Modern Standard Arabic (فصحى).
- Wrap content in <div dir="rtl" style="text-align:right">
- Mention WhatsApp as primary business communication
- Mention PayTabs, Tap Payments for payment processing
- Include pricing in USD with AED/SAR/EGP equivalents
- Reference UAE, Saudi Arabia, Egypt where relevant`,
};

async function writeArticle(researchResult, config) {
  const { keyword, brief, pageType } = researchResult;
  const language = researchResult.language || 'en';
  const langInstructions = LANG_INSTRUCTIONS[language] || LANG_INSTRUCTIONS.en;

  // Read references (full — not truncated)
  const voicePath = path.join(__dirname, '../../references/voice.md');
  const seoPath = path.join(__dirname, '../../references/seo-rules.md');
  const voice = fs.existsSync(voicePath) ? fs.readFileSync(voicePath, 'utf8') : '';
  const seoRules = fs.existsSync(seoPath) ? fs.readFileSync(seoPath, 'utf8') : '';

  const date = new Date().toISOString().split('T')[0];
  const researchContext = buildResearchContext(researchResult);

  // Build business-specific context
  const brandContext = [
    config.BRAND.name ? `Business: ${config.BRAND.name}` : '',
    config.BRAND.pricing_text ? `Pricing: ${config.BRAND.pricing_text}` : '',
    config.BRAND.phone_display ? `Phone: ${config.BRAND.phone_display}` : '',
    config.BRAND.cta ? `CTA: ${config.BRAND.cta}` : '',
    config.BRAND.voice ? `Voice: ${config.BRAND.voice}` : '',
  ].filter(Boolean).join('\n');

  const trustSignals = (config.BRAND.trust_signals || []).length > 0
    ? `Trust signals to weave in: ${config.BRAND.trust_signals.join(', ')}`
    : '';

  const client = getClient();
  const response = await client.messages.create({
    model: config.MODEL,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Write a comprehensive article for "${config.BRAND.name}" based on the research below.

LANGUAGE: ${langInstructions}

KEYWORD: "${keyword}"
PAGE TYPE: ${pageType}

RESEARCH BRIEF:
${brief}
${researchContext}

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences:
{
  "title": "string (max 60 chars, include keyword)",
  "slug": "string (lowercase-hyphenated, max 6 words)",
  "excerpt": "string (120-160 chars, used as meta description, include keyword + CTA)",
  "body": "string (800+ words, HTML allowed: <h2>, <p>, <ul>, <li>, <strong>)",
  "category": "safety-tip | local-news | community | seasonal | stats",
  "faq": [{"q": "question", "a": "answer"}]
}

CONTENT REQUIREMENTS:
- MINIMUM 800 words in the body — this must be a real, substantial page
- Start with a compelling intro paragraph (no heading)
- Use 3-4 H2 sections with descriptive headings (include keyword variants)
- Include a FAQ section with 3-5 questions drawn from the research
- Mention the city/area name at least 2 times if this is location content
- End with a clear CTA paragraph
- Write for humans — answer the questions real people are asking
- Include specific, verifiable facts from the research (not made up)
${trustSignals ? `- ${trustSignals}` : ''}

BRAND & VOICE:
${brandContext}

${voice}

SEO RULES:
${seoRules}

CRITICAL:
- Body MUST be 800+ words. Short content will be rejected.
- Use real data from the research brief — don't fabricate statistics
- Write naturally, not like AI. If it sounds like ChatGPT, rewrite.
- Return ONLY the JSON object, nothing else`,
    }],
  });

  let articleData;
  try {
    let text = response.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    articleData = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse article JSON from Claude: ${e.message}`);
  }

  // Build FAQ HTML if present
  let bodyWithFaq = articleData.body || '';
  if (articleData.faq && articleData.faq.length > 0) {
    const faqHtml = articleData.faq.map(f =>
      `<h3>${f.q}</h3>\n<p>${f.a}</p>`
    ).join('\n');
    // Only append if body doesn't already contain FAQ
    if (!bodyWithFaq.toLowerCase().includes('frequently asked') && !bodyWithFaq.toLowerCase().includes('faq')) {
      bodyWithFaq += `\n<h2>Frequently Asked Questions</h2>\n${faqHtml}`;
    }
  }

  // Build the full article object
  const article = {
    id: `${date}-${String(Math.floor(Math.random() * 900) + 100)}`,
    title: (articleData.title || keyword).slice(0, 70),
    slug: slugify(articleData.slug || articleData.title || keyword),
    date,
    excerpt: (articleData.excerpt || '').slice(0, 160),
    body: bodyWithFaq,
    category: articleData.category || 'safety-tip',
    sourceUrl: '',
    relatedLinks: [], // Filled by stage 05
  };

  const wordCount = article.body.split(/\s+/).length;
  console.log(`  Wrote: "${article.title}" (${wordCount} words, ${article.category})`);

  if (wordCount < 400) {
    console.log(`  WARNING: Only ${wordCount} words — below 800 target. Will retry if check fails.`);
  }

  return article;
}

module.exports = { writeArticle };
