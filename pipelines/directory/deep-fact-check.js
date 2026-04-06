/**
 * Deep Fact-Check — Fetches Wikipedia summary + full article for cities
 * that were written from training knowledge. Extracts verified facts and
 * rewrites the history entries using ONLY Wikipedia-sourced information.
 *
 * For each city:
 * 1. Fetch Wikipedia summary (REST API) — get extract, population
 * 2. Fetch full Wikipedia article (HTML) — get history sections, founding date
 * 3. Replace existing history with Wikipedia-verified content
 * 4. Correct population and founding year from Wikipedia
 * 5. Flag any claims that couldn't be verified
 *
 * Usage: node scripts/wiki-generator/deep-fact-check.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../src/data/city-wiki');
const STATE_NAMES = {
  PA: 'Pennsylvania', DE: 'Delaware', MD: 'Maryland',
  NV: 'Nevada', SC: 'South Carolina',
};

const WIKI_OVERRIDES = {
  'center-city': 'Center_City,_Philadelphia',
  'south-philadelphia': 'South_Philadelphia',
  'west-philadelphia': 'West_Philadelphia',
  'north-philadelphia': 'North_Philadelphia',
  'northeast-philadelphia': 'Northeast_Philadelphia',
  'roxborough': 'Roxborough,_Philadelphia',
  'manayunk': 'Manayunk,_Philadelphia',
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
  'horsham': 'Horsham_Township,_Montgomery_County,_Pennsylvania',
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
  'garden-city': 'Garden_City,_South_Carolina',
  'murrells-inlet': 'Murrells_Inlet,_South_Carolina',
  'enterprise': 'Enterprise,_Nevada',
  'sunrise-manor': 'Sunrise_Manor,_Nevada',
  'little-river': 'Little_River,_South_Carolina',
  'surfside-beach': 'Surfside_Beach,_South_Carolina',
  'north-myrtle-beach': 'North_Myrtle_Beach,_South_Carolina',
  'carolina-forest': 'Carolina_Forest,_South_Carolina',
  'pocopson': 'Pocopson_Township,_Chester_County,_Pennsylvania',
  'springfield': 'Springfield_Township,_Delaware_County,_Pennsylvania',
  'unionville': 'Unionville,_Pennsylvania',
};

// The 64 cities that were written from training knowledge
const KNOWLEDGE_CITIES = [
  'aldan','avondale','bear','bellefonte','bethesda','bridgeport','brookside',
  'bryn-athyn','center-city','charlestown','chesapeake-city','chevy-chase',
  'claymont','collingdale','columbia-pa','conway','derwood','drexel-hill',
  'eagleview','elizabethtown','elsmere','enterprise','ephrata','folsom',
  'garden-city','glasgow','glenolden','greenville','hatfield','hockessin',
  'horsham','lansdowne','las-vegas','little-river','manayunk','middletown',
  'millersville','modena','mount-joy','murrells-inlet','newport','north-east',
  'north-las-vegas','north-myrtle-beach','odessa','pennsburg','perryville',
  'pike-creek','pocopson','port-deposit','potomac','quarryville','rising-sun',
  'rockledge','sharon-hill','south-coatesville','spring-city','springfield',
  'strasburg','summerlin','surfside-beach','thorndale','townsend','unionville'
];

function fetchJSON(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'SafeBathBot/1.0 (safebathgrabbar.com; educational content)', 'Accept': 'application/json' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

function fetchHTML(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'SafeBathBot/1.0 (safebathgrabbar.com; educational content)', 'Accept': 'text/html' },
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

function cleanText(text) {
  return text
    .replace(/\[\s*\d+\s*\]/g, '')
    .replace(/\[\s*\w\s*\]/g, '')
    .replace(/\[?\s*citation needed\s*\]?/gi, '')
    .replace(/\[?\s*clarification needed\s*\]?/gi, '')
    .replace(/&#\d+;/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getWikiTitle(slug, cityData) {
  if (WIKI_OVERRIDES[slug]) return WIKI_OVERRIDES[slug];
  const stateFull = STATE_NAMES[cityData.state] || cityData.state;
  return `${cityData.cityName},_${stateFull}`.replace(/\s+/g, '_');
}

function extractPopulation(summary, html) {
  // Try multiple patterns, ordered by reliability
  const patterns = [
    // "population was X at the 2020 census"
    /population\s+(?:was|of)\s+([\d,]+)\s+(?:at|as of|in)\s+the\s+20\d{2}/i,
    // "X residents at the 2020 census"
    /([\d,]+)\s+residents?\s+(?:at|as of|in)\s+the\s+20\d{2}/i,
    // "population of X"
    /population\s+(?:of|was)\s+([\d,]+)/i,
    // "had a population of X"
    /had\s+a\s+population\s+of\s+([\d,]+)/i,
  ];

  const text = summary + ' ' + (html || '').slice(0, 50000);

  // Check for "X million" first
  const millionMatch = text.match(/population\s+(?:of|was)\s+([\d.]+)\s*million/i);
  if (millionMatch) {
    return Math.round(parseFloat(millionMatch[1]) * 1000000).toLocaleString();
  }

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1].replace(/,/g, '').length >= 3) return m[1];
  }

  // Try HTML infobox
  const infoMatch = (html || '').match(/(?:Total|Population)[^<]*?(\d{1,3}(?:,\d{3})+)/);
  if (infoMatch) return infoMatch[1];

  return '';
}

function extractFounded(summary, html) {
  const text = summary + ' ' + (html || '').slice(0, 100000);
  const patterns = [
    /(?:founded|established|incorporated|settled|chartered)\s+(?:in\s+)?(\d{4})/i,
    /(?:founded|established|incorporated|settled|chartered)\s+(?:on\s+\w+\s+\d{1,2},?\s+)?(\d{4})/i,
    /(?:was\s+)?(?:founded|established|incorporated)\s+(?:as\s+\w+\s+)?(?:in\s+)?(\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '';
}

function assignEra(text) {
  const years = (text.match(/\b(1[0-9]{3}|20[0-2]\d)\b/g) || []).map(Number).sort();
  if (years.length === 0) return 'Historical Background';
  const earliest = years[0];
  if (earliest < 1700) return 'Colonial Origins';
  if (earliest < 1776) return 'Colonial Era';
  if (earliest < 1800) return 'Revolutionary Period';
  if (earliest < 1830) return 'Early Republic';
  if (earliest < 1865) return 'Antebellum Era';
  if (earliest < 1900) return 'Industrial Age';
  if (earliest < 1920) return 'Turn of the Century';
  if (earliest < 1945) return 'Early Twentieth Century';
  if (earliest < 1970) return 'Post-War Growth';
  if (earliest < 2000) return 'Late Twentieth Century';
  return 'Modern Era';
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
    let title = match[1].replace(/<[^>]+>/g, '').replace(/\[edit\]/gi, '').trim();
    let content = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    content = cleanText(content);

    // Truncate at last complete sentence
    if (content.length > 600) {
      const lastPeriod = content.lastIndexOf('.', 600);
      if (lastPeriod > 100) content = content.substring(0, lastPeriod + 1);
    }

    // Remove leading image captions
    content = content.replace(/^[^.]*?(?:depicted in|portrait by|painting by)[^.]*?\.\s*/gi, '');
    content = content.replace(/^(?:See also|Further information|Main article)[^.]*?\.\s*/gi, '');

    if (title && content && content.length > 60) {
      const era = assignEra(content);
      sections.push({ era, title: cleanText(title), description: content });
    }
  }

  // If no h3 subsections, extract paragraphs
  if (sections.length === 0) {
    const paragraphs = historyHtml.match(/<p>([\s\S]*?)<\/p>/gi) || [];
    for (const p of paragraphs.slice(0, 6)) {
      let text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      text = cleanText(text);
      if (text.length > 600) {
        const lastPeriod = text.lastIndexOf('.', 600);
        if (lastPeriod > 100) text = text.substring(0, lastPeriod + 1);
      }
      text = text.replace(/^[^.]*?(?:depicted in|portrait by|painting by)[^.]*?\.\s*/gi, '');
      if (text.length > 80) {
        const era = assignEra(text);
        sections.push({ era, title: `${era}`, description: text });
      }
    }
  }

  return sections.slice(0, 6);
}

