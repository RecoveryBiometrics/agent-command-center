/**
 * Agent 1: Researcher
 * Finds real upcoming events for a city by scraping public event sites.
 *
 * Sources (scraped in parallel):
 * 1. Eventbrite — most reliable structured data
 * 2. Patch.com — local community events
 * 3. allevents.in — broad coverage
 *
 * No API keys needed — all sources are public pages.
 */
const https = require('https');
const http = require('http');
const config = require('./config');

// Navigation elements and garbage titles that scrapers pick up
const TITLE_BLACKLIST = [
  'explore', '#stayhappening', 'see all', 'view all', 'load more',
  'sign up', 'log in', 'sign in', 'learn more', 'read more',
  'follow', 'share', 'subscribe', 'get tickets', 'buy tickets',
  'search', 'filter', 'sort by', 'show map',
];

function isGarbageTitle(title) {
  const lower = title.toLowerCase().trim();
  if (lower.length < 10) return true;
  if (TITLE_BLACKLIST.includes(lower)) return true;
  if (/^#\w+$/.test(lower)) return true;
  return false;
}


/**
 * Fetch a URL and return the HTML body as a string.
 */
function fetchPage(url, timeout = 10000) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': `Mozilla/5.0 (compatible; ${config.BUSINESS_ID}Bot/1.0)`,
        'Accept': 'text/html',
      },
      timeout,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location, timeout).then(resolve);
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
 * Scrape Eventbrite for city events.
 */
async function scrapeEventbrite(city) {
  const st = city.state.toLowerCase();
  const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
  const url = `https://www.eventbrite.com/d/${st}--${citySlug}/events/`;

  const html = await fetchPage(url);
  if (!html) return [];

  const events = [];

  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const match of jsonLdMatches) {
    try {
      const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonStr);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Event' && item.name && item.startDate) {
          events.push({
            title: item.name.slice(0, 80),
            date: item.startDate,
            location: item.location?.name || item.location?.address?.addressLocality || city.name,
            summary: (item.description || '').slice(0, 200),
            url: item.url || url,
            source: 'eventbrite',
          });
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  if (events.length === 0) {
    const titlePattern = /data-testid="event-card"[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>/gi;
    let m;
    while ((m = titlePattern.exec(html)) !== null && events.length < 5) {
      const title = m[1].replace(/<[^>]+>/g, '').trim();
      if (title.length > 5 && title.length < 100 && !isGarbageTitle(title)) {
        events.push({
          title,
          summary: `Event in ${city.name} — see Eventbrite for details.`,
          url,
          source: 'eventbrite',
        });
      }
    }
  }

  return events.slice(0, 5);
}

/**
 * Scrape allevents.in for city events.
 */
async function scrapeAllEvents(city) {
  const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
  const url = `https://allevents.in/${citySlug}-${city.state.toLowerCase()}/all`;

  const html = await fetchPage(url);
  if (!html) return [];

  const events = [];

  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const match of jsonLdMatches) {
    try {
      const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonStr);
      const items = Array.isArray(data) ? data : data.itemListElement ? data.itemListElement.map(i => i.item) : [data];
      for (const item of items) {
        if ((item['@type'] === 'Event' || item['@type'] === 'SocialEvent') && item.name) {
          events.push({
            title: item.name.slice(0, 80),
            date: item.startDate || '',
            location: item.location?.name || city.name,
            summary: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 200),
            url: item.url || url,
            source: 'allevents',
          });
        }
      }
    } catch { /* skip */ }
  }

  if (events.length === 0) {
    const titlePattern = /<h3[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi;
    let m;
    while ((m = titlePattern.exec(html)) !== null && events.length < 5) {
      const title = m[1].replace(/<[^>]+>/g, '').trim();
      if (title.length > 5 && title.length < 100 && !isGarbageTitle(title)) {
        events.push({
          title,
          summary: `Event in ${city.name}.`,
          url,
          source: 'allevents',
        });
      }
    }
  }

  return events.slice(0, 5);
}

/**
 * Scrape Patch.com for local events.
 */
async function scrapePatch(city) {
  const stateMap = { PA: 'pennsylvania', DE: 'delaware', MD: 'maryland', NV: 'nevada', SC: 'south-carolina' };
  const stateName = stateMap[city.state] || city.state.toLowerCase();
  const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
  const url = `https://patch.com/${stateName}/${citySlug}/calendar`;

  const html = await fetchPage(url);
  if (!html) return [];

  const events = [];

  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const match of jsonLdMatches) {
    try {
      const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonStr);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Event' && item.name) {
          events.push({
            title: item.name.slice(0, 80),
            date: item.startDate || '',
            location: item.location?.name || city.name,
            summary: (item.description || '').replace(/<[^>]+>/g, '').slice(0, 200),
            url: item.url || url,
            source: 'patch',
          });
        }
      }
    } catch { /* skip */ }
  }

  return events.slice(0, 5);
}

/**
 * Convert raw scraped events into the format the copywriter expects.
 */
function formatEvents(rawEvents, city) {
  const seen = new Set();
  const formatted = [];

  for (const event of rawEvents) {
    const normalizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(normalizedTitle)) continue;
    seen.add(normalizedTitle);

    const junkPatterns = /^(trending|host events|discover|sign up|log in|create|search|browse|see all|load more|view more|submit|menu|home|about)/i;
    if (junkPatterns.test(event.title)) continue;

    let dateStr = '';
    if (event.date) {
      try {
        const d = new Date(event.date);
        dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      } catch { /* skip */ }
    }

    const locationStr = event.location && event.location !== city.name
      ? ` at ${event.location}` : '';

    const whenWhere = dateStr
      ? `${dateStr}${locationStr} in ${city.name}, ${city.state}`
      : `${locationStr ? locationStr.slice(4) + ', ' : ''}${city.name}, ${city.state}`;

    const hasMeaningfulSummary = event.summary
      && !event.summary.startsWith('Upcoming event')
      && !event.summary.startsWith('Event in')
      && event.summary.length > 20;

    const description = hasMeaningfulSummary
      ? `${event.summary}\n\n${event.title} takes place on ${whenWhere}.`
      : `${event.title} takes place on ${whenWhere}.`;

    formatted.push({
      title: event.title,
      summary: event.summary || `Upcoming event in ${city.name}.`,
      description: description.trim(),
      category: 'community',
      source: event.url,
    });

    if (formatted.length >= 5) break;
  }

  return formatted;
}

/**
 * Research events for a city.
 */
async function research(city) {
  console.log(`  Researching ${city.name}, ${city.state}...`);

  const [eventbriteResults, allEventsResults, patchResults] = await Promise.all([
    scrapeEventbrite(city).catch(() => []),
    scrapeAllEvents(city).catch(() => []),
    scrapePatch(city).catch(() => []),
  ]);

  const allRaw = [...eventbriteResults, ...patchResults, ...allEventsResults];
  console.log(`  Raw results: ${eventbriteResults.length} Eventbrite, ${patchResults.length} Patch, ${allEventsResults.length} AllEvents`);

  let events = formatEvents(allRaw, city);
  console.log(`  Formatted ${events.length} unique events`);

  return {
    city: city.name,
    state: city.state,
    county: city.county,
    slug: city.slug,
    events,
    researchedAt: new Date().toISOString(),
  };
}

module.exports = { research };
