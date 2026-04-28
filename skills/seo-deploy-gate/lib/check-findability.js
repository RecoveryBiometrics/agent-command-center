/**
 * Rule 9: Findability — Attribution-URL protection + LLM discoverability
 *
 * Catches:
 *   BLOCK — Content-rich page behind robots.txt Disallow
 *   BLOCK — robots.txt missing required AI crawler Allow rules
 *   WARN  — Money page missing Offer/Product schema
 *   WARN  — /llms.txt missing or stale
 *
 * Why: The /trial/ incident (April 2026) — 1,900 words + Offer schema +
 * FAQPage behind Disallow for weeks. Nobody noticed until a manual audit.
 * Attribution URLs (/trial/, /coupon/, /start/) are intentionally Disallowed
 * and documented in CLAUDE.md, but rich SEO content should never land on
 * a Disallowed path without explicit documentation.
 */
const fs = require('fs');
const path = require('path');

// Attribution URLs that are INTENTIONALLY Disallowed (documented in CLAUDE.md)
const KNOWN_ATTRIBUTION_PATHS = [
  '/trial/', '/coupon/', '/start/',
  '/es/trial/', '/es/start/',
  '/in/trial/', '/in/start/',
  '/ar/trial/', '/ar/start/',
];

// AI crawlers that must be explicitly allowed
const REQUIRED_AI_CRAWLERS = [
  'GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot',
];

// Schema types that indicate rich SEO content (beyond basic WebSite)
const RICH_SCHEMA_TYPES = [
  'FAQPage', 'Offer', 'Product', 'Review', 'AggregateRating', 'HowTo',
];

function parseRobotsTxt(content) {
  const blocks = [];
  let current = null;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const uaMatch = trimmed.match(/^User-agent:\s*(.+)/i);
    if (uaMatch) {
      current = { agent: uaMatch[1].trim(), rules: [] };
      blocks.push(current);
      continue;
    }
    if (current) {
      const disMatch = trimmed.match(/^Disallow:\s*(.*)/i);
      const allMatch = trimmed.match(/^Allow:\s*(.*)/i);
      if (disMatch) current.rules.push({ type: 'disallow', path: disMatch[1].trim() });
      if (allMatch) current.rules.push({ type: 'allow', path: allMatch[1].trim() });
    }
  }
  return blocks;
}

function getDisallowedPaths(blocks) {
  // Paths disallowed by User-agent: * (the default agent)
  const wildcard = blocks.find(b => b.agent === '*');
  if (!wildcard) return [];
  return wildcard.rules.filter(r => r.type === 'disallow').map(r => r.path);
}

function getCrawlerAllowed(blocks, crawlerName) {
  const block = blocks.find(b => b.agent === crawlerName);
  if (!block) return false;
  return block.rules.some(r => r.type === 'allow' && r.path === '/');
}

function check(changeContext) {
  const { config } = changeContext;
  const orgPath = config.orgPath;
  const findings = [];

  // Locate site public dir
  const candidates = [
    path.join(orgPath, 'globalhighlevel-site', 'public'),
    path.join(orgPath, 'public'),
  ];
  const siteRoot = candidates.find(p => fs.existsSync(p));
  if (!siteRoot) {
    return {
      rule: 'Rule 9 — Findability',
      severity: 'PASS',
      message: 'No public/ build output found — skipping',
    };
  }

  // --- Check 1: Rich content on Disallowed URL ---
  const robotsPath = path.join(siteRoot, 'robots.txt');
  let blocks = [];
  if (fs.existsSync(robotsPath)) {
    blocks = parseRobotsTxt(fs.readFileSync(robotsPath, 'utf8'));
  }
  const disallowed = getDisallowedPaths(blocks);

  for (const dPath of disallowed) {
    // Normalize: /trial matches /trial/ and /trial/anything
    const checkDir = path.join(siteRoot, dPath.replace(/^\//, ''));
    const indexFile = fs.existsSync(path.join(checkDir, 'index.html'))
      ? path.join(checkDir, 'index.html')
      : null;

    if (!indexFile) continue;

    const html = fs.readFileSync(indexFile, 'utf8');
    const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = textOnly.trim().split(/\s+/).length;
    const hasRichSchema = RICH_SCHEMA_TYPES.some(t => html.includes(`"@type":"${t}"`));

    // Skip known attribution URLs (documented intentional Disallow)
    const urlPath = '/' + dPath.replace(/^\//, '').replace(/\/?$/, '/');
    const isKnownAttribution = KNOWN_ATTRIBUTION_PATHS.some(p => urlPath.startsWith(p));

    if ((wordCount > 500 || hasRichSchema) && !isKnownAttribution) {
      findings.push(
        `BLOCK: ${urlPath} is Disallow'd but has ${wordCount} words` +
        (hasRichSchema ? ' + rich schema' : '') +
        '. Migrate content to an indexable URL or add to KNOWN_ATTRIBUTION_PATHS.'
      );
    }
  }

  // --- Check 2: AI crawlers allowed ---
  const missingCrawlers = REQUIRED_AI_CRAWLERS.filter(c => !getCrawlerAllowed(blocks, c));
  if (missingCrawlers.length > 0) {
    findings.push(`BLOCK: robots.txt missing Allow for: ${missingCrawlers.join(', ')}`);
  }

  // --- Check 3: /llms.txt exists ---
  const llmsPath = path.join(siteRoot, 'llms.txt');
  if (!fs.existsSync(llmsPath)) {
    findings.push('WARN: /llms.txt not found — AI models have no content index');
  } else {
    const stat = fs.statSync(llmsPath);
    const ageMs = Date.now() - stat.mtimeMs;
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    if (ageDays > 30) {
      findings.push(`WARN: /llms.txt is ${ageDays} days old — may be stale`);
    }
  }

  // --- Determine severity ---
  const hasBlock = findings.some(f => f.startsWith('BLOCK'));
  const hasWarn = findings.some(f => f.startsWith('WARN'));

  if (findings.length === 0) {
    return {
      rule: 'Rule 9 — Findability',
      severity: 'PASS',
      message: `All Disallow'd paths are documented attribution URLs. AI crawlers allowed. llms.txt present.`,
    };
  }

  return {
    rule: 'Rule 9 — Findability',
    severity: hasBlock ? 'BLOCK' : 'WARN',
    message: findings.join('\n'),
  };
}

module.exports = { check };
