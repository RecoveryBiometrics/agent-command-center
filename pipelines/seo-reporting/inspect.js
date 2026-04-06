const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { getAuthClient } = require('./auth');
const config = require('./config');

const SITE_URL = config.gscSiteUrl;
const SITE_BASE = config.siteBase;
const DATA_DIR = config.dataDir;
const SITEMAP_PATH = config.sitemapPath;
const SITEMAP_URL = config.sitemapUrl;

// Delay between API calls to avoid rate limiting (ms)
const DELAY_MS = 150;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse ALL URLs from the sitemap XML.
 * Supports both a remote URL (SITEMAP_URL) and a local file (SITEMAP_PATH).
 * Returns array of full URLs like ['https://example.com/...', ...]
 */
async function getAllUrlsFromSitemap() {
  let content = '';

  // Prefer remote URL if set (works for any business without local file access)
  if (SITEMAP_URL) {
    try {
      const res = await fetch(SITEMAP_URL);
      content = await res.text();
      console.log(`  Fetched sitemap from ${SITEMAP_URL}`);
    } catch (err) {
      console.warn(`  Failed to fetch sitemap from ${SITEMAP_URL}:`, err.message);
      return [];
    }
  } else if (fs.existsSync(SITEMAP_PATH)) {
    content = fs.readFileSync(SITEMAP_PATH, 'utf8');
  } else {
    console.warn('  No sitemap available (set SITEMAP_URL or SITEMAP_PATH) — skipping inspection');
    return [];
  }

  const urls = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}


/**
 * Inspect a single URL via the URL Inspection API.
 * Returns simplified result object.
 */
async function inspectUrl(searchconsole, fullUrl) {
  try {
    const res = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: fullUrl,
        siteUrl: SITE_URL,
      },
    });

    const result = res.data.inspectionResult;
    const index = result.indexStatusResult || {};

    return {
      url: fullUrl,
      verdict: index.verdict || 'UNKNOWN',
      coverageState: index.coverageState || 'Unknown',
      robotsTxtState: index.robotsTxtState || 'UNKNOWN',
      indexingState: index.indexingState || 'UNKNOWN',
      lastCrawlTime: index.lastCrawlTime || null,
      pageFetchState: index.pageFetchState || 'UNKNOWN',
      crawledAs: index.crawledAs || 'UNKNOWN',
      error: null,
    };
  } catch (err) {
    return {
      url: fullUrl,
      verdict: 'ERROR',
      coverageState: 'API Error',
      error: err.message,
    };
  }
}

/**
 * Run URL inspection on ALL pages from the sitemap.
 * 2,052 URLs at 150ms delay = ~5 minutes. Well within 2,000/day API limit.
 */
async function inspectPages() {
  const allUrls = await getAllUrlsFromSitemap();
  if (allUrls.length === 0) {
    return { inspected: [], summary: null, skipped: true };
  }

  console.log(`Inspecting ALL ${allUrls.length} pages from sitemap`);

  const auth = await getAuthClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth });

  const results = [];
  for (let i = 0; i < allUrls.length; i++) {
    const fullUrl = allUrls[i];

    if (i > 0) await sleep(DELAY_MS);

    const result = await inspectUrl(searchconsole, fullUrl);
    results.push(result);

    // Progress every 100
    if ((i + 1) % 100 === 0) {
      console.log(`  ...inspected ${i + 1}/${allUrls.length}`);
    }
  }

  // Summarize
  const indexed = results.filter(r => r.verdict === 'PASS').length;
  const notIndexed = results.filter(r => r.verdict === 'NEUTRAL' || r.verdict === 'FAIL').length;
  const errors = results.filter(r => r.verdict === 'ERROR').length;

  const summary = {
    inspectedAt: new Date().toISOString(),
    totalPages: allUrls.length,
    indexed,
    notIndexed,
    errors,
  };

  // Save results
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const date = new Date().toISOString().split('T')[0];
  const resultsPath = path.join(DATA_DIR, `inspect-${date}.json`);

  // Merge with any existing results from today (if run multiple times)
  let allResults = results;
  if (fs.existsSync(resultsPath)) {
    const existing = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const existingUrls = new Set(existing.results.map(r => r.url));
    const newResults = results.filter(r => !existingUrls.has(r.url));
    allResults = [...existing.results, ...newResults];
  }

  fs.writeFileSync(resultsPath, JSON.stringify({ summary, results: allResults }, null, 2));

  // Also save/update the latest cumulative view
  updateCumulativeResults(results);

  console.log(`Inspection complete: ${indexed} indexed, ${notIndexed} not indexed, ${errors} errors`);

  return { inspected: results, summary, skipped: false };
}

/**
 * Maintain a cumulative file that tracks the latest status for every inspected URL.
 * This builds up over multiple weekly runs until we have full coverage.
 */
function updateCumulativeResults(newResults) {
  const cumulativePath = path.join(DATA_DIR, 'inspect-cumulative.json');
  let cumulative = {};

  if (fs.existsSync(cumulativePath)) {
    const data = JSON.parse(fs.readFileSync(cumulativePath, 'utf8'));
    cumulative = data.results || {};
  }

  // Merge new results (overwrite with latest)
  for (const r of newResults) {
    cumulative[r.url] = {
      verdict: r.verdict,
      coverageState: r.coverageState,
      lastCrawlTime: r.lastCrawlTime,
      pageFetchState: r.pageFetchState,
      checkedAt: new Date().toISOString(),
    };
  }

  const urls = Object.keys(cumulative);
  const indexed = urls.filter(u => cumulative[u].verdict === 'PASS').length;
  const notIndexed = urls.filter(u => cumulative[u].verdict !== 'PASS' && cumulative[u].verdict !== 'ERROR').length;

  fs.writeFileSync(cumulativePath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    totalInspected: urls.length,
    indexed,
    notIndexed,
    results: cumulative,
  }, null, 2));
}

module.exports = { inspectPages };
