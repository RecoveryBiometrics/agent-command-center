/**
 * Parse SafeBath constants.ts to extract structured location + service data.
 *
 * Extracts array literals from TS source and evaluates them via require().
 * The arrays are valid JS (template literals, single quotes) — no TS syntax inside.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function extractArraySource(src, varName) {
  const startPattern = new RegExp(`export const ${varName}\\s*=\\s*\\[`);
  const match = src.match(startPattern);
  if (!match) return null;

  const startIdx = src.indexOf('[', match.index);
  let depth = 0;
  let endIdx = startIdx;

  for (let i = startIdx; i < src.length; i++) {
    const ch = src[i];
    // Skip string literals to avoid miscounting brackets
    if (ch === '`') { i = src.indexOf('`', i + 1); if (i === -1) break; continue; }
    if (ch === "'") { let j = i + 1; while (j < src.length && src[j] !== "'") j++; i = j; continue; }
    if (ch === '"') { let j = i + 1; while (j < src.length && src[j] !== '"') j++; i = j; continue; }
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (depth === 0) { endIdx = i + 1; break; }
  }

  return src.slice(startIdx, endIdx);
}

function parseConstants(constantsPath) {
  const src = fs.readFileSync(constantsPath, 'utf8');

  // Extract and eval COUNTIES_AND_LOCATIONS
  const countiesStr = extractArraySource(src, 'COUNTIES_AND_LOCATIONS');
  if (!countiesStr) throw new Error('Could not find COUNTIES_AND_LOCATIONS in constants.ts');

  const tmpFile = path.join(os.tmpdir(), `parse-constants-${Date.now()}.js`);

  // Write counties to temp file and require it
  const countiesTmp = tmpFile + '-counties.js';
  fs.writeFileSync(countiesTmp, `module.exports = ${countiesStr}`);
  const counties = require(countiesTmp);
  fs.unlinkSync(countiesTmp);

  // Extract and eval SERVICES
  const servicesStr = extractArraySource(src, 'SERVICES');
  let services = [];
  if (servicesStr) {
    const servicesTmp = tmpFile + '-services.js';
    fs.writeFileSync(servicesTmp, `module.exports = ${servicesStr}`);
    services = require(servicesTmp);
    fs.unlinkSync(servicesTmp);
  }

  return { counties, services };
}

module.exports = { parseConstants };
