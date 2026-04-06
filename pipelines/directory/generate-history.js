/**
 * Generate City History JSON — Processes raw Wikipedia data into final city wiki files.
 *
 * Reads from wiki-raw/ and writes to src/data/city-wiki/
 * Assigns meaningful era labels and builds standard business entries.
 *
 * Usage: node scripts/wiki-generator/generate-history.js
 */
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'wiki-raw');
const OUT_DIR = path.join(__dirname, '../../src/data/city-wiki');
const OVERRIDES_FILE = path.join(__dirname, 'business-overrides.json');

const STATE_NAMES = {
  PA: 'Pennsylvania', DE: 'Delaware', MD: 'Maryland',
  NV: 'Nevada', SC: 'South Carolina',
};

/**
 * Aggressively clean Wikipedia text artifacts.
 * Removes reference numbers, citation markers, "See also:" prefixes,
 * image captions, and truncates at sentence boundaries.
 */
function deepClean(text) {
  let cleaned = text
    // Remove "See also:", "Further information:", "Main article:" prefixes
    .replace(/^(?:See also|Further information|Main article)[:\s].*?(?=\b[A-Z])/gi, '')
    // Remove Wikipedia reference numbers (standalone digits that are refs)
    .replace(/,?\s+\d{1,3}\s+(?=[A-Z])/g, ' ')    // " 45 The" → " The"  ", 5 The" → " The"
    .replace(/\s+\d{1,3}\s*$/g, '')                // trailing " 13"
    .replace(/\s+\d{1,2}\s+\d{1,2}\s+/g, ' ')     // " 10 11 " → " "
    .replace(/\.\s+\d{1,3}\s+/g, '. ')             // ". 45 " → ". "
    .replace(/\s+[a-z]\s+(?=[A-Z])/g, ' ')         // " a The" → " The" (footnote letters)
    .replace(/\s+sv\s+/g, ' ')                     // " sv " interwiki links
    .replace(/\[\s*\d+\s*\]/g, '')                  // [7] style references
    .replace(/\[\s*\w\s*\]/g, '')                   // [a] style references
    .replace(/\[?\s*citation needed\s*\]?/gi, '')
    .replace(/\[?\s*clarification needed\s*\]?/gi, '')
    .replace(/\[?\s*when\?\s*\]?/gi, '')
    .replace(/\[?\s*who\?\s*\]?/gi, '')
    .replace(/\[?\s*verification needed\s*\]?/gi, '')
    .replace(/\[?\s*dubious[^]]*\]?/gi, '')
    // Remove image/caption artifacts — these appear at start of sections
    // Pattern: text ending in "depicted in..." or "portrait by..." before real content
    .replace(/^[^.]*?(?:depicted in|portrait by|painting by|photograph by|portrait of)[^.]*?\./gi, '')
    // Remove additional leading captions (may be multiple)
    .replace(/^[^.]*?(?:depicted in|portrait by|painting by|photograph by|portrait of)[^.]*?\./gi, '')
    // Remove "See also:" and "Further information:" and "Main article:" fragments
    .replace(/^(?:See also|Further information|Main article|Pennsylvania in)[^.]*?\.\s*/gi, '')
    // Remove image description fragments like "A 1683 portrait of Philadelphia..."
    .replace(/^A \d{4} (?:portrait|photograph|painting|map|image|illustration)[^.]*?\.\s*/gi, '')
    // Remove HTML entities
    .replace(/&#\d+;/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    // Clean up spacing
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .replace(/\s+,/g, ',')
    .trim();

  // Truncate at last complete sentence (ending with period)
  const lastPeriod = cleaned.lastIndexOf('.');
  if (lastPeriod > 100 && lastPeriod < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastPeriod + 1);
  }

  // Remove any remaining stray reference numbers at word boundaries
  cleaned = cleaned.replace(/\s+\d{1,2}(?=\s+[A-Z])/g, '');

  return cleaned.trim();
}

/**
 * Fix population from summary text when raw extraction failed or got wrong number.
 */
