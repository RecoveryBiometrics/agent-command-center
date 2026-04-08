/**
 * Stage 4: Fact Check + SEO Audit
 *
 * Validates content before deployment. Same rules as seo-content pipeline.
 */
const fs = require('fs');
const path = require('path');

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
 * Run all checks on an article.
 * Returns { pass, issues }
 */
function checkArticle(article, config) {
  const issues = [];

  // --- Fact checks ---
  const placeholders = ['[CITY]', '[STATE]', '[COUNTY]', 'Lorem ipsum', 'TODO', '[INSERT'];
  for (const ph of placeholders) {
    if (article.body.includes(ph) || article.title.includes(ph)) {
      issues.push(`BLOCK: Placeholder "${ph}" found`);
    }
  }

  if (article.body.length < 200) {
    issues.push(`BLOCK: Body too short (${article.body.length} chars, min 200)`);
  }

  if (!article.excerpt || article.excerpt.length < 20) {
    issues.push(`BLOCK: Excerpt too short (${(article.excerpt || '').length} chars, min 20)`);
  }

  // --- SEO audit ---
  if (article.title.length > 70) {
    issues.push(`WARN: Title too long (${article.title.length} chars, max 70)`);
  }

  if (article.excerpt && article.excerpt.length > 160) {
    issues.push(`WARN: Excerpt too long (${article.excerpt.length} chars, max 160)`);
  }

  if (!/^[a-z0-9-]+$/.test(article.slug)) {
    issues.push(`BLOCK: Invalid slug format: "${article.slug}"`);
  }

  // --- Cross-content similarity ---
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

  // --- Slug collision ---
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

  const blocking = issues.filter(i => i.startsWith('BLOCK:'));

  return {
    pass: blocking.length === 0,
    issues,
  };
}

module.exports = { checkArticle };
