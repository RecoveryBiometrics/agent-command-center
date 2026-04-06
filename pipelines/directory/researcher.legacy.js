/**
 * Wiki Researcher — Scrapes Wikipedia for city history and demographics.
 *
 * Uses the Wikipedia REST API (no key needed) to get city summaries,
 * then scrapes the full article for history sections.
 */
const https = require('https');
const config = require('./config');

/**
 * Fetch JSON from a URL.
 */
function fetchJSON(url, timeout = 15000) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'SafeBathBot/1.0 (safebathgrabbar.com; educational content)',
        'Accept': 'application/json',
      },
      timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location, timeout).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function fetchHTML(url, timeout = 15000) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'SafeBathBot/1.0 (safebathgrabbar.com; educational content)',
        'Accept': 'text/html',
      },
      timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHTML(res.headers.location, timeout).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

/**
 * Clean Wikipedia text artifacts — HTML entities, bracket references, etc.
 */
function cleanText(text) {
  return text
    .replace(/&#\d+;/g, '')        // HTML numeric entities like &#91;
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\[\s*\d+\s*\]/g, '')     // [7] style references
    .replace(/\[\s*\w\s*\]/g, '')      // [a] style references
    .replace(/\[\s*citation needed\s*\]/gi, '')
    .replace(/\s+\d{1,2}\s+(?=\w)/g, ' ')  // stray lone reference numbers like " 7 "
    .replace(/\s+\d{1,2}\s*$/g, '')    // trailing reference numbers
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Build Wikipedia search title for a city.
 * Handles disambiguation: "West Chester, Pennsylvania" not just "West Chester"
 */
function wikiTitle(city) {
  const stateNames = {
    PA: 'Pennsylvania',
    DE: 'Delaware',
    MD: 'Maryland',
    NV: 'Nevada',
    SC: 'South Carolina',
  };
  const state = stateNames[city.state] || city.state;
  return `${city.name}, ${state}`;
}

/**
 * Get city summary from Wikipedia REST API.
 */
async function getWikiSummary(city) {
  const title = encodeURIComponent(wikiTitle(city).replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const data = await fetchJSON(url);

  if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
    // Try without state disambiguation
    const fallback = encodeURIComponent(city.name.replace(/\s+/g, '_'));
    return await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${fallback}`);
  }

  return data;
}

/**
 * Parse history sections from Wikipedia HTML.
 * Looks for h2/h3 with "History" and extracts the paragraphs.
 */
function parseHistorySections(html) {
  const sections = [];
  if (!html) return sections;

  // Find the History section
  const historyMatch = html.match(/<h2[^>]*>.*?History.*?<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!historyMatch) return sections;

  const historyHtml = historyMatch[1];

  // Extract subsections (h3 headers) or paragraphs
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<h2|$)/gi;
  let match;

  while ((match = h3Regex.exec(historyHtml)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, '').trim();
    const content = match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\[\d+\]/g, '')
      .trim();

    if (title && content && content.length > 50) {
      sections.push({ title, description: cleanText(content.slice(0, 600)) });
    }
  }

  // If no h3 subsections, extract paragraphs directly
  if (sections.length === 0) {
    const paragraphs = historyHtml.match(/<p>([\s\S]*?)<\/p>/gi) || [];
    for (const p of paragraphs.slice(0, 6)) {
      const text = p
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\[\d+\]/g, '')
        .trim();
      if (text.length > 80) {
        sections.push({ title: '', description: cleanText(text.slice(0, 600)) });
      }
    }
  }

  return sections;
}

/**
 * Extract founding date / incorporation year from Wikipedia text.
 */
function extractFoundingInfo(text) {
  if (!text) return '';

  // Common patterns: "founded in 1799", "incorporated in 1850", "established 1723"
  const patterns = [
    /(?:founded|established|incorporated|settled|chartered)\s+(?:in\s+)?(\d{4})/i,
    /(?:founded|established|incorporated|settled|chartered)\s+(?:as\s+\w+\s+)?(?:in\s+)?(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

/**
 * Extract population from Wikipedia infobox or text.
 */
function extractPopulation(html) {
  if (!html) return '';

  // Look for population in infobox
  const popMatch = html.match(/(?:Population|population)[^<]*?(\d{1,3}(?:,\d{3})*)/);
  if (popMatch) return popMatch[1];

  return '';
}

/**
 * Build history timeline with era labels from raw sections.
 */
function buildTimeline(sections, founded) {
  const timeline = [];

  // Try to extract dates from section content to assign eras
  for (const section of sections) {
    const text = section.description;
    // Find earliest year mentioned
    const years = (text.match(/\b1[0-9]{3}\b/g) || []).map(Number).sort();
    let era = '';

    if (years.length > 0) {
      const earliest = years[0];
      if (earliest < 1800) era = `${earliest}s`;
      else if (earliest < 1850) era = 'Early 1800s';
      else if (earliest < 1900) era = 'Late 1800s';
      else if (earliest < 1950) era = 'Early 1900s';
      else if (earliest < 1980) era = 'Mid 1900s';
      else era = 'Modern Era';
    }

    const title = section.title || (era ? `${era} History` : 'Historical Background');

    timeline.push({
      era: era || (founded ? `Est. ${founded}` : 'Historical'),
      title,
      description: section.description,
    });
  }

  return timeline;
}

/**
 * Research a city — returns wiki data including summary, history, demographics.
 */
async function researchCity(city) {
  console.log(`  Researching ${city.name}, ${city.state} on Wikipedia...`);

  // Get summary
  const summary = await getWikiSummary(city);
  const summaryText = summary?.extract || '';
  const wikiPageTitle = summary?.title || wikiTitle(city);

  // Get full article HTML for history parsing
  const articleTitle = encodeURIComponent(wikiPageTitle.replace(/\s+/g, '_'));
  const articleUrl = `https://en.wikipedia.org/wiki/${articleTitle}`;
  const html = await fetchHTML(articleUrl);

  // Parse history
  const rawSections = parseHistorySections(html);
  const founded = extractFoundingInfo(summaryText + ' ' + (html || ''));
  const population = extractPopulation(html);
  const history = buildTimeline(rawSections, founded);

  console.log(`  Found: ${summaryText.length > 0 ? 'summary' : 'no summary'}, ${history.length} history sections, founded: ${founded || 'unknown'}`);

  return {
    summary: summaryText,
    founded,
    population,
    history,
    wikiUrl: articleUrl,
  };
}

module.exports = { researchCity };
