/**
 * Shared Directory Pipeline Config
 *
 * Reads business config from agent-command-center/businesses/{id}.yaml
 * Usage: node index.js --business safebath --businesses
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
  const bizDir = path.join(__dirname, '../../businesses');
  if (fs.existsSync(bizDir)) {
    console.error('Available:');
    fs.readdirSync(bizDir)
      .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
      .forEach(f => console.error(`  ${f.replace('.yaml', '')}`));
  }
  process.exit(1);
}

const yamlPath = path.join(__dirname, '../../businesses', `${businessId}.yaml`);
if (!fs.existsSync(yamlPath)) {
  console.error(`ERROR: Business config not found: ${yamlPath}`);
  process.exit(1);
}

const biz = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

// Resolve the business project path
const rawPath = process.env.BUSINESS_PROJECT_PATH || biz.org.path;
const projectPath = rawPath.replace('~', process.env.HOME);

const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

module.exports = {
  // How many cities to process per run
  CITIES_PER_RUN: biz.directory?.cities_per_run || 10,

  // Paths — relative to the business project
  WIKI_DATA_DIR: path.resolve(projectPath, biz.directory?.wiki_data_dir || 'website/src/data/city-wiki'),
  STATE_FILE: isCI
    ? path.resolve(projectPath, 'scripts/wiki-generator/wiki-state.json')
    : path.join(__dirname, `state/${businessId}-wiki-state.json`),
  CITIES_FILE: path.resolve(projectPath, biz.service_areas?.cities_data_path || 'website/scripts/content-pipeline/cities-data.json'),
  OVERRIDES_FILE: path.resolve(projectPath, biz.directory?.overrides_file || 'website/scripts/wiki-generator/business-overrides.json'),

  // Gemini configuration
  GEMINI: {
    MODEL: biz.directory?.gemini_model || 'gemini-2.5-flash',
    API_KEY_ENV: 'GOOGLE_GENAI_API_KEY',
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: biz.directory?.rate_limit_requests_per_min || 15,
      DELAY_BETWEEN_REQUESTS_MS: biz.directory?.rate_limit_delay_ms || 4000,
      MAX_RETRIES: 3,
      RETRY_DELAY_MS: 10000,
    },
    MAX_CALLS_PER_CITY: biz.directory?.max_calls_per_city || 15,
  },

  // Business categories to search for
  BUSINESS_CATEGORIES: biz.directory?.business_categories || [],

  // Business type labels for display
  BUSINESS_TYPE_MAP: {
    'Physical Therapy': 'PT Clinic',
    'Occupational Therapy': 'OT Clinic',
    'Home Health Agency': 'Home Health',
    'Senior Center': 'Senior Center',
    'Medical Supply Store': 'Medical Supply',
    'Home Care Agency': 'Home Care',
    'Assisted Living': 'Assisted Living',
    'Rehabilitation Center': 'Rehab Center',
    'Elder Law Attorney': 'Elder Law',
    'Geriatric Care Manager': 'Care Manager',
  },

  // Relevance descriptions
  RELEVANCE_MAP: {
    'Physical Therapy': 'PT clinics often recommend grab bars for patients recovering from falls or surgery.',
    'Occupational Therapy': 'OTs assess home safety and frequently prescribe grab bar installations.',
    'Home Health Agency': 'Home health aides help seniors who benefit from bathroom safety modifications.',
    'Senior Center': 'Community resource connecting seniors with local services including home safety.',
    'Medical Supply Store': 'Carries mobility aids and safety equipment complementary to grab bars.',
    'Home Care Agency': 'Caregivers who assist seniors in homes that need safety upgrades.',
    'Assisted Living': 'Alternative to aging in place — grab bars help seniors stay home longer.',
    'Rehabilitation Center': 'Rehab patients transitioning home often need bathroom safety modifications.',
    'Elder Law Attorney': 'Helps families plan for aging in place, including home modification funding.',
    'Geriatric Care Manager': 'Coordinates senior care services including home safety assessments.',
  },

  // Business identity (for logging)
  BUSINESS_ID: biz.id,
  BUSINESS_NAME: biz.name,

  // Analytics dispatch — read instructions from analytics pipeline if present
  ANALYTICS_DISPATCH: (() => {
    const dispatchPath = path.join(__dirname, `../../state/${businessId}/directory-dispatch.json`);
    if (fs.existsSync(dispatchPath)) {
      try {
        const dispatch = JSON.parse(fs.readFileSync(dispatchPath, 'utf8'));
        console.log(`[Analytics Dispatch] Found ${dispatch.instructions?.length || 0} instructions from ${dispatch.dispatched_by || 'unknown'}`);
        return dispatch;
      } catch (e) {
        console.warn(`[Analytics Dispatch] Could not read ${dispatchPath}: ${e.message}`);
      }
    }
    return null;
  })(),

  clearAnalyticsDispatch() {
    const dispatchPath = path.join(__dirname, `../../state/${businessId}/directory-dispatch.json`);
    if (fs.existsSync(dispatchPath)) {
      fs.unlinkSync(dispatchPath);
      console.log('[Analytics Dispatch] Cleared dispatch file');
    }
  },

  // Raw YAML
  _raw: biz,
};
