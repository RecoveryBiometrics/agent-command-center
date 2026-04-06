/**
 * Agent 6: Researcher — Auto-researches and fixes flagged quality problems.
 *
 * When the Auditor flags a problem, the Researcher is triggered to:
 * 1. Dead website → Search for current website
 * 2. Phone not found → Search for current phone
 * 3. Possibly closed → Check if business closed, moved, or rebranded
 * 4. Duplicate suspected → Research whether two listings are the same
 * 5. Low quality description → Rewrite using verified search results
 *
 * Outputs correction records with confidence scores.
 * High confidence (>0.8) corrections are auto-applied.
 * Lower confidence corrections go to corrections-pending.json for review.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { generateJSON } = require('../lib/gemini');

const CORRECTIONS_PENDING_PATH = path.join(__dirname, '../corrections-pending.json');

function loadPendingCorrections() {
  if (fs.existsSync(CORRECTIONS_PENDING_PATH)) {
    try { return JSON.parse(fs.readFileSync(CORRECTIONS_PENDING_PATH, 'utf8')); } catch {}
  }
  return [];
}

function savePendingCorrections(corrections) {
  fs.writeFileSync(CORRECTIONS_PENDING_PATH, JSON.stringify(corrections, null, 2));
}

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

/**
 * Research a flagged business and attempt to find corrections.
 *
 * @param {object} business - The business entry
 * @param {string[]} flags - Quality flags from the auditor
 * @param {object} city - City object { name, state, county }
 * @returns {Promise<object|null>} - Correction record or null
 */
async function researchBusiness(business, flags, city) {
  const corrections = {};
  let action = 'update';
  let confidence = 0;

  // Research dead/unreachable websites
  if (flags.includes('website-missing') || flags.includes('website-dead') || flags.includes('website-unreachable') || flags.includes('website-timeout')) {
    console.log(`    [Researcher] Searching for current website: ${business.name}`);
    try {
      const result = await generateJSON(
        `Find the current, working website URL for "${business.name}" in ${city.name}, ${city.state}. ` +
        `If the business has closed or no longer has a website, say so. ` +
        `Respond in JSON: { "website": "https://..." or null, "status": "found" | "closed" | "not-found", "confidence": 0.0-1.0 }`,
        { groundedSearch: true, maxTokens: 200 }
      );

      if (result.status === 'closed') {
        action = 'remove';
        confidence = result.confidence || 0.7;
      } else if (result.website && result.status === 'found') {
        corrections.website = result.website;
        confidence = Math.max(confidence, result.confidence || 0.8);
      }
    } catch (err) {
      console.log(`    [Researcher] Website search failed: ${err.message}`);
    }
  }

  // Research invalid/missing phone
  if (flags.includes('phone-missing') || flags.includes('phone-invalid-format') || flags.includes('phone-not-found')) {
    console.log(`    [Researcher] Searching for phone number: ${business.name}`);
    try {
      const result = await generateJSON(
        `Find the current phone number for "${business.name}" in ${city.name}, ${city.state}. ` +
        `Respond in JSON: { "phone": "formatted number" or null, "confidence": 0.0-1.0 }`,
        { groundedSearch: true, maxTokens: 200 }
      );

      if (result.phone) {
        corrections.phone = result.phone;
        confidence = Math.max(confidence, result.confidence || 0.7);
      }
    } catch (err) {
      console.log(`    [Researcher] Phone search failed: ${err.message}`);
    }
  }

  // Research missing address
  if (!business.address) {
    console.log(`    [Researcher] Searching for address: ${business.name}`);
    try {
      const result = await generateJSON(
        `Find the street address for "${business.name}" in ${city.name}, ${city.state}. ` +
        `Respond in JSON: { "address": { "street": "123 Main St", "city": "City", "state": "PA", "zip": "19380" } or null, "confidence": 0.0-1.0 }`,
        { groundedSearch: true, maxTokens: 300 }
      );

      if (result.address && result.address.street) {
        corrections.address = result.address;
        confidence = Math.max(confidence, result.confidence || 0.7);
      }
    } catch (err) {
      console.log(`    [Researcher] Address search failed: ${err.message}`);
    }
  }

  // Research possibly closed businesses
  if (flags.includes('possibly-closed')) {
    console.log(`    [Researcher] Checking if business is still operating: ${business.name}`);
    try {
      const result = await generateJSON(
        `Is "${business.name}" in ${city.name}, ${city.state} currently operating? ` +
        `If it has closed, moved, or rebranded, provide details. ` +
        `Respond in JSON: { "status": "operating" | "closed" | "moved" | "rebranded", ` +
        `"newName": "..." or null, "newLocation": "..." or null, "confidence": 0.0-1.0 }`,
        { groundedSearch: true, maxTokens: 300 }
      );

      if (result.status === 'closed') {
        action = 'remove';
        confidence = Math.max(confidence, result.confidence || 0.7);
      } else if (result.status === 'rebranded' && result.newName) {
        corrections.name = result.newName;
        confidence = Math.max(confidence, result.confidence || 0.6);
      } else if (result.status === 'moved' && result.newLocation) {
        // Keep the listing, just note the move
        confidence = Math.max(confidence, result.confidence || 0.5);
      }
    } catch (err) {
      console.log(`    [Researcher] Status check failed: ${err.message}`);
    }
  }

  // Research low quality descriptions
  if (flags.includes('description-too-short') || flags.includes('description-placeholder')) {
    console.log(`    [Researcher] Rewriting description: ${business.name}`);
    try {
      const result = await generateJSON(
        `Write a factual, 2-3 sentence description of "${business.name}" in ${city.name}, ${city.state}. ` +
        `It is a ${business.type}. Describe what services they provide and who they serve. ` +
        `Use only verified information. Do NOT make up details. ` +
        `Respond in JSON: { "description": "...", "confidence": 0.0-1.0 }`,
        { groundedSearch: true, maxTokens: 400 }
      );

      if (result.description && result.description.length >= 30) {
        corrections.description = result.description;
        confidence = Math.max(confidence, result.confidence || 0.7);
      }
    } catch (err) {
      console.log(`    [Researcher] Description rewrite failed: ${err.message}`);
    }
  }

  // If no corrections found, return null
  if (Object.keys(corrections).length === 0 && action === 'update') {
    return null;
  }

  return {
    slug: slugify(business.name),
    businessName: business.name,
    citySlug: city.slug || slugify(city.name),
    corrections,
    action,
    source: `gemini-search-${new Date().toISOString().split('T')[0]}`,
    confidence,
    researchedAt: new Date().toISOString(),
  };
}

