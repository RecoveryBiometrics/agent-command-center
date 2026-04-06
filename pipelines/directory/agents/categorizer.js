/**
 * Agent 3: Categorizer — Assigns business types and relevance descriptions.
 *
 * Maps discovered businesses to display types, writes descriptions of how
 * each business relates to aging-in-place / grab bar installation,
 * and ensures consistency across the directory.
 */
const config = require('../config');
const { generateJSON } = require('../lib/gemini');

/**
 * Map a raw business type to a display type using config.
 */
function mapDisplayType(rawType) {
  // Direct match
  if (config.BUSINESS_TYPE_MAP[rawType]) {
    return config.BUSINESS_TYPE_MAP[rawType];
  }

  // Fuzzy match — find closest category
  const lower = rawType.toLowerCase();
  for (const [category, displayType] of Object.entries(config.BUSINESS_TYPE_MAP)) {
    if (lower.includes(category.toLowerCase()) || category.toLowerCase().includes(lower)) {
      return displayType;
    }
  }

  // Default mappings for common variations
  if (lower.includes('physical therap')) return 'PT Clinic';
  if (lower.includes('occupational therap')) return 'OT Clinic';
  if (lower.includes('home health')) return 'Home Health';
  if (lower.includes('senior') || lower.includes('aging')) return 'Senior Center';
  if (lower.includes('medical supply') || lower.includes('durable medical')) return 'Medical Supply';
  if (lower.includes('home care') || lower.includes('homecare')) return 'Home Care';
  if (lower.includes('assisted living') || lower.includes('senior living')) return 'Assisted Living';
  if (lower.includes('rehab')) return 'Rehab Center';
  if (lower.includes('elder law') || lower.includes('attorney')) return 'Elder Law';
  if (lower.includes('care manage') || lower.includes('geriatric')) return 'Care Manager';

  return rawType;
}

/**
 * Get a relevance description for a business type.
 */
function getRelevance(rawType) {
  // Direct match
  if (config.RELEVANCE_MAP[rawType]) {
    return config.RELEVANCE_MAP[rawType];
  }

  // Fuzzy match
  const lower = rawType.toLowerCase();
  for (const [category, relevance] of Object.entries(config.RELEVANCE_MAP)) {
    if (lower.includes(category.toLowerCase()) || category.toLowerCase().includes(lower)) {
      return relevance;
    }
  }

  return 'Local service provider complementary to home safety and aging-in-place modifications.';
}

/**
 * Parse a flat address string into structured {street, city, state, zip}.
 * Handles formats like "924 S High St, West Chester, PA 19382"
 */
function parseAddress(addrStr) {
  if (!addrStr || addrStr.length < 5) return null;

  // Try: "street, city, STATE ZIP"
  const full = addrStr.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
  if (full) {
    return { street: full[1].trim(), city: full[2].trim(), state: full[3], zip: full[4] };
  }

  // Try: "street, city, STATE" (no zip)
  const noZip = addrStr.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})$/);
  if (noZip) {
    return { street: noZip[1].trim(), city: noZip[2].trim(), state: noZip[3], zip: '' };
  }

  // Try: "city, STATE ZIP" (no street — skip, not useful enough)
  return null;
}

/**
 * Categorize and enrich a batch of verified businesses.
 *
 * @param {object[]} businesses - Verified businesses from the verifier
 * @param {object} city - City object { name, slug, state, county }
 * @returns {Promise<object[]>} - Categorized businesses with descriptions and relevance
 */
async function categorizeBusinesses(businesses, city) {
  console.log(`  [Categorizer] Processing ${businesses.length} businesses for ${city.name}...`);

  if (businesses.length === 0) return [];

  // Ask Gemini to write descriptions and relevance for each business
  const businessList = businesses.map(b =>
    `- ${b.name} (${b.type})${b.address ? ` at ${b.address}` : ''}`
  ).join('\n');

  let descriptions = null;
  try {
    const prompt = `For each of the following businesses in ${city.name}, ${city.state}, write:
1. A brief description (1-2 sentences) of what this business does
2. A brief explanation of how this business relates to grab bar installation and aging-in-place home safety

Businesses:
${businessList}

Respond in JSON format:
{
  "businesses": [
    { "name": "...", "description": "...", "relevance": "..." }
  ]
}

Keep descriptions factual and professional. Do not use marketing language.`;

    descriptions = await generateJSON(prompt, { maxTokens: 2048 });
  } catch (err) {
    console.log(`  [Categorizer] Warning: Gemini descriptions failed, using defaults — ${err.message}`);
  }

  const descMap = new Map();
  if (descriptions?.businesses) {
    for (const d of descriptions.businesses) {
      descMap.set(d.name.toLowerCase(), d);
    }
  }

  const categorized = businesses.map(biz => {
    const geminiDesc = descMap.get(biz.name.toLowerCase());
    const displayType = mapDisplayType(biz.type);
    const relevance = geminiDesc?.relevance || getRelevance(biz.type);
    const description = geminiDesc?.description || `${displayType} serving the ${city.name} area.`;

    const entry = {
      name: biz.name,
      type: displayType,
      description,
      relevance,
      ...(biz.website ? { website: biz.website } : {}),
      ...(biz.phone ? { phone: biz.phone } : {}),
    };

    // Parse address string into structured format
    if (biz.address && typeof biz.address === 'string' && biz.address.length > 5) {
      const parsed = parseAddress(biz.address);
      if (parsed) entry.address = parsed;
    } else if (biz.address && typeof biz.address === 'object' && biz.address.street) {
      entry.address = biz.address;
    }

    return entry;
  });

  console.log(`  [Categorizer] Categorized ${categorized.length} businesses for ${city.name}`);
  return categorized;
}

module.exports = { categorizeBusinesses };