function fixPopulation(raw) {
  const summary = raw.summary || '';

  // Handle "population of 1.6 million" style
  const millionMatch = summary.match(/population\s+(?:of|was)\s+([\d.]+)\s*million/i);
  if (millionMatch) {
    const num = Math.round(parseFloat(millionMatch[1]) * 1000000);
    return num.toLocaleString();
  }

  // Handle "population of 18,671" style
  const popMatch = summary.match(/population\s+(?:of|was)\s+([\d,]+)/i);
  if (popMatch && popMatch[1].length > 2) return popMatch[1];

  // Handle "had X residents" style
  const resMatch = summary.match(/([\d,]+)\s+residents/i);
  if (resMatch && resMatch[1].length > 3) return resMatch[1];

  // Fall back to raw extraction
  return raw.population || '';
}

// Known data overrides for cities where extraction fails
const CITY_OVERRIDES = {
  'las-vegas': { founded: '1905', population: '641,903' },
  'philadelphia': { population: '1,603,797' },
  'myrtle-beach': { founded: '1938' },
  'north-las-vegas': { founded: '1946', population: '262,527' },
  'summerlin': { population: '115,488' },
  'enterprise': { population: '171,017' },
  'conway': { founded: '1732', population: '24,849' },
  'center-city': { population: '68,000' },
  'manayunk': { population: '10,000' },
  'bethesda': { population: '33,006' },
  'chevy-chase': { population: '10,200' },
  'potomac': { population: '46,262' },
};

// Era assignment based on year ranges
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

// Build history timeline from raw sections
function buildHistory(raw) {
  const sections = raw.historySections || [];
  if (sections.length === 0) return [];

  return sections.map(s => {
    const cleaned = deepClean(s.description);
    // Skip entries that are too short after cleaning
    if (cleaned.length < 60) return null;

    const era = assignEra(cleaned);
    let title = s.title ? deepClean(s.title) : '';
    // Remove generic "History" suffix from titles, make them descriptive
    if (!title || title === 'History') title = `${era}`;
    // Clean up title — remove "edit" links and brackets
    title = title.replace(/\[edit\]/gi, '').replace(/\[\s*\]/g, '').trim();

    return {
      era,
      title,
      description: cleaned,
    };
  }).filter(Boolean).slice(0, 6); // Cap at 6 entries
}

