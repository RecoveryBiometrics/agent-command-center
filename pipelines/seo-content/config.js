/**
 * Shared Config Loader
 *
 * Reads business config from agent-command-center/businesses/{id}.yaml
 * Usage: node index.js --business safebath
 *
 * Falls back to env vars for backward compatibility during migration.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Resolve which business we're running for
const args = process.argv.slice(2);
const businessFlag = args.indexOf('--business');
const businessId = businessFlag >= 0 ? args[businessFlag + 1] : process.env.BUSINESS_ID;

if (!businessId) {
  console.error('ERROR: No business specified. Use --business <id> or set BUSINESS_ID env var.');
  console.error('Available businesses:');
  const bizDir = path.join(__dirname, '../../businesses');
  if (fs.existsSync(bizDir)) {
    fs.readdirSync(bizDir)
      .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
      .forEach(f => console.error(`  ${f.replace('.yaml', '')}`));
  }
  process.exit(1);
}

// Load the YAML
const yamlPath = path.join(__dirname, '../../businesses', `${businessId}.yaml`);
if (!fs.existsSync(yamlPath)) {
  console.error(`ERROR: Business config not found: ${yamlPath}`);
  process.exit(1);
}

const biz = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

// Resolve the business project path
// In CI (GitHub Actions), BUSINESS_PROJECT_PATH overrides the YAML path
const rawPath = process.env.BUSINESS_PROJECT_PATH || biz.org.path;
const projectPath = rawPath.replace('~', process.env.HOME);

// Content output directory — where generated articles get written
// Looks for content.output_dir in YAML, defaults to src/data/local-news
const contentOutputDir = biz.content?.output_dir || 'website/src/data/local-news';

// In CI, store pipeline state inside the business project (so it gets committed)
// Locally, store state in the shared pipeline's state/ directory
const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
const stateFilePath = isCI
  ? path.resolve(projectPath, biz.content?.state_file_path || 'scripts/content-pipeline/pipeline-state.json')
  : path.join(__dirname, `state/${businessId}-pipeline-state.json`);

module.exports = {
  // Business identity
  BUSINESS_ID: biz.id,
  BUSINESS_NAME: biz.name,

  // How many cities to process per run
  CITIES_PER_RUN: biz.service_areas?.cities_per_run || 8,

  // Paths — relative to the business project
  NEWS_DATA_DIR: path.resolve(projectPath, contentOutputDir),
  STATE_FILE: stateFilePath,
  CITIES_DATA_PATH: path.resolve(projectPath, biz.service_areas?.cities_data_path || 'scripts/content-pipeline/cities-data.json'),
  CHANGELOG_PATH: path.resolve(projectPath, biz.content?.changelog_path || 'website/src/data/content-changelog.json'),

  // Content rules
  MAX_SIMILARITY_PERCENT: biz.content?.max_similarity_percent || 85,
  MAX_RETRY_ATTEMPTS: biz.content?.max_retry_attempts || 3,

  // Brand rules (injected into every agent prompt)
  BRAND: {
    name: biz.name,
    phone: biz.brand?.phone_display || '',
    url: biz.website,
    pricing: biz.brand?.pricing_text || '',
    cta: biz.brand?.cta || '',
    trustSignals: biz.brand?.trust_signals || [],
    voice: biz.brand?.voice || '',
  },

  // Reddit subreddits to scan for content ideas
  SUBREDDITS: biz.content?.subreddits || [],

  // Content categories
  CATEGORIES: biz.content?.categories || ['local-news'],

  // Phone overrides by county
  PHONE_OVERRIDES: Object.fromEntries(
    Object.entries(biz.service_areas?.phone_overrides || {}).map(([county, info]) => [
      county,
      typeof info === 'string'
        ? { display: info, tel: '' }
        : { display: info.display, tel: info.tel },
    ])
  ),

  // URL slug prefix for city pages (e.g., "bathroom-safety" → /bathroom-safety-west-chester-pa)
  CITY_SLUG_PREFIX: biz.content?.city_slug_prefix || biz.id,

  // Google Sheet tracking
  TRACKING_SHEET_ID: biz.tracking_sheet_id || '',

  // Slack
  SLACK_OPS_CHANNEL: biz.slack?.ops_log_channel || '',
  SLACK_CEO_CHANNEL: biz.slack?.ceo_channel || '',
  SLACK_BUSINESS_CHANNEL: biz.slack?.business_channel || '',

  // SEO
  GSC_SITE_URL: biz.seo?.gsc_site_url || '',
  GA4_PROPERTY_ID: biz.seo?.ga4_property_id || '',
  SITEMAP_URL: biz.seo?.sitemap_url || '',

  // Email
  EMAIL_TO: biz.brand?.email || process.env.EMAIL_TO || 'bill@reiamplifi.com',

  // Raw YAML access (for anything not mapped above)
  _raw: biz,
};
