/**
 * Agent 1: Discoverer — Finds real local businesses using Gemini grounded search.
 *
 * Searches by category for businesses complementary to grab bar installation:
 * PT clinics, OT practices, senior centers, home health agencies,
 * medical supply stores, elder law attorneys, etc.
 *
 * Outputs raw business data: name, type, address, phone, website (when findable).
 */
const config = require('../config');
const { generateJSON } = require('../lib/gemini');

/**
 * Discover businesses for a city across all configured categories.
 *
 * @param {object} city - City object { name, slug, state, county }
 * @returns {Promise<object[]>} - Array of raw business entries
 */
async function discoverBusinesses(city) {
  console.log(`  [Discoverer] Searching for businesses in ${city.name}, ${city.state}...`);

  const allResults = [];

  // Batch categories into groups of 2 to avoid token truncation
  const categoryGroups = [];
  for (let i = 0; i < config.BUSINESS_CATEGORIES.length; i += 2) {
    categoryGroups.push(config.BUSINESS_CATEGORIES.slice(i, i + 2));
  }

  for (const group of categoryGroups) {
    const categoryList = group.join(', ');
    const countyName = city.county.replace(`, ${city.state}`, '');

    const prompt = `Find real, currently operating businesses in or near ${city.name}, ${city.state} (${countyName}) in these categories: ${categoryList}.

For each business found, provide:
- name: The exact business name
- type: Which category it belongs to (one of: ${categoryList})
- address: Street address if available, or city/state
- phone: Phone number if available
- website: Website URL if available

Return ONLY real businesses you can verify exist. Do NOT make up or generate fictional businesses.
If you cannot find any real businesses in a category, skip that category.
Limit to 5 businesses per category maximum.

Respond in JSON format:
{
  "businesses": [
    { "name": "...", "type": "...", "address": "...", "phone": "...", "website": "..." }
  ]
}`;

    try {
      const result = await generateJSON(prompt, { groundedSearch: true, maxTokens: 4096 });

      if (result?.businesses && Array.isArray(result.businesses)) {
        for (const biz of result.businesses) {
          if (biz.name && biz.type) {
            // Clean website URL
            let website = (biz.website || '').trim();
            const webLower = website.toLowerCase();
            if (webLower === 'n/a' || webLower === 'null' || webLower === 'none' || webLower.startsWith('not ') || website.length < 5) {
              website = '';
            } else if (website && !website.startsWith('http')) {
              website = 'https://' + website;
            }

            // Clean phone
            let phone = (biz.phone || '').trim();
            const phoneLower = phone.toLowerCase();
            if (phoneLower.startsWith('not ') || phoneLower === 'n/a' || phoneLower === 'null' || phone.length < 7) {
              phone = '';
            }

            allResults.push({
              name: biz.name.trim(),
              type: biz.type.trim(),
              address: (biz.address || '').trim(),
              phone,
              website,
              source: 'gemini-grounded-search',
              discoveredAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.log(`  [Discoverer] Warning: Failed to search for [${categoryList}] — ${err.message}`);
    }
  }

  console.log(`  [Discoverer] Found ${allResults.length} raw results for ${city.name}`);
  return allResults;
}

module.exports = { discoverBusinesses };
