/**
 * Stage 7: Optimize Existing Pages
 *
 * Handles "opportunity" TODOs — pages that rank position 8-20 with high
 * impressions but low CTR. Rewrites title + meta description, regenerates
 * internal links.
 *
 * Reuses: addLinks (stage 05), checkArticle (stage 04), sheet utils.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');
const { addLinks } = require('../05-link/link');
const { updateTodoStatus, logToChangelog } = require('../../lib/sheet');

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

/**
 * Find the article JSON file and entry matching a slug.
 * Searches all city JSON files in LOCAL_NEWS_DIR.
 */
function findArticleBySlug(slug, newsDir) {
  // Normalize slug — strip leading slash
  const cleanSlug = slug.replace(/^\//, '').replace(/\/$/, '');

  const files = fs.readdirSync(newsDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(newsDir, file);
    try {
      const articles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(articles)) continue;

      const idx = articles.findIndex(a => {
        const aSlug = (a.slug || '').replace(/^\//, '');
        return aSlug === cleanSlug || cleanSlug.includes(aSlug) || aSlug.includes(cleanSlug);
      });

      if (idx !== -1) {
        return { filePath, file, articles, idx, article: articles[idx] };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Call Claude to rewrite title + excerpt for better CTR.
 */
async function rewriteMeta(article, todo, config) {
  const client = getClient();

  const voicePath = path.join(__dirname, '../../references/voice.md');
  const voice = fs.existsSync(voicePath) ? fs.readFileSync(voicePath, 'utf8').slice(0, 800) : '';

  const response = await client.messages.create({
    model: config.MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Rewrite this page's title and meta description to improve click-through rate.

CURRENT:
  Title: "${article.title}"
  Meta description: "${article.excerpt}"
  Category: ${article.category}

CONTEXT:
  Current SERP position: ${todo.position}
  Monthly impressions: ${todo.impressions}
  Business: ${config.BRAND.name}

RULES:
- Title must be under 60 characters
- Meta description must be 50-160 characters
- Include the primary keyword naturally
- Make it compelling — this page gets ${todo.impressions} impressions but few clicks
- Don't change the meaning, just make it more click-worthy
- Write for humans, not search engines
${voice ? `\nVOICE:\n${voice}` : ''}

Return ONLY valid JSON:
{
  "title": "new title",
  "excerpt": "new meta description",
  "reasoning": "one sentence on what you changed and why"
}`,
    }],
  });

  let result;
  try {
    let text = response.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    result = JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse optimization JSON: ${e.message}`);
  }

  return {
    title: (result.title || article.title).slice(0, 70),
    excerpt: (result.excerpt || article.excerpt).slice(0, 160),
    reasoning: result.reasoning || '',
  };
}

/**
 * Optimize an existing page: rewrite title/meta, regenerate links.
 */
async function optimizePage(todo, config, constants) {
  const slug = todo.slug || '';

  if (!slug) {
    return { optimized: false, reason: 'no slug in TODO' };
  }

  // Find the article
  const found = findArticleBySlug(slug, config.LOCAL_NEWS_DIR);

  if (!found) {
    console.log(`  Optimize: article not found for slug "${slug}" — skipping`);
    if (config.TRACKING_SHEET_ID && todo.row) {
      await updateTodoStatus(config.TRACKING_SHEET_ID, todo.row, 'Skipped', `Article not found for slug: ${slug}`);
    }
    return { optimized: false, reason: 'article not found' };
  }

  const { filePath, file, articles, idx, article } = found;
  const oldTitle = article.title;
  const oldExcerpt = article.excerpt;

  console.log(`  Found: "${oldTitle}" in ${file}`);

  // Rewrite title + meta description
  console.log('  Rewriting title + meta...');
  const rewrite = await rewriteMeta(article, todo, config);

  const titleChanged = rewrite.title !== oldTitle;
  const excerptChanged = rewrite.excerpt !== oldExcerpt;

  if (!titleChanged && !excerptChanged) {
    console.log('  No changes needed — title and meta already good');
    if (config.TRACKING_SHEET_ID && todo.row) {
      await updateTodoStatus(config.TRACKING_SHEET_ID, todo.row, 'Done', 'Reviewed — no changes needed');
    }
    return { optimized: false, reason: 'no changes needed' };
  }

  // Apply changes
  article.title = rewrite.title;
  article.excerpt = rewrite.excerpt;

  // Regenerate internal links
  console.log('  Regenerating internal links...');
  const linked = addLinks(article, config, constants);
  article.relatedLinks = linked.relatedLinks || article.relatedLinks || [];

  if (titleChanged) console.log(`  Title: "${oldTitle}" → "${rewrite.title}"`);
  if (excerptChanged) console.log(`  Meta: "${oldExcerpt}" → "${rewrite.excerpt}"`);
  if (rewrite.reasoning) console.log(`  Reason: ${rewrite.reasoning}`);

  if (config.DRY_RUN) {
    console.log('  DRY RUN — not writing changes');
    return { optimized: false, reason: 'dry run', changes: { titleChanged, excerptChanged } };
  }

  // Write updated articles back
  articles[idx] = article;
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
  console.log(`  Wrote updated ${file}`);

  // Git commit + push
  try {
    execSync(`git add "${filePath}"`, { cwd: config.WEBSITE_PATH, stdio: 'pipe' });
    execSync(
      `git commit -m "seo: optimize ${slug} — ${titleChanged ? 'title' : ''}${titleChanged && excerptChanged ? ' + ' : ''}${excerptChanged ? 'meta' : ''} rewrite\n\nPosition: ${todo.position}, ${todo.impressions} impressions\n${titleChanged ? `Title: ${oldTitle} → ${rewrite.title}\n` : ''}${excerptChanged ? `Meta: ${oldExcerpt} → ${rewrite.excerpt}\n` : ''}Generated by content-builder opportunity optimizer"`,
      { cwd: config.WEBSITE_PATH, stdio: 'pipe' }
    );
    execSync('git push', { cwd: config.WEBSITE_PATH, stdio: 'pipe' });
    console.log('  Committed and pushed');
  } catch (err) {
    console.warn(`  Git push failed — ${err.message}`);
  }

  // Update Sheet
  if (config.TRACKING_SHEET_ID && todo.row) {
    try {
      const changes = [
        titleChanged ? 'title rewrite' : null,
        excerptChanged ? 'meta rewrite' : null,
      ].filter(Boolean).join(' + ');

      await updateTodoStatus(
        config.TRACKING_SHEET_ID,
        todo.row,
        'Done',
        `Optimized: ${changes}. ${rewrite.reasoning}`
      );
      await logToChangelog(config.TRACKING_SHEET_ID, {
        page: slug,
        action: 'optimize-meta',
        detail: `${changes}: "${oldTitle}" → "${rewrite.title}"`,
        source: 'content-builder',
        category: article.category,
      });
      console.log('  Sheet updated');
    } catch (err) {
      console.warn(`  Sheet update failed — ${err.message}`);
    }
  }

  return {
    optimized: true,
    slug,
    titleChanged,
    excerptChanged,
    oldTitle,
    newTitle: rewrite.title,
    reasoning: rewrite.reasoning,
  };
}

module.exports = { optimizePage, findArticleBySlug };