// Generate standard business entries
function generateBusinesses(city) {
  const countyName = city.county.replace(`, ${city.state}`, '');
  const stateFull = STATE_NAMES[city.state] || city.state;

  const entries = [
    {
      name: `${countyName} Area Agency on Aging`,
      type: 'Senior Services',
      description: `Government agency coordinating senior services across ${countyName}. Provides information on home modifications, meal delivery, transportation, and caregiver support programs.`,
      relevance: 'AAAs connect seniors with funding for home safety modifications including grab bar installation.',
    },
    {
      name: `${city.cityName} Senior Center`,
      type: 'Senior Center',
      description: `Community center offering programs, meals, social activities, and resource referrals for seniors in the ${city.cityName} area.`,
      relevance: 'Senior centers are gathering places where residents learn about home safety services and modifications.',
    },
    {
      name: `${countyName} Department of Human Services`,
      type: 'Social Services',
      description: `County department providing social services including home modification assistance programs, Medicaid waiver programs, and aging-in-place support for ${countyName} residents.`,
      relevance: 'Some home modification programs cover or subsidize grab bar installation for qualifying seniors.',
    },
    {
      name: `Visiting Nurses Association — ${city.cityName} Area`,
      type: 'Home Health',
      description: `Home health nursing and rehabilitation services for seniors and individuals recovering from surgery or illness in the ${city.cityName} area.`,
      relevance: 'Home health nurses frequently identify bathroom safety hazards and recommend grab bar installation.',
    },
    {
      name: `${stateFull} 2-1-1 Resource Helpline`,
      type: 'Resource Helpline',
      description: `Dial 2-1-1 for free, confidential referrals to local health and human services including home modification programs, senior assistance, and caregiver support.`,
      relevance: '2-1-1 connects callers with local programs that may fund or subsidize bathroom safety modifications.',
    },
  ];

  // State-specific programs
  const statePrograms = {
    PA: { name: 'PA OPTIONS Program (Aging Waiver)', type: 'State Program', description: "Pennsylvania's OPTIONS program provides home modification services for qualifying seniors aged 60+, including grab bar installation, through the Aging Waiver and other state-funded programs.", relevance: 'The PA OPTIONS program may cover grab bar installation costs for income-qualifying seniors.' },
    DE: { name: 'Delaware Division of Services for Aging & Adults (DSAAPD)', type: 'State Program', description: "Delaware's aging services division coordinates home modification programs, Medicaid waivers, and community-based services for seniors statewide.", relevance: 'DSAAPD administers programs that may fund bathroom safety modifications for qualifying Delaware seniors.' },
    MD: { name: 'Maryland Department of Aging', type: 'State Program', description: 'The Maryland Department of Aging coordinates home modification programs, senior centers, and community-based services for older Marylanders.', relevance: 'Maryland offers several programs that may assist with home safety modification costs for seniors.' },
    NV: { name: 'Nevada Aging & Disability Services Division', type: 'State Program', description: "Nevada's ADSD coordinates home and community-based services, Medicaid waiver programs, and senior support services statewide.", relevance: 'Nevada ADSD programs may assist with home modification costs for qualifying seniors.' },
    SC: { name: "South Carolina Lt. Governor's Office on Aging", type: 'State Program', description: "South Carolina's aging services office coordinates Area Agencies on Aging, home modification programs, and senior support services statewide.", relevance: 'SC aging programs may provide funding assistance for home safety modifications.' },
  };

  if (statePrograms[city.state]) {
    entries.push(statePrograms[city.state]);
  }

  // Apply overrides
  let overrides = {};
  if (fs.existsSync(OVERRIDES_FILE)) {
    try { overrides = JSON.parse(fs.readFileSync(OVERRIDES_FILE, 'utf8')); } catch {}
  }
  const curated = overrides[city.citySlug] || [];

  const seen = new Set();
  return [...curated, ...entries].filter(b => {
    const key = b.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

// For Philadelphia neighborhoods, use "Philadelphia Corporation for Aging" instead of county AAA
function adjustPhiladelphiaBusinesses(businesses, cityName) {
  return businesses.map(b => {
    if (b.name === 'Philadelphia County Area Agency on Aging') {
      return {
        ...b,
        name: 'Philadelphia Corporation for Aging (PCA)',
        description: 'Philadelphia\'s Area Agency on Aging, coordinating senior services citywide including home modification programs, caregiver support, and aging-in-place resources.',
      };
    }
    return b;
  });
}

function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));
  console.log(`Processing ${rawFiles.length} cities...`);

  let generated = 0;
  let noHistory = 0;

  for (const file of rawFiles) {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf8'));
    const history = buildHistory(raw);

    if (history.length === 0) noHistory++;

    let businesses = generateBusinesses(raw);

    // Philadelphia neighborhood adjustment
    if (raw.county === 'Philadelphia County, PA') {
      businesses = adjustPhiladelphiaBusinesses(businesses, raw.cityName);
    }

    const wikiData = {
      cityName: raw.cityName,
      citySlug: raw.citySlug,
      state: raw.state,
      county: raw.county,
      summary: deepClean(raw.summary || ''),
      founded: (CITY_OVERRIDES[raw.citySlug]?.founded) || raw.founded || '',
      population: (CITY_OVERRIDES[raw.citySlug]?.population) || fixPopulation(raw) || '',
      seniorPopulationPct: '',
      history,
      localBusinesses: businesses,
      generatedAt: new Date().toISOString(),
    };

    const outPath = path.join(OUT_DIR, `${raw.citySlug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(wikiData, null, 2));
    generated++;

    console.log(`  [${generated}/${rawFiles.length}] ${raw.cityName}: ${history.length} history, ${businesses.length} businesses`);
  }

  console.log(`\nDone. ${generated} cities generated. ${noHistory} cities with no history sections (will need manual enrichment).`);
}

run();
