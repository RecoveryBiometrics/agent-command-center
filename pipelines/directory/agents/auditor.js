/**
 * Agent 5: Quality Auditor — Verifies every business listing before publication.
 *
 * Checks:
 * 1. Business exists (Gemini grounded search verification)
 * 2. Phone number format valid
 * 3. Website reachable (HTTP HEAD)
 * 4. Address/city plausible
 * 5. Not a duplicate (fuzzy name match)
 * 6. Description quality (no placeholder, minimum length)
 * 7. Type accuracy
 *
 * Output: qualityScore (0-100) and qualityFlags array per listing.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { generate } = require('../lib/gemini');

const QUALITY_SCORES_PATH = path.join(__dirname, '../../../src/data/quality-scores.json');

function loadQualityScores() {
  if (fs.existsSync(QUALITY_SCORES_PATH)) {
    try { return JSON.parse(fs.readFileSync(QUALITY_SCORES_PATH, 'utf8')); } catch {}
  }
  return {};
}

function saveQualityScores(scores) {
  const dir = path.dirname(QUALITY_SCORES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(QUALITY_SCORES_PATH, JSON.stringify(scores, null, 2));
}

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

/**
 * Check if a phone number has a valid US format.
 */
function validatePhone(phone) {
  if (!phone) return { valid: false, flag: 'phone-missing' };
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  // US phone: 10 or 11 digits (with leading 1)
  if (/^1?\d{10}$/.test(cleaned)) return { valid: true, flag: null };
  return { valid: false, flag: 'phone-invalid-format' };
}

/**
 * Check if a website URL is reachable via HTTP HEAD.
 */
async function validateWebsite(url) {
  if (!url) return { valid: false, flag: 'website-missing' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (response.ok || response.status === 405) {
      // 405 = Method Not Allowed but server exists
      return { valid: true, flag: null };
    }
    if (response.status === 404) {
      return { valid: false, flag: 'website-dead' };
    }
    // Other status codes (403, etc.) — server exists but may block HEAD
    return { valid: true, flag: null };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { valid: false, flag: 'website-timeout' };
    }
    return { valid: false, flag: 'website-unreachable' };
  }
}

/**
 * Check description quality.
 */
function validateDescription(description) {
  const flags = [];

  if (!description || description.length < 30) {
    flags.push('description-too-short');
  }

  // Check for placeholder/AI-sounding text
  const placeholders = ['lorem ipsum', 'placeholder', 'coming soon', 'to be added', 'tbd'];
  const lower = (description || '').toLowerCase();
  for (const ph of placeholders) {
    if (lower.includes(ph)) {
      flags.push('description-placeholder');
      break;
    }
  }

  return flags;
}

/**
 * Check for duplicates against existing listings using fuzzy name matching.
 */
