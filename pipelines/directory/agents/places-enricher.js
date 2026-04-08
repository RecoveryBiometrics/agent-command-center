/**
 * Agent 7: Places Enricher — Enriches listings with Google Places data.
 *
 * For each business, searches the Places API (New) for:
 *   - Operating hours
 *   - Star rating + review count
 *   - Google Maps place ID (for direct Maps link)
 *   - Photos (reference only — URLs served via Places Photos API)
 *   - Verified address (overwrites if Places has better data)
 *
 * Runs after business discovery. Only enriches listings that don't
 * already have Places data (idempotent).
 *
 * Requires: GOOGLE_GENAI_API_KEY (same key, Places API enabled on project)
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { logChange } = require('../../seo-content/changelog');

const API_KEY = process.env.GOOGLE_GENAI_API_KEY
  || process.env.GOOGLE_AI_API_KEY
  || process.env.GOOGLE_API_KEY;

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

// Rate limit: 1 request per second to stay within free tier
async function rateLimit() {
  await new Promise(r => setTimeout(r, 1100));
}

/**
 * Search for a business on Google Places and return enrichment data.
 */
async function searchPlace(businessName, city, state) {
  const query = `${businessName} ${city} ${state}`;

  const response = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.regularOpeningHours,places.googleMapsUri,places.photos,places.businessStatus',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Places API ${response.status}: ${err}`);
  }

  const data = await response.json();
  if (!data.places || data.places.length === 0) return null;

  const place = data.places[0];

  // Only return if business status is operational
  if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
    return { closed: true, status: place.businessStatus };
  }

  const result = {
    placeId: place.id || null,
    googleMapsUrl: place.googleMapsUri || null,
    rating: place.rating || null,
    reviewCount: place.userRatingCount || null,
    businessStatus: place.businessStatus || null,
  };

  // Parse hours
  if (place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions) {
    result.hours = place.regularOpeningHours.weekdayDescriptions;
  }

  // Parse address
  if (place.formattedAddress) {
    result.formattedAddress = place.formattedAddress;
  }

  // Photo references (first 3)
  if (place.photos && place.photos.length > 0) {
    result.photoRefs = place.photos.slice(0, 3).map(p => p.name);
  }

  return result;
}

/**
 * Enrich a single city's businesses with Places data.
 */
async function enrichCity(citySlug) {
  if (!API_KEY) {
    console.log('  [Places] No API key — skipping enrichment.');
    return { enriched: 0, skipped: 0, failed: 0 };
  }

  const wikiPath = path.join(config.WIKI_DATA_DIR, `${citySlug}.json`);
  if (!fs.existsSync(wikiPath)) return { enriched: 0, skipped: 0, failed: 0 };

  const data = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
  const businesses = data.localBusinesses || [];

  if (businesses.length === 0) return { enriched: 0, skipped: 0, failed: 0 };

  let enriched = 0, skipped = 0, failed = 0;
  let modified = false;

  for (const biz of businesses) {
    // Skip if already enriched
    if (biz.places) {
      skipped++;
      continue;
    }

    try {
      await rateLimit();
      const result = await searchPlace(biz.name, data.cityName, data.state);

      if (!result) {
        failed++;
        continue;
      }

      if (result.closed) {
        console.log(`    [Places] ${biz.name}: ${result.status} — consider removing`);
        biz.places = { status: result.status, enrichedAt: new Date().toISOString() };
        modified = true;
        continue;
      }

      // Apply enrichment
      biz.places = {
        placeId: result.placeId,
        googleMapsUrl: result.googleMapsUrl,
        rating: result.rating,
        reviewCount: result.reviewCount,
        hours: result.hours || null,
        photoRefs: result.photoRefs || null,
        enrichedAt: new Date().toISOString(),
      };

      // Update address if Places has better data and we don't have structured address
      if (result.formattedAddress && !biz.address) {
        // Try to parse the formatted address
        const parts = result.formattedAddress.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5})/);
        if (parts) {
          biz.address = { street: parts[1].trim(), city: parts[2].trim(), state: parts[3], zip: parts[4] };
        }
      }

      enriched++;
      modified = true;
      console.log(`    [Places] ${biz.name}: ${result.rating || 'no'} stars, ${result.reviewCount || 0} reviews`);

    } catch (err) {
      console.log(`    [Places] ${biz.name}: failed — ${err.message}`);
      failed++;
    }
  }

  if (modified) {
    fs.writeFileSync(wikiPath, JSON.stringify(data, null, 2));

    if (enriched > 0) {
      logChange({
        page: `/directory/${citySlug}`,
        action: 'enriched',
        detail: `${enriched} businesses enriched with Google Places data (ratings, hours, photos)`,
        source: 'places-enricher',
      });
    }
  }

  return { enriched, skipped, failed };
}

/**
 * Enrich all cities that have businesses.
 */
async function enrichAll() {
  const files = fs.readdirSync(config.WIKI_DATA_DIR).filter(f => f.endsWith('.json'));
  let totalEnriched = 0, totalSkipped = 0, totalFailed = 0;

  for (const file of files) {
    const slug = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(config.WIKI_DATA_DIR, file), 'utf8'));
    const bizCount = (data.localBusinesses || []).length;

    if (bizCount === 0) continue;

    // Skip cities where all businesses are already enriched
    const unenriched = (data.localBusinesses || []).filter(b => !b.places).length;
    if (unenriched === 0) {
      totalSkipped += bizCount;
      continue;
    }

    console.log(`  [Places] Enriching ${slug} (${unenriched} unenriched)...`);
    const result = await enrichCity(slug);
    totalEnriched += result.enriched;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  return { enriched: totalEnriched, skipped: totalSkipped, failed: totalFailed };
}

module.exports = { enrichCity, enrichAll, searchPlace };