/**
 * Process all flagged businesses from audit results.
 *
 * @param {object[]} auditResults - Array of city audit results from auditor
 * @param {object} options - { autoApplyThreshold: number (default 0.8) }
 * @returns {Promise<object>} - { applied: [], pending: [], removed: [] }
 */
async function researchAndFix(auditResults, options = {}) {
  const { autoApplyThreshold = 0.8 } = options;
  const applied = [];
  const pending = loadPendingCorrections();
  const removed = [];

  for (const cityResult of auditResults) {
    const flaggedBusinesses = cityResult.results.filter(r => r.qualityFlags.length > 0);
    if (flaggedBusinesses.length === 0) continue;

    // Load the city wiki data
    const wikiPath = path.join(config.WIKI_DATA_DIR, `${cityResult.citySlug}.json`);
    if (!fs.existsSync(wikiPath)) continue;

    const data = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
    let modified = false;

    for (const flagged of flaggedBusinesses) {
      const business = data.localBusinesses.find(b => slugify(b.name) === flagged.slug);
      if (!business) continue;

      const city = { name: data.cityName, state: data.state, county: data.county, slug: data.citySlug };
      const correction = await researchBusiness(business, flagged.qualityFlags, city);
      if (!correction) continue;

      if (correction.confidence >= autoApplyThreshold) {
        if (correction.action === 'remove') {
          // Remove from the businesses list
          data.localBusinesses = data.localBusinesses.filter(b => slugify(b.name) !== flagged.slug);
          removed.push(correction);
          modified = true;
          console.log(`    [Researcher] REMOVED: ${business.name} (confidence: ${correction.confidence})`);
        } else {
          // Apply corrections
          for (const [key, value] of Object.entries(correction.corrections)) {
            business[key] = value;
          }
          applied.push(correction);
          modified = true;
          console.log(`    [Researcher] AUTO-CORRECTED: ${business.name} — ${Object.keys(correction.corrections).join(', ')}`);
        }
      } else {
        pending.push(correction);
        console.log(`    [Researcher] PENDING REVIEW: ${business.name} (confidence: ${correction.confidence})`);
      }
    }

    if (modified) {
      fs.writeFileSync(wikiPath, JSON.stringify(data, null, 2));
    }
  }

  savePendingCorrections(pending);

  return { applied, pending: pending.length, removed };
}

/**
 * Apply pending corrections from corrections-pending.json.
 *
 * @returns {object} - { applied: number, remaining: number }
 */
function applyPendingCorrections() {
  const pending = loadPendingCorrections();
  if (pending.length === 0) {
    console.log('No pending corrections to apply.');
    return { applied: 0, remaining: 0 };
  }

  let appliedCount = 0;
  const remaining = [];

  for (const correction of pending) {
    const wikiPath = path.join(config.WIKI_DATA_DIR, `${correction.citySlug}.json`);
    if (!fs.existsSync(wikiPath)) {
      remaining.push(correction);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
    const business = data.localBusinesses.find(b => slugify(b.name) === correction.slug);

    if (!business) {
      remaining.push(correction);
      continue;
    }

    if (correction.action === 'remove') {
      data.localBusinesses = data.localBusinesses.filter(b => slugify(b.name) !== correction.slug);
    } else {
      for (const [key, value] of Object.entries(correction.corrections)) {
        business[key] = value;
      }
    }

    fs.writeFileSync(wikiPath, JSON.stringify(data, null, 2));
    appliedCount++;
    console.log(`  Applied: ${correction.businessName} in ${correction.citySlug}`);
  }

  savePendingCorrections(remaining);
  return { applied: appliedCount, remaining: remaining.length };
}

module.exports = { researchBusiness, researchAndFix, applyPendingCorrections };