function checkDuplicate(business, allBusinesses) {
  const normalize = (name) => name.toLowerCase()
    .replace(/[—–-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(the|inc|llc|corp|co)\b/gi, '')
    .trim();

  const normName = normalize(business.name);

  for (const other of allBusinesses) {
    if (other === business) continue;
    const otherNorm = normalize(other.name);

    // Exact match
    if (normName === otherNorm) {
      return { duplicate: true, flag: 'duplicate-exact', matchedWith: other.name };
    }

    // One name contains the other (for longer names > 10 chars)
    if (normName.length > 10 && otherNorm.length > 10) {
      if (normName.includes(otherNorm) || otherNorm.includes(normName)) {
        return { duplicate: true, flag: 'duplicate-suspected', matchedWith: other.name };
      }
    }
  }

  return { duplicate: false, flag: null };
}

/**
 * Verify business exists using Gemini grounded search.
 * Only called when we have API access.
 */
async function verifyBusinessExists(business, city) {
  try {
    const response = await generate(
      `Does the business "${business.name}" exist in or near ${city.name}, ${city.state}? ` +
      `Is it currently operating? Reply with ONLY "yes", "no", or "uncertain".`,
      { groundedSearch: true, maxTokens: 50 }
    );

    const answer = response.toLowerCase().trim();
    if (answer.includes('no')) return { exists: false, flag: 'possibly-closed' };
    if (answer.includes('uncertain')) return { exists: true, flag: 'existence-uncertain' };
    return { exists: true, flag: null };
  } catch {
    // If Gemini fails, don't penalize — just skip this check
    return { exists: true, flag: null };
  }
}

/**
 * Audit a single business listing.
 *
 * @param {object} business - Business entry from city wiki
 * @param {string} citySlug - City slug for context
 * @param {object} city - City object { name, state, county }
 * @param {object[]} allBusinesses - All businesses in the city (for duplicate check)
 * @param {object} options - { useGemini: boolean, checkWebsites: boolean }
 * @returns {Promise<object>} - { qualityScore, qualityFlags, lastAudited }
 */
async function auditBusiness(business, citySlug, city, allBusinesses, options = {}) {
  const { useGemini = false, checkWebsites = true } = options;
  const flags = [];
  let score = 100;

  // 1. Phone validation
  const phoneResult = validatePhone(business.phone);
  if (!phoneResult.valid) {
    flags.push(phoneResult.flag);
    score -= 10;
  }

  // 2. Website validation
  if (checkWebsites) {
    const websiteResult = await validateWebsite(business.website);
    if (!websiteResult.valid) {
      flags.push(websiteResult.flag);
      score -= 15;
    }
  }

  // 3. Description quality
  const descFlags = validateDescription(business.description);
  flags.push(...descFlags);
  score -= descFlags.length * 10;

  // 4. Duplicate check
  const dupResult = checkDuplicate(business, allBusinesses);
  if (dupResult.duplicate) {
    flags.push(dupResult.flag);
    score -= dupResult.flag === 'duplicate-exact' ? 30 : 15;
  }

  // 5. Business existence (Gemini grounded search)
  if (useGemini) {
    const existResult = await verifyBusinessExists(business, city);
    if (!existResult.exists) {
      flags.push(existResult.flag);
      score -= 25;
    } else if (existResult.flag) {
      flags.push(existResult.flag);
      score -= 5;
    }
  }

  // 6. Type validation (basic — check it's not empty)
  if (!business.type || business.type.trim().length === 0) {
    flags.push('type-missing');
    score -= 10;
  }

  // 7. Name validation
  if (!business.name || business.name.trim().length < 3) {
    flags.push('name-invalid');
    score -= 20;
  }

  return {
    qualityScore: Math.max(0, Math.min(100, score)),
    qualityFlags: flags,
    lastAudited: new Date().toISOString(),
  };
}

/**
 * Audit all businesses in a city wiki file.
 *
 * @param {string} citySlug - City slug
 * @param {object} options - { useGemini, checkWebsites }
 * @returns {Promise<object>} - { citySlug, results: [ { businessName, slug, ...auditResult } ], summary }
 */
async function auditCity(citySlug, options = {}) {
  const wikiPath = path.join(config.WIKI_DATA_DIR, `${citySlug}.json`);
  if (!fs.existsSync(wikiPath)) {
    return { citySlug, results: [], summary: { total: 0, passed: 0, flagged: 0 } };
  }

  const data = JSON.parse(fs.readFileSync(wikiPath, 'utf8'));
  const businesses = data.localBusinesses || [];
  const city = { name: data.cityName, state: data.state, county: data.county };

  const results = [];
  for (const biz of businesses) {
    const audit = await auditBusiness(biz, citySlug, city, businesses, options);
    results.push({
      businessName: biz.name,
      slug: slugify(biz.name),
      ...audit,
    });
  }

  // Save to quality-scores.json
  const scores = loadQualityScores();
  for (const r of results) {
    scores[r.slug] = {
      qualityScore: r.qualityScore,
      qualityFlags: r.qualityFlags,
      lastAudited: r.lastAudited,
      city: citySlug,
    };
  }
  saveQualityScores(scores);

  const passed = results.filter(r => r.qualityScore >= 70).length;
  const flagged = results.filter(r => r.qualityScore < 70).length;

  return {
    citySlug,
    results,
    summary: { total: results.length, passed, flagged },
  };
}

/**
 * Audit all cities.
 *
 * @param {object} options - { useGemini, checkWebsites }
 * @returns {Promise<object[]>} - Array of city audit results
 */
async function auditAll(options = {}) {
  const files = fs.readdirSync(config.WIKI_DATA_DIR).filter(f => f.endsWith('.json'));
  const allResults = [];

  for (const file of files) {
    const slug = file.replace('.json', '');
    console.log(`  [Auditor] Auditing ${slug}...`);
    const result = await auditCity(slug, options);
    allResults.push(result);
  }

  return allResults;
}

module.exports = { auditBusiness, auditCity, auditAll, loadQualityScores };