// Extract key facts from the full article HTML for verification
function extractKeyFacts(html, summary) {
  const facts = {};
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // County seat
  if (/county seat/i.test(summary + text)) facts.isCountySeat = true;

  // Named after
  const namedMatch = (summary + ' ' + text).match(/named (?:after|for) ([^,.]+)/i);
  if (namedMatch) facts.namedAfter = namedMatch[1].trim();

  // Incorporated
  const incMatch = (summary + ' ' + text).match(/incorporated\s+(?:in\s+)?(\d{4})/i);
  if (incMatch) facts.incorporated = incMatch[1];

  return facts;
}

async function processCity(slug) {
  const filePath = path.join(OUT_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return { slug, status: 'file-not-found' };

  const cityData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const title = getWikiTitle(slug, cityData);

  // Fetch Wikipedia summary
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  let wikiSummary = await fetchJSON(summaryUrl);

  // Fallback: try without state
  if (!wikiSummary || wikiSummary.type?.includes('not_found')) {
    const fallback = encodeURIComponent(cityData.cityName.replace(/\s+/g, '_'));
    wikiSummary = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/page/summary/${fallback}`);
  }

  const summaryText = wikiSummary?.extract || '';

  // Fetch full article HTML
  const articleTitle = wikiSummary?.title || title;
  const articleUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle.replace(/\s+/g, '_'))}`;
  const html = await fetchHTML(articleUrl);

  // Extract verified data
  const wikiPop = extractPopulation(summaryText, html);
  const wikiFounded = extractFounded(summaryText, html);
  const wikiHistory = parseHistorySections(html);
  const keyFacts = extractKeyFacts(html, summaryText);

  const changes = [];

  // Update summary if Wikipedia has one and ours is empty or different
  if (summaryText && summaryText.length > 50) {
    if (!cityData.summary || cityData.summary.length < 50) {
      cityData.summary = summaryText;
      changes.push('summary');
    }
  }

  // Update population
  if (wikiPop) {
    const wikiNum = parseInt(wikiPop.replace(/,/g, ''));
    const myNum = parseInt((cityData.population || '0').replace(/,/g, ''));
    if (myNum === 0 || Math.abs(wikiNum - myNum) / Math.max(wikiNum, 1) > 0.05) {
      changes.push(`population: ${cityData.population || 'empty'} → ${wikiPop}`);
      cityData.population = wikiPop;
    }
  }

  // Update founded
  if (wikiFounded) {
    if (cityData.founded !== wikiFounded) {
      changes.push(`founded: ${cityData.founded || 'empty'} → ${wikiFounded}`);
      cityData.founded = wikiFounded;
    }
  }

  // Replace history if Wikipedia has sections (prefer verified content)
  if (wikiHistory.length > 0) {
    changes.push(`history: replaced ${cityData.history.length} entries with ${wikiHistory.length} verified entries`);
    cityData.history = wikiHistory;
  } else {
    // Wikipedia has no history section — keep existing but flag
    changes.push(`history: UNVERIFIED (${cityData.history.length} entries from training knowledge, no Wikipedia history section found)`);
  }

  cityData.generatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(cityData, null, 2));

  return { slug, city: cityData.cityName, changes, keyFacts, hasWikiHistory: wikiHistory.length > 0 };
}

async function run() {
  console.log(`Deep fact-checking ${KNOWLEDGE_CITIES.length} cities against Wikipedia...\n`);

  const results = [];
  const unverified = [];
  let corrected = 0;

  for (let i = 0; i < KNOWLEDGE_CITIES.length; i++) {
    const slug = KNOWLEDGE_CITIES[i];
    const result = await processCity(slug);
    results.push(result);

    if (!result.hasWikiHistory) unverified.push(result.slug);
    if (result.changes && result.changes.length > 0) corrected++;

    const status = result.hasWikiHistory ? 'VERIFIED' : 'PARTIAL';
    console.log(`  [${i + 1}/${KNOWLEDGE_CITIES.length}] ${result.city || slug}: ${status} — ${(result.changes || []).join(', ') || 'no changes'}`);

    // Rate limit: 1.5s between cities
    if (i < KNOWLEDGE_CITIES.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log('\n========================================');
  console.log('Deep Fact-Check Complete');
  console.log('========================================');
  console.log(`Cities checked: ${KNOWLEDGE_CITIES.length}`);
  console.log(`Cities corrected: ${corrected}`);
  console.log(`History fully verified from Wikipedia: ${KNOWLEDGE_CITIES.length - unverified.length}`);
  console.log(`History still from training knowledge: ${unverified.length}`);

  if (unverified.length > 0) {
    console.log(`\nCities with UNVERIFIED history (no Wikipedia history section):`);
    for (const slug of unverified) {
      console.log(`  - ${slug}`);
    }
    console.log('\nThese cities\' history content was written from training knowledge.');
    console.log('Their population and founding year have been verified where possible,');
    console.log('but historical narrative claims should be manually reviewed.');
  }
}

run().catch(err => {
  console.error('Deep fact-check failed:', err.message);
  process.exit(1);
});
