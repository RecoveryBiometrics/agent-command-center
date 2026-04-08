/**
 * Shared Config Loader for Interlinking Pipeline
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

module.exports = {
  BUSINESS_ID: biz.id,
  BUSINESS_NAME: biz.name,

  // Paths into the business's website project
  CONSTANTS_PATH: path.resolve(websitePath, 'src/lib/constants.ts'),
  LOCAL_NEWS_DIR: path.resolve(websitePath, 'src/data/local-news'),
  CITY_WIKI_DIR: path.resolve(websitePath, 'src/data/city-wiki'),
  LINK_GRAPH_PATH: path.resolve(websitePath, 'src/data/link-graph.json'),
  NEIGHBORS_PATH: path.resolve(websitePath, 'src/data/city-neighbors.json'),

  // Interlinking config from YAML
  MAX_OUTBOUND_LINKS: biz.interlinking?.max_outbound_links_per_page || 15,
  MAX_RELATED_LINKS: biz.interlinking?.max_related_links_per_article || 3,
  NEIGHBOR_COUNT: biz.interlinking?.neighbor_count || 6,

  // Slug prefix for building URLs
  CITY_SLUG_PREFIX: biz.content?.city_slug_prefix || biz.id,

  // Slack
  SLACK_OPS_CHANNEL: biz.slack?.ops_log_channel || '',

  // Tracking
  TRACKING_SHEET_ID: biz.tracking_sheet_id || '',

  // Raw YAML
  _raw: biz,
};
