/**
 * Agent 6: Engineer
 * Writes validated content to the business's data directory.
 * Merges new articles with existing ones (append, don't replace).
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { logChange } = require('./changelog');
const { logChangeToSheet } = require('./sheet');

async function deploy(city, newEntries) {
  if (!fs.existsSync(config.NEWS_DATA_DIR)) {
    fs.mkdirSync(config.NEWS_DATA_DIR, { recursive: true });
  }

  const filePath = path.join(config.NEWS_DATA_DIR, `${city.slug}.json`);

  let existing = [];
  if (fs.existsSync(filePath)) {
    try {
      existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }

  const existingSlugs = new Set(existing.map(e => e.slug));
  const toAdd = newEntries.filter(e => !existingSlugs.has(e.slug));

  if (toAdd.length === 0) {
    console.log(`  ${city.name}: no new articles to deploy (all already exist)`);
    return { deployed: 0, total: existing.length, filePath };
  }

  const merged = [...toAdd, ...existing];

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
  console.log(`  ${city.name}: deployed ${toAdd.length} new articles (${merged.length} total)`);

  const titles = toAdd.map(a => a.title).join(', ');
  logChange({
    page: `/${city.slug}/local-news`,
    action: 'news-added',
    detail: `${toAdd.length} articles: ${titles}`,
    source: 'content-pipeline',
  });

  await logChangeToSheet({
    city: city.name,
    state: city.state,
    count: toAdd.length,
    url: `/${city.slug}/local-news`,
  });

  return { deployed: toAdd.length, total: merged.length, filePath };
}

module.exports = { deploy };
