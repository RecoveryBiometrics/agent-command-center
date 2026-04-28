/**
 * Load business config from agent-command-center/businesses/{id}.yaml
 * Reusable across all skills that are multi-business aware.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function loadBusiness(businessId) {
  if (!businessId) throw new Error('businessId required');

  const configPath = path.join(
    os.homedir(),
    'Projects/agent-command-center/businesses',
    `${businessId}.yaml`
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(`Business config not found: ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const config = parseYaml(raw);

  // Validate required fields for the gate
  const required = ['tracking_sheet_id', 'slack', 'org'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Business ${businessId} missing required field: ${field}`);
    }
  }

  if (!config.slack.business_channel) {
    throw new Error(`Business ${businessId} missing slack.business_channel`);
  }
  if (!config.org.path) {
    throw new Error(`Business ${businessId} missing org.path`);
  }

  // Expand ~ in org.path
  config.org.path = config.org.path.replace(/^~/, os.homedir());

  // Expand ~ in seo_gate.credentials_path if present
  if (config.seo_gate && config.seo_gate.credentials_path) {
    config.seo_gate.credentials_path = config.seo_gate.credentials_path.replace(/^~/, os.homedir());
  }

  return config;
}

/**
 * Minimal YAML parser for the subset we use.
 * Handles: top-level keys, nested objects (2-space indent), string/number values,
 * quoted strings, simple lists. No anchors, no multiline strings.
 * For anything more complex, install js-yaml.
 */
function parseYaml(text) {
  // Strip comments and empty lines
  const lines = text.split('\n').map(l => l.replace(/\s+#.*$/, '')).filter(l => l.trim());

  // Try js-yaml if installed, fallback to minimal parser
  try {
    const yaml = require('js-yaml');
    return yaml.load(text);
  } catch {
    // Minimal fallback: only handles flat and 1-level nested objects
    const result = {};
    const stack = [{ indent: -1, obj: result }];

    for (const line of lines) {
      const indent = line.match(/^\s*/)[0].length;
      const trimmed = line.trim();
      if (!trimmed.includes(':')) continue;

      const [key, ...valParts] = trimmed.split(':');
      const val = valParts.join(':').trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (val === '') {
        // Nested object
        parent[key.trim()] = {};
        stack.push({ indent, obj: parent[key.trim()] });
      } else {
        // Value — strip quotes, parse numbers
        let parsed = val.replace(/^["']|["']$/g, '');
        if (/^-?\d+$/.test(parsed)) parsed = parseInt(parsed, 10);
        else if (/^-?\d+\.\d+$/.test(parsed)) parsed = parseFloat(parsed);
        parent[key.trim()] = parsed;
      }
    }

    return result;
  }
}

module.exports = { loadBusiness };
