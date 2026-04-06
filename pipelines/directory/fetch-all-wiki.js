/**
 * Batch Wikipedia Fetcher — Downloads summary + history for all 167 cities.
 * Saves raw data to wiki-raw/ directory for processing.
 *
 * Usage: node scripts/wiki-generator/fetch-all-wiki.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const CITIES_FILE = path.join(__dirname, '../content-pipeline/cities-data.json');
const RAW_DIR = path.join(__dirname, 'wiki-raw');
const STATE_NAMES = {
  PA: 'Pennsylvania', DE: 'Delaware', MD: 'Maryland',
  NV: 'Nevada', SC: 'South Carolina',
};

// Special Wikipedia title overrides for neighborhoods/CDPs
const WIKI_OVERRIDES = {
  'center-city': 'Center_City,_Philadelphia',
  'south-philadelphia': 'South_Philadelphia',
  'west-philadelphia': 'West_Philadelphia',
  'north-philadelphia': 'North_Philadelphia',
  'northeast-philadelphia': 'Northeast_Philadelphia',
  'roxborough': 'Roxborough,_Philadelphia',
  'manayunk': 'Manayunk',
  'germantown': 'Germantown,_Philadelphia',
  'chestnut-hill': 'Chestnut_Hill,_Philadelphia',
  'fishtown': 'Fishtown,_Philadelphia',
  'kensington': 'Kensington,_Philadelphia',
  'port-richmond': 'Port_Richmond,_Philadelphia',
  'university-city': 'University_City,_Philadelphia',
  'fairmount': 'Fairmount,_Philadelphia',
  'society-hill': 'Society_Hill,_Philadelphia',
  'drexel-hill': 'Drexel_Hill,_Pennsylvania',
  'broomall': 'Broomall,_Pennsylvania',
  'ardmore': 'Ardmore,_Pennsylvania',
  'ardmore-montgomery': 'Ardmore,_Pennsylvania',
  'glen-mills': 'Glen_Mills,_Pennsylvania',
  'havertown': 'Havertown,_Pennsylvania',
  'folsom': 'Folsom,_Pennsylvania',
  'boothwyn': 'Boothwyn,_Pennsylvania',
  'holmes': 'Holmes,_Pennsylvania',
  'secane': 'Secane,_Pennsylvania',
  'king-of-prussia': 'King_of_Prussia,_Pennsylvania',
  'willow-grove': 'Willow_Grove,_Pennsylvania',
  'horsham': 'Horsham,_Pennsylvania',
  'fort-washington': 'Fort_Washington,_Pennsylvania',
  'blue-bell': 'Blue_Bell,_Pennsylvania',
  'harleysville': 'Harleysville,_Pennsylvania',
  'exton': 'Exton,_Pennsylvania',
  'paoli': 'Paoli,_Pennsylvania',
  'berwyn': 'Berwyn,_Pennsylvania',
  'devon': 'Devon,_Pennsylvania',
  'thorndale': 'Thorndale,_Pennsylvania',
  'eagleview': 'Eagleview,_Pennsylvania',
  'pike-creek': 'Pike_Creek,_Delaware',
  'spring-valley-nv': 'Spring_Valley,_Nevada',
  'columbia-pa': 'Columbia,_Pennsylvania',
  'kensington-md': 'Kensington,_Maryland',
  'germantown': 'Germantown,_Philadelphia',
};

function fetchJSON(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'SafeBathBot/1.0 (safebathgrabbar.com; educational content)',
        'Accept': 'application/json',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve);
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

function fetchHTML(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'SafeBathBot/1.0 (safebathgrabbar.com; educational content)',
        'Accept': 'text/html',
      },
      timeout: 20000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHTML(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function getWikiTitle(city) {
  if (WIKI_OVERRIDES[city.slug]) return WIKI_OVERRIDES[city.slug];
  const state = STATE_NAMES[city.state] || city.state;
  return `${city.name},_${state}`.replace(/\s+/g, '_');
}

function cleanText(text) {
  return text
    .replace(/&#\d+;/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/\[\s*\d+\s*\]/g, '')
    .replace(/\[\s*\w\s*\]/g, '')
    .replace(/\[\s*citation needed\s*\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseHistorySections(html) {
  const sections = [];
  if (!html) return sections;

  const historyMatch = html.match(/<h2[^>]*>.*?History.*?<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!historyMatch) return sections;

  const historyHtml = historyMatch[1];
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|<h2|$)/gi;
  let match;

  while ((match = h3Regex.exec(historyHtml)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, '').trim();
    const content = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (title && content && content.length > 50) {
      sections.push({ title: cleanText(title), description: cleanText(content.slice(0, 800)) });
    }
  }

  if (sections.length === 0) {
    const paragraphs = historyHtml.match(/<p>([\s\S]*?)<\/p>/gi) || [];
    for (const p of paragraphs.slice(0, 6)) {
      const text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 80) {
        sections.push({ title: '', description: cleanText(text.slice(0, 800)) });
      }
    }
  }

  return sections;
}

function extractFoundingInfo(text) {
  if (!text) return '';
  const patterns = [
    /(?:founded|established|incorporated|settled|chartered)\s+(?:in\s+)?(\d{4})/i,
    /(?:founded|established|incorporated|settled|chartered)\s+(?:as\s+\w+\s+)?(?:in\s+)?(\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '';
}

function extractPopulation(html) {
  if (!html) return '';
  const m = html.match(/(?:Population|population)[^<]*?(\d{1,3}(?:,\d{3})+)/);
  return m ? m[1] : '';
}

async function fetchCity(city) {
  const title = getWikiTitle(city);

  // Fetch summary
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  let summary = await fetchJSON(summaryUrl);

  // Fallback without state
  if (!summary || summary.type?.includes('not_found')) {
    const fallback = encodeURIComponent(city.name.replace(/\s+/g, '_'));
    summary = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${fallback}`);
  }

  // Fetch article HTML
  const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  const html = await fetchHTML(articleUrl);

  const summaryText = summary?.extract || '';
  const historySections = parseHistorySections(html);
  const founded = extractFoundingInfo(summaryText + ' ' + (html || '').slice(0, 50000));
  const population = extractPopulation(html);

  return {
    cityName: city.name,
    citySlug: city.slug,
    state: city.state,
    county: city.county,
    summary: summaryText,
    founded,
    population,
    historySections,
    wikiTitle: summary?.title || title,
  };
}

async function run() {
  const cities = JSON.parse(fs.readFileSync(CITIES_FILE, 'utf8'));

  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  console.log(`Fetching Wikipedia data for ${cities.length} cities...`);

  let done = 0;
  let failed = 0;

  // Process in batches of 5 with delays
  for (let i = 0; i < cities.length; i += 5) {
    const batch = cities.slice(i, i + 5);
    const results = await Promise.all(batch.map(city => fetchCity(city)));

    for (const result of results) {
      const outPath = path.join(RAW_DIR, `${result.citySlug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      done++;

      const histCount = result.historySections?.length || 0;
      const status = result.summary ? 'OK' : 'NO-SUMMARY';
      console.log(`  [${done}/${cities.length}] ${result.cityName}, ${result.state}: ${status}, ${histCount} history sections, pop: ${result.population || '?'}, est: ${result.founded || '?'}`);
    }

    // Rate limit
    if (i + 5 < cities.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\nDone. ${done} fetched, ${failed} failed.`);
  console.log(`Raw data saved to ${RAW_DIR}/`);
}

run().catch(err => {
  console.error('Fetch failed:', err.message);
  process.exit(1);
});
