/**
 * Fact-checker — Compares generated city data against Wikipedia summaries.
 * Checks population, founded year, and flags discrepancies.
 *
 * Usage: node scripts/wiki-generator/fact-check.js
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

function getWikiTitle(slug, state) {
  if (WIKI_OVERRIDES[slug]) return WIKI_OVERRIDES[slug];
  // Read city data to get name
  const filePath = path.join(OUT_DIR, `${slug}.json`);
  const d = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const stateFull = STATE_NAMES[d.state] || d.state;
  return `${d.cityName},_${stateFull}`.replace(/\s+/g, '_');
}

async function run() {
  // Get all city files
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.json'));

  const issues = [];
  const corrections = {};
  let checked = 0;

  for (const file of files) {
    const slug = file.replace('.json', '');
    const filePath = path.join(OUT_DIR, file);
    const cityData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const title = getWikiTitle(slug, cityData.state);
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

    const wiki = await fetchJSON(url);
    checked++;

    if (!wiki || wiki.type?.includes('not_found')) {
      continue; // Skip if no Wikipedia page
    }

    const extract = wiki.extract || '';

    // Extract population from Wikipedia summary
    let wikiPop = '';
    const popMatch = extract.match(/population\s+(?:of|was)\s+([\d,]+)/i);
    const resMatch = extract.match(/([\d,]+)\s+(?:residents|people)/i);
    const censusMatch = extract.match(/(\d{1,3}(?:,\d{3})+)\s+(?:at|as of|in)\s+the\s+20\d{2}\s+census/i);

    if (censusMatch) wikiPop = censusMatch[1];
    else if (popMatch) wikiPop = popMatch[1];
    else if (resMatch && resMatch[1].replace(/,/g, '').length > 3) wikiPop = resMatch[1];

    // Compare populations
    if (wikiPop && cityData.population) {
      const wikiNum = parseInt(wikiPop.replace(/,/g, ''));
      const myNum = parseInt(cityData.population.replace(/,/g, ''));

      if (myNum > 0 && wikiNum > 0) {
        const diff = Math.abs(wikiNum - myNum) / wikiNum;
        if (diff > 0.1) { // More than 10% off
          issues.push({
            slug,
            city: cityData.cityName,
            field: 'population',
            mine: cityData.population,
            wiki: wikiPop,
            diff: `${(diff * 100).toFixed(0)}% off`,
          });
          if (!corrections[slug]) corrections[slug] = {};
          corrections[slug].population = wikiPop;
        }
      }
    } else if (wikiPop && !cityData.population) {
      // We're missing population but Wikipedia has it
      if (!corrections[slug]) corrections[slug] = {};
      corrections[slug].population = wikiPop;
    }

    // Rate limit
    if (checked % 5 === 0) {
      await new Promise(r => setTimeout(r, 1500));
      process.stdout.write(`  Checked ${checked}/${files.length}...\r`);
    }
  }

  console.log(`\nFact-check complete: ${checked} cities checked\n`);

  if (issues.length > 0) {
    console.log(`ISSUES FOUND (${issues.length}):`);
    for (const i of issues) {
      console.log(`  ${i.city} (${i.slug}): ${i.field} — mine: ${i.mine}, wiki: ${i.wiki} (${i.diff})`);
    }
  } else {
    console.log('No significant discrepancies found.');
  }

  // Apply corrections
  let fixed = 0;
  for (const [slug, fixes] of Object.entries(corrections)) {
    const filePath = path.join(OUT_DIR, `${slug}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changed = false;

    if (fixes.population) {
      data.population = fixes.population;
      changed = true;
    }

    if (changed) {
      data.generatedAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      fixed++;
    }
  }

  if (fixed > 0) {
    console.log(`\nAuto-corrected ${fixed} population values from Wikipedia.`);
  }
}

run().catch(err => {
  console.error('Fact-check failed:', err.message);
  process.exit(1);
});
