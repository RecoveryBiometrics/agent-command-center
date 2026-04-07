/**
 * Analytics Pipeline Config
 *
 * Reads business config from agent-command-center/businesses/{id}.yaml
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

// GA4 property ID — check analytics section first, fall back to seo section
const ga4PropertyId = biz.analytics?.ga4_property_id || biz.seo?.ga4_property_id || '';
if (!ga4PropertyId) {
  console.error(`ERROR: No ga4_property_id found for ${businessId}. Add it to analytics: or seo: in the YAML.`);
  process.exit(1);
}

// State directory for snapshots and dispatch files
const stateDir = path.join(__dirname, '../../state', businessId);
if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });

// Load prior snapshot if it exists
let priorSnapshot = null;
const latestPath = path.join(stateDir, 'analytics-latest.json');
if (fs.existsSync(latestPath)) {
  try {
    priorSnapshot = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  } catch (e) {
    console.warn('Could not read prior snapshot:', e.message);
  }
}

const config = {
  businessName: biz.name,
  businessId: biz.id,
  niche: biz.niche || '',

  // GA4
  ga4PropertyId,

  // Analytics-specific config
  conversionEvents: biz.analytics?.conversion_events || [],
  alertThresholds: {
    trafficDropPct: biz.analytics?.alert_thresholds?.traffic_drop_pct || 20,
    trafficSpikePct: biz.analytics?.alert_thresholds?.traffic_spike_pct || 50,
    bounceRateCeiling: biz.analytics?.alert_thresholds?.bounce_rate_ceiling || 75,
  },
  dispatchTargets: biz.analytics?.dispatch_targets || [],
  schedule: biz.analytics?.schedule || 'weekly',

  // Tracking sheet
  trackingSheetId: biz.tracking_sheet_id || '',

  // Slack
  slackChannelId: biz.slack?.business_channel || '',
  slackCeoChannel: biz.slack?.ceo_channel || '',
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',

  // Paths
  stateDir,
  latestPath,

  // Prior data for trend comparison
  priorSnapshot,

  // Service areas (for geo analysis)
  serviceAreaStates: biz.service_areas?.states || [],

  // Raw YAML
  _raw: biz,
};

module.exports = config;
