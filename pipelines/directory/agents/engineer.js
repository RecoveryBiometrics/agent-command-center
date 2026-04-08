/**
 * Agent 4: Engineer — Merges new businesses into city wiki JSON files.
 *
 * Handles:
 * - Merging new businesses into existing localBusinesses array
 * - Curated overrides from business-overrides.json always take priority
 * - Deduplication against existing entries
 * - Preserving all other city wiki data (history, summary, etc.)
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { logChange } = require('../../seo-content/changelog');

/**
 * Load curated business overrides.
 */
function loadOverrides() {
  if (!fs.existsSync(config.OVERRIDES_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(config.OVERRIDES_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Track businesses seen across ALL cities in this run to limit regional duplication
const globalSeenBusinesses = new Map(); // name -> array of city slugs

/**
 * Deduplicate businesses by normalized name.
 * Also limits regional businesses to max 3 cities — after that, they're
 * consolidated by the directory's dedup layer instead of repeated per city.
 */
function deduplicateBusinesses(businesses, citySlug) {
  const seen = new Set();
  return businesses.filter(biz => {
    const key = biz.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Within-city dedup
    if (seen.has(key)) return false;
    seen.add(key);

    // Cross-city dedup — allow a business in up to 3 cities max
    if (!globalSeenBusinesses.has(key)) {
      globalSeenBusinesses.set(key, [citySlug]);
    } else {
      const cities = globalSeenBusinesses.get(key);
      if (cities.length >= 3 && !cities.includes(citySlug)) {
        return false; // Already in 3 other cities, skip
      }
      if (!cities.includes(citySlug)) cities.push(citySlug);
    }

    return true;
  });
}

/**
 * Merge new businesses into a city's wiki JSON file.
 *
 * Priority order:
 * 1. Curated overrides (business-overrides.json)
 * 2. Newly discovered businesses
 * 3. Existing businesses already in the file
 *
 * @param {object[]} newBusinesses - Categorized businesses from the categorizer
 * @param {object} city - City object { name, slug, state, county }
 * @returns {object} - Result { updated: boolean, total: number, added: number }
 */
function mergeBusinesses(newBusinesses, city) {
  console.log(`  [Engineer] Merging ${newBusinesses.length} businesses into ${city.slug}.json...`);

  const filePath = path.join(config.WIKI_DATA_DIR, `${city.slug}.json`);

  // Load existing wiki data
  let wikiData;
  if (fs.existsSync(filePath)) {
    try {
      wikiData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      console.log(`  [Engineer] Warning: Could not parse ${city.slug}.json, skipping`);
      return { updated: false, total: 0, added: 0 };
    }
  } else {
    console.log(`  [Engineer] Warning: ${city.slug}.json does not exist yet, skipping (run --history first)`);
    return { updated: false, total: 0, added: 0 };
  }

  const existingBusinesses = wikiData.localBusinesses || [];
  const overrides = loadOverrides();
  const curatedForCity = overrides[city.slug] || [];

  // Merge: overrides first, then new discoveries, then existing
  const merged = deduplicateBusinesses([
    ...curatedForCity,
    ...newBusinesses,
    ...existingBusinesses,
  ], city.slug);

  // Keep all verified businesses — more listings = more value
  const final = merged;

  const added = Math.max(0, final.length - existingBusinesses.length);

  // Update the wiki data
  wikiData.localBusinesses = final;
  wikiData.generatedAt = new Date().toISOString();

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(wikiData, null, 2));

  console.log(`  [Engineer] ${city.slug}.json: ${final.length} total businesses (${Math.max(0, added)} new)`);

  // Log to changelog
  if (added > 0) {
    const newNames = final.slice(0, added).map(b => b.name).join(', ');
    logChange({
      page: `/directory/listing/${city.slug}`,
      action: 'business-added',
      detail: `${added} businesses added: ${newNames}`,
      source: 'business-discovery',
    });
  }

  return { updated: true, total: final.length, added: Math.max(0, added) };
}

module.exports = { mergeBusinesses };
