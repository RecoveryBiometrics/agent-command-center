/**
 * Wiki Generator — Two-Track City Content System
 *
 * Track 1 (--history): Generate city history from Wikipedia data.
 *   - Fetches Wikipedia REST API for summary, demographics, history
 *   - Writes clean JSON to src/data/city-wiki/{slug}.json
 *   - One-time process, no API key needed
 *
 * Track 2 (--businesses): Discover real local businesses via Gemini.
 *   - Uses Gemini 2.0 Flash with grounded search
 *   - Pipeline: Discoverer → Verifier → Categorizer → Engineer
 *   - Merges businesses into existing city wiki JSON files
 *   - Requires GOOGLE_GENAI_API_KEY environment variable
 *
 * Usage:
 *   node scripts/wiki-generator/index.js --history               # Next batch of city histories
 *   node scripts/wiki-generator/index.js --history --all         # All city histories
 *   node scripts/wiki-generator/index.js --history --city west-chester  # Single city history
 *   node scripts/wiki-generator/index.js --businesses            # Next batch of businesses
 *   node scripts/wiki-generator/index.js --businesses --all      # All cities businesses
 *   node scripts/wiki-generator/index.js --businesses --city west-chester  # Single city
 *   node scripts/wiki-generator/index.js --reset                 # Reset state, start over
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// Track 1: History generation (Wikipedia)
const { researchCity } = require('./researcher.legacy');

// Track 2: Business discovery pipeline (Gemini)
const { discoverBusinesses } = require('./agents/discoverer');
const { verifyBusinesses, resetGlobalIndex } = require('./agents/verifier');
const { categorizeBusinesses } = require('./agents/categorizer');
const { mergeBusinesses } = require('./agents/engineer');

// Quality system
const { auditCity, auditAll } = require('./agents/auditor');
const { researchAndFix, applyPendingCorrections } = require('./agents/researcher-agent');
const { printReport } = require('./agents/quality-report');

// Places enrichment
const { enrichAll } = require('./agents/places-enricher');

function loadCities() {
  return JSON.parse(fs.readFileSync(config.CITIES_FILE, 'utf8'));
}

async function readDispatchFromSheet() {
  if (!config.TRACKING_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) return [];

  try {
    const { google } = require('googleapis');
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.TRACKING_SHEET_ID,
      range: 'Dispatch!A:F',
    });

    const rows = res.data.values;
    if (!rows || rows.length <= 1) return [];

    const instructions = [];
    const consumedRows = [];

    for (let i = 1; i < rows.length; i++) {
      const [date, target, type, params, reason, status] = rows[i];
      if (target === 'directory' && status === 'pending') {
        try {
          instructions.push({ type, ...JSON.parse(params || '{}'), reason });
          consumedRows.push(i + 1);
        } catch (e) {
          instructions.push({ type, reason });
          consumedRows.push(i + 1);
        }
      }
    }

    for (const rowNum of consumedRows) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.TRACKING_SHEET_ID,
        range: `Dispatch!F${rowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['consumed']] },
      });
    }

    if (instructions.length > 0) {
      console.log(`[Analytics Dispatch] Read ${instructions.length} instructions from Sheet`);
    }
    return instructions;
  } catch (err) {
    console.warn(`[Analytics Dispatch] Sheet read failed: ${err.message}`);
    return [];
  }
}

function loadState() {
  if (fs.existsSync(config.STATE_FILE)) {
    return JSON.parse(fs.readFileSync(config.STATE_FILE, 'utf8'));
  }
  return { lastOffset: 0, processedCities: [], lastRun: null, businessOffset: 0 };
}

function saveState(state) {
  fs.writeFileSync(config.STATE_FILE, JSON.stringify(state, null, 2));
}

// generateStandardBusinesses() was removed 2026-03-27.
// It generated fake templated listings ("{City} Senior Center", "VNA — {City} Area", etc.)
// that were never verified. All business data must come from Gemini grounded search
// via the discovery pipeline (--businesses) and pass verification before being added.

// =====================================================================
// Track 1: History Generation
// =====================================================================

async function processHistoryCity(city) {
  const outputPath = path.join(config.WIKI_DATA_DIR, `${city.slug}.json`);

  // Skip if already generated (unless --city was used, which deletes first)
  if (fs.existsSync(outputPath)) {
    console.log(`  ${city.name}: already exists, skipping`);
    return { city: city.name, slug: city.slug, skipped: true };
  }

  try {
    // Research history from Wikipedia
    const wiki = await researchCity(city);

    // Load any curated overrides (only verified businesses)
    let overrides = {};
    if (fs.existsSync(config.OVERRIDES_FILE)) {
      try { overrides = JSON.parse(fs.readFileSync(config.OVERRIDES_FILE, 'utf8')); } catch {}
    }
    const allBusinesses = overrides[city.slug] || [];

    const wikiData = {
      cityName: city.name,
      citySlug: city.slug,
      state: city.state,
      county: city.county,
      summary: wiki.summary,
      founded: wiki.founded,
      population: wiki.population,
      seniorPopulationPct: '',
      history: wiki.history,
      localBusinesses: allBusinesses,
      generatedAt: new Date().toISOString(),
    };

    if (!fs.existsSync(config.WIKI_DATA_DIR)) {
      fs.mkdirSync(config.WIKI_DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(wikiData, null, 2));

    console.log(`  ${city.name}: DONE — ${wiki.history.length} history entries, ${allBusinesses.length} businesses`);

    return {
      city: city.name,
      slug: city.slug,
      historyEntries: wiki.history.length,
      businesses: allBusinesses.length,
      founded: wiki.founded,
    };
  } catch (err) {
    console.error(`  ${city.name}: FAILED — ${err.message}`);
    return { city: city.name, slug: city.slug, failed: true, error: err.message };
  }
}

async function runHistory(args) {
  console.log('Wiki Generator — Track 1: City History\n');

  const allCities = loadCities();

  // Handle --city <slug>
  const cityIdx = args.indexOf('--city');
  if (cityIdx !== -1 && args[cityIdx + 1]) {
    const slug = args[cityIdx + 1];
    const city = allCities.find(c => c.slug === slug);
    if (!city) {
      console.error(`City "${slug}" not found in cities-data.json`);
      process.exit(1);
    }
    // Force regeneration for single city
    const outputPath = path.join(config.WIKI_DATA_DIR, `${slug}.json`);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    await processHistoryCity(city);
    return;
  }

  const processAll = args.includes('--all');
  const state = loadState();
  let offset = state.lastOffset;
  if (offset >= allCities.length) offset = 0;

  const batch = processAll
    ? allCities
    : allCities.slice(offset, offset + config.CITIES_PER_RUN);

  const nextOffset = processAll ? allCities.length : offset + batch.length;

  console.log(processAll
    ? `Processing ALL ${allCities.length} cities\n`
    : `Processing cities ${offset + 1}–${offset + batch.length} of ${allCities.length}\n`
  );

  const results = [];
  const failures = [];

  for (const city of batch) {
    console.log(`\n--- ${city.name}, ${city.state} ---`);
    const result = await processHistoryCity(city);
    if (result.failed) failures.push(result);
    else results.push(result);

    // Rate limit: 2 seconds between cities
    if (batch.indexOf(city) < batch.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Save state
  if (!processAll) {
    saveState({
      ...state,
      lastOffset: nextOffset >= allCities.length ? 0 : nextOffset,
      processedCities: [
        ...state.processedCities,
        ...results.filter(r => !r.skipped).map(r => r.slug),
      ],
      lastRun: new Date().toISOString(),
    });
  }

  printSummary('History', batch, results, failures, processAll ? null : nextOffset, allCities.length);
}

// =====================================================================
// Track 2: Business Discovery Pipeline
// =====================================================================

async function processBusinessCity(city) {
  try {
    // Step 1: Discover
    const raw = await discoverBusinesses(city);
    if (raw.length === 0) {
      console.log(`  ${city.name}: No businesses found`);
      return { city: city.name, slug: city.slug, businesses: 0, added: 0 };
    }

    // Step 2: Verify
    const verified = await verifyBusinesses(raw, city);
    if (verified.length === 0) {
      console.log(`  ${city.name}: No businesses passed verification`);
      return { city: city.name, slug: city.slug, businesses: 0, added: 0 };
    }

    // Step 3: Categorize
    const categorized = await categorizeBusinesses(verified, city);

    // Step 4: Engineer — merge into wiki JSON
    const result = mergeBusinesses(categorized, city);

    return {
      city: city.name,
      slug: city.slug,
      businesses: result.total,
      added: result.added,
    };
  } catch (err) {
    console.error(`  ${city.name}: FAILED — ${err.message}`);
    return { city: city.name, slug: city.slug, failed: true, error: err.message };
  }
}

async function runBusinesses(args) {
  console.log('Wiki Generator — Track 2: Business Directory\n');

  // Check for Gemini API key (accepts multiple env var names)
  const hasKey = process.env[config.GEMINI.API_KEY_ENV]
    || process.env.GOOGLE_AI_API_KEY
    || process.env.GOOGLE_API_KEY;
  if (!hasKey) {
    console.error(`ERROR: No Gemini API key found.`);
    console.error(`Set one of: ${config.GEMINI.API_KEY_ENV}, GOOGLE_AI_API_KEY, or GOOGLE_API_KEY`);
    console.error('Get a free key from https://aistudio.google.com/apikey');
    process.exit(1);
  }

  let allCities = loadCities();
  resetGlobalIndex();

  // Read analytics dispatch from Sheet
  const instructions = await readDispatchFromSheet();
  if (instructions.length > 0) {
    for (const instruction of instructions) {
      if (instruction.type === 'prioritize_regions' && instruction.regions) {
        const prioritized = [];
        const rest = [];
        for (const city of allCities) {
          const match = instruction.regions.some(target =>
            (city.county && target.includes(city.county)) ||
            city.name.includes(target) || city.state === target ||
            target.includes(city.name)
          );
          if (match) prioritized.push(city);
          else rest.push(city);
        }
        if (prioritized.length > 0) {
          console.log(`[Analytics Dispatch] Prioritized ${prioritized.length} cities: ${prioritized.map(c => c.name).join(', ')}`);
          allCities = [...prioritized, ...rest];
        }
      }
    }
  }

  // Handle --city <slug>
  const cityIdx = args.indexOf('--city');
  if (cityIdx !== -1 && args[cityIdx + 1]) {
    const slug = args[cityIdx + 1];
    const city = allCities.find(c => c.slug === slug);
    if (!city) {
      console.error(`City "${slug}" not found in cities-data.json`);
      process.exit(1);
    }
    await processBusinessCity(city);
    return;
  }

  const processAll = args.includes('--all');
  const state = loadState();
  let offset = state.businessOffset || 0;
  if (offset >= allCities.length) offset = 0;

  const batch = processAll
    ? allCities
    : allCities.slice(offset, offset + config.CITIES_PER_RUN);

  const nextOffset = processAll ? allCities.length : offset + batch.length;

  console.log(processAll
    ? `Processing ALL ${allCities.length} cities\n`
    : `Processing cities ${offset + 1}–${offset + batch.length} of ${allCities.length}\n`
  );

  const results = [];
  const failures = [];

  for (const city of batch) {
    console.log(`\n--- ${city.name}, ${city.state} ---`);
    const result = await processBusinessCity(city);
    if (result.failed) failures.push(result);
    else results.push(result);
  }

  // Save state
  if (!processAll) {
    saveState({
      ...state,
      businessOffset: nextOffset >= allCities.length ? 0 : nextOffset,
      lastBusinessRun: new Date().toISOString(),
    });
  }

  printSummary('Business Directory', batch, results, failures, processAll ? null : nextOffset, allCities.length);
}

// =====================================================================
// Track 3: Quality Audit
// =====================================================================

async function runAudit(args) {
  console.log('Wiki Generator — Quality Audit\n');

  const useGemini = !!( process.env[config.GEMINI.API_KEY_ENV]
    || process.env.GOOGLE_AI_API_KEY
    || process.env.GOOGLE_API_KEY);
  const checkWebsites = !args.includes('--skip-websites');
  const autoFix = args.includes('--fix');

  console.log(`Options: Gemini=${useGemini}, websites=${checkWebsites}, autoFix=${autoFix}\n`);

  const auditResults = await auditAll({ useGemini, checkWebsites });

  let researchResults = null;
  if (autoFix && useGemini) {
    console.log('\n--- Running Researcher on flagged listings ---\n');
    researchResults = await researchAndFix(auditResults);
  }

  printReport(auditResults, researchResults);
}

// =====================================================================
// Shared
// =====================================================================

function printSummary(mode, batch, results, failures, nextOffset, totalCities) {
  const generated = results.filter(r => !r.skipped);
  const skipped = results.filter(r => r.skipped);

  console.log('\n========================================');
  console.log(`Wiki Generator Complete — ${mode}`);
  console.log('========================================');
  console.log(`Cities processed: ${batch.length}`);
  console.log(`Successful: ${generated.length}`);
  if (skipped.length > 0) console.log(`Skipped (already exist): ${skipped.length}`);
  console.log(`Failures: ${failures.length}${failures.length > 0 ? ` (${failures.map(f => f.city).join(', ')})` : ''}`);

  if (nextOffset !== null) {
    console.log(`Next batch starts at city #${nextOffset >= totalCities ? 1 : nextOffset + 1}`);
  }

  if (generated.length > 0) {
    console.log('\nProcessed:');
    for (const r of generated) {
      if (r.historyEntries !== undefined) {
        console.log(`  ${r.city}: ${r.historyEntries} history, ${r.businesses} businesses${r.founded ? `, est. ${r.founded}` : ''}`);
      } else {
        console.log(`  ${r.city}: ${r.businesses} total businesses (${r.added} new)`);
      }
    }
  }
}

// =====================================================================
// Main
// =====================================================================

async function run() {
  const args = process.argv.slice(2);

  // Handle --reset
  if (args.includes('--reset')) {
    saveState({ lastOffset: 0, processedCities: [], lastRun: null, businessOffset: 0 });
    console.log('State reset. Run again to start processing.');
    return;
  }

  const mode = args.includes('--businesses') ? 'businesses'
    : args.includes('--history') ? 'history'
    : args.includes('--audit') ? 'audit'
    : args.includes('--enrich') ? 'enrich'
    : args.includes('--quality-report') ? 'quality-report'
    : args.includes('--apply-corrections') ? 'apply-corrections'
    : null;

  if (!mode) {
    console.log('Wiki Generator\n');
    console.log('Usage:');
    console.log('  --history              Generate city history from Wikipedia');
    console.log('  --history --all        Process all cities');
    console.log('  --history --city SLUG  Process single city');
    console.log('  --businesses           Discover local businesses via Gemini');
    console.log('  --businesses --all     Process all cities');
    console.log('  --businesses --city SLUG  Process single city');
    console.log('  --enrich               Enrich listings with Google Places data');
    console.log('  --audit                Audit all existing listings');
    console.log('  --audit --fix          Audit + auto-fix with Researcher');
    console.log('  --quality-report       Generate quality report');
    console.log('  --apply-corrections    Apply pending corrections');
    console.log('  --reset                Reset all progress state');
    return;
  }

  if (mode === 'history') {
    await runHistory(args);
  } else if (mode === 'audit') {
    await runAudit(args);
  } else if (mode === 'enrich') {
    console.log('Wiki Generator — Places Enrichment\n');
    const result = await enrichAll();
    console.log(`\nEnrichment complete: ${result.enriched} enriched, ${result.skipped} already done, ${result.failed} failed`);
  } else if (mode === 'quality-report') {
    printReport();
  } else if (mode === 'apply-corrections') {
    const result = applyPendingCorrections();
    console.log(`Applied ${result.applied} corrections, ${result.remaining} remaining.`);
  } else {
    await runBusinesses(args);
  }
}

run().catch(err => {
  console.error('Wiki generator failed:', err.message);
  process.exit(1);
});
