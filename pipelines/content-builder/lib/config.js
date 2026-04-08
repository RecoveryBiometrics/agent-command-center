/**
 * Shared Config Loader for Content Builder Pipeline
 *
 * Usage: node index.js --business safebath
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const args = process.argv.slice(2);
const businessFlag = args.indexOf('--business');
const businessId = businessFlag >= 0 ? args[businessFlag + 1] : process.env.BUSINESS_ID;

if (!businessId) {
  console.error('ERROR: No business specified. Use --business <id> or set BUSINESS_ID env var.');
  process.exit(1);
}

const yamlPath = path.join(__dirname, '../../../businesses', `${businessId}.yaml`);
if (!fs.existsSync(yamlPath)) {
  console.error(`ERROR: Business config not found: ${yamlPath}`);
  process.exit(1);
}

const biz = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

const rawPath = process.env.BUSINESS_PROJECT_PATH || biz.org.path;
const projectPath = rawPath.replace('~', process.env.HOME);
const websitePath = path.resolve(projectPath, 'website');

// CLI flags
const isDry = args.includes('--dry');
const maxFlag = args.indexOf('--max');
const maxOverride = maxFlag >= 0 ? parseInt(args[maxFlag + 1]) : null;

module.exports = {
  BUSINESS_ID: biz.id,
  BUSINESS_NAME: biz.name,

  // Paths
  WEBSITE_PATH: websitePath,
  CONSTANTS_PATH: path.resolve(websitePath, 'src/lib/constants.ts'),
  LOCAL_NEWS_DIR: path.resolve(websitePath, 'src/data/local-news'),

  // Content builder config
  MAX_TODOS: maxOverride || biz.content_builder?.max_todos_per_run || 5,
  MODEL: biz.content_builder?.model || 'claude-haiku-4-5-20251001',
  MIN_IMPRESSIONS: biz.content_builder?.min_impressions_for_gap || 50,
  AUTO_DEPLOY_ARTICLES: biz.content_builder?.auto_deploy_articles !== false,
  AUTO_DEPLOY_PAGES: biz.content_builder?.auto_deploy_pages || false,

  // Content rules
  MAX_SIMILARITY: biz.content?.max_similarity_percent || 85,
  MAX_RETRY: biz.content?.max_retry_attempts || 3,
  CATEGORIES: biz.content?.categories || ['local-news'],
  CITY_SLUG_PREFIX: biz.content?.city_slug_prefix || biz.id,

  // Brand
  BRAND: {
    name: biz.name,
    phone: biz.brand?.phone_display || '',
    url: biz.website,
    pricing: biz.brand?.pricing_text || '',
    cta: biz.brand?.cta || '',
    voice: biz.brand?.voice || '',
  },

  // Google Sheet
  TRACKING_SHEET_ID: biz.tracking_sheet_id || '',

  // Slack
  SLACK_OPS_CHANNEL: biz.slack?.ops_log_channel || '',
  SLACK_BUSINESS_CHANNEL: biz.slack?.business_channel || '',

  // Flags
  DRY_RUN: isDry,

  // Raw YAML
  _raw: biz,
};
