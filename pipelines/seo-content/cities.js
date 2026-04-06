/**
 * Loads city data from the business project's cities-data.json.
 */
const path = require('path');
const config = require('./config');

function parseCities() {
  return require(config.CITIES_DATA_PATH);
}

/**
 * Get the phone number for a city based on its county.
 */
function getPhoneForCity(city) {
  const override = config.PHONE_OVERRIDES[city.county];
  if (override) return override;
  return { display: config.BRAND.phone, tel: '' };
}

/**
 * Generate the URL slug for a city page.
 * Uses the city_slug_prefix from the business YAML.
 */
function slugifyCity(city) {
  const slug = city.name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return `${config.CITY_SLUG_PREFIX}-${slug}-${city.state.toLowerCase()}`;
}

module.exports = { parseCities, getPhoneForCity, slugifyCity };
