/**
 * Agent 2: Verifier — Validates that discovered businesses are real.
 *
 * Cross-references search results, flags duplicates across cities,
 * checks for closed/defunct businesses, and rejects obviously
 * generated/template entries.
 */
const { generate } = require('../lib/gemini');

// Patterns that indicate a generated/template business name
const TEMPLATE_PATTERNS = [
  /^(city|county|state|local|area)\s+(physical therapy|medical|health)/i,
  /^(generic|example|sample|test)\s+/i,
  /^(the\s+)?(best|top|premier|leading)\s+/i,
  /lorem ipsum/i,
  /placeholder/i,
];

// Track all businesses across cities for cross-city deduplication
const globalBusinessIndex = new Map();

/**
 * Check if a business name looks like a template/generated entry.
 */
function isTemplateName(name) {
  return TEMPLATE_PATTERNS.some(p => p.test(name));
}

/**
 * Check if this business is a duplicate of one already seen (cross-city).
 */
function isDuplicateAcrossCities(business) {
  const key = business.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (globalBusinessIndex.has(key)) {
    return true;
  }
  return false;
}

/**
 * Register a business in the global index (call after verification passes).
 */
function registerBusiness(business, citySlug) {
  const key = business.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  globalBusinessIndex.set(key, { ...business, citySlug });
}

/**
 * Verify a batch of discovered businesses for a city.
 *
 * @param {object[]} businesses - Raw discovered businesses
 * @param {object} city - City object { name, slug, state, county }
 * @returns {Promise<object[]>} - Verified businesses (filtered)
 */
async function verifyBusinesses(businesses, city) {
  console.log(`  [Verifier] Verifying ${businesses.length} businesses for ${city.name}...`);

  const verified = [];
  const rejected = [];

  for (const biz of businesses) {
    // Rule 1: Reject template/generated names
    if (isTemplateName(biz.name)) {
      rejected.push({ ...biz, reason: 'template-name' });
      continue;
    }

    // Rule 2: Reject if name is too short or too generic
    if (biz.name.length < 5) {
      rejected.push({ ...biz, reason: 'name-too-short' });
      continue;
    }

    // Rule 3: Flag cross-city duplicates (same business, different city)
    // Note: Some businesses (chains) legitimately appear in multiple cities
    if (isDuplicateAcrossCities(biz)) {
      // Allow chains but mark them
      biz.isChain = true;
    }

    verified.push(biz);
  }

  // Batch verification via Gemini — ask if these look like real businesses
  if (verified.length > 0) {
    try {
      const nameList = verified.map(b => `- ${b.name} (${b.type})`).join('\n');
      const prompt = `I have a list of businesses reportedly in ${city.name}, ${city.state}. For each one, tell me if it seems like a real, currently operating business or if it seems fake/closed/generated.

Businesses:
${nameList}

Respond in JSON format:
{
  "results": [
    { "name": "...", "status": "real" | "suspicious" | "closed", "note": "..." }
  ]
}

Only mark as "suspicious" or "closed" if you have specific reason to doubt it. Default to "real" if uncertain.`;

      const result = await require('../lib/gemini').generateJSON(prompt, { groundedSearch: true, maxTokens: 1024 });

      if (result?.results) {
        const statusMap = new Map(result.results.map(r => [r.name.toLowerCase(), r]));

        const finalVerified = [];
        for (const biz of verified) {
          const status = statusMap.get(biz.name.toLowerCase());
          if (status?.status === 'closed') {
            rejected.push({ ...biz, reason: 'closed', note: status.note });
          } else if (status?.status === 'suspicious') {
            rejected.push({ ...biz, reason: 'suspicious', note: status.note });
          } else {
            registerBusiness(biz, city.slug);
            finalVerified.push(biz);
          }
        }

        console.log(`  [Verifier] ${finalVerified.length} verified, ${rejected.length} rejected for ${city.name}`);
        return finalVerified;
      }
    } catch (err) {
      console.log(`  [Verifier] Warning: Gemini verification failed, using heuristic results — ${err.message}`);
    }
  }

  // Fallback: register all that passed heuristic checks
  for (const biz of verified) {
    registerBusiness(biz, city.slug);
  }

  console.log(`  [Verifier] ${verified.length} verified (heuristic), ${rejected.length} rejected for ${city.name}`);
  return verified;
}

/**
 * Reset global index (e.g., at start of a new run).
 */
function resetGlobalIndex() {
  globalBusinessIndex.clear();
}

module.exports = { verifyBusinesses, resetGlobalIndex };
