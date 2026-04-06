/**
 * Shared SEO Reporting Config
 *
 * Reads business config from agent-command-center/businesses/{id}.yaml
 * Usage: node index.js --business safebath
 *
 * Falls back to env vars for backward compatibility.
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

// In CI, store data inside the business project; locally use shared state
const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

const config = {
  // Business identity
  businessName: biz.name,
  businessId: biz.id,

  // Google Search Console
  gscSiteUrl: process.env.GSC_SITE_URL || biz.seo?.gsc_site_url || '',

  // Google Analytics 4
  ga4PropertyId: process.env.GA4_PROPERTY_ID || biz.seo?.ga4_property_id || '',

  // Site
  siteBase: biz.website || '',

  // Sitemap
  sitemapUrl: biz.seo?.sitemap_url || process.env.SITEMAP_URL || '',
  sitemapPath: process.env.SITEMAP_PATH || path.join(projectPath, 'website/.next/server/app/sitemap.xml.body'),

  // Data directories
  dataDir: isCI
    ? path.resolve(projectPath, biz.seo?.data_dir || 'seo/seo-data')
    : path.join(__dirname, `state/${businessId}/seo-data`),
  reportsDir: isCI
    ? path.resolve(projectPath, biz.seo?.reports_dir || 'seo/seo-reports')
    : path.join(__dirname, `state/${businessId}/seo-reports`),

  // Changelog
  changelogPath: path.resolve(projectPath, biz.seo?.changelog_path || 'seo/SEO-CHANGELOG.md'),

  // Slack
  slackChannelId: biz.slack?.business_channel || process.env.SLACK_CHANNEL_ID || '',
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',

  // Email
  seoAgentEmail: biz.seo?.seo_agent_email || process.env.SEO_AGENT_EMAIL || '',

  // Raw YAML access
  _raw: biz,
};

module.exports = config;
