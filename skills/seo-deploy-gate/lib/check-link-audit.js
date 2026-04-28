/**
 * Rule 2: Internal link audit
 * BLOCK if structural change removes URL patterns that are still linked from the codebase.
 */
const { execSync } = require('child_process');

function check(changeContext) {
  const { changeType, config, changedFiles } = changeContext;

  if (!changeType.includes('structural') && !changeType.includes('market-removal')) {
    return { rule: 'Rule 2 — Internal link audit', severity: 'PASS', message: 'Not a structural or market-removal change' };
  }

  const orgPath = config.orgPath;

  // Get removed URL patterns from next.config.ts redirects added
  const removedPatterns = extractRemovedPatterns(changedFiles, orgPath);

  if (removedPatterns.length === 0) {
    return { rule: 'Rule 2 — Internal link audit', severity: 'PASS', message: 'No URL patterns being removed' };
  }

  // For each removed pattern, grep the src/ directory for internal links
  const brokenLinks = [];
  for (const pattern of removedPatterns) {
    // Convert URL pattern to grep-friendly regex
    // e.g., "/bathroom-safety-las-vegas-nv" → "bathroom-safety-las-vegas-nv"
    const searchTerm = pattern.replace(/^\//, '').replace(/[^a-z0-9-]/gi, '');
    if (searchTerm.length < 5) continue; // Skip too-short patterns

    try {
      const cmd = `grep -rn "${searchTerm}" ${orgPath}/src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | grep -v "// " | head -20`;
      const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n').filter(Boolean);

      // Filter out references that are in the changed files themselves (those are being updated)
      const relevant = lines.filter(line => {
        const file = line.split(':')[0];
        const relFile = file.replace(orgPath + '/', '');
        return !changedFiles.includes(relFile);
      });

      if (relevant.length > 0) {
        brokenLinks.push({ pattern, count: relevant.length, samples: relevant.slice(0, 3) });
      }
    } catch {
      // grep returned non-zero (no matches) — that's good
    }
  }

  if (brokenLinks.length === 0) {
    return { rule: 'Rule 2 — Internal link audit', severity: 'PASS', message: 'No broken internal links detected' };
  }

  const totalBroken = brokenLinks.reduce((sum, b) => sum + b.count, 0);
  const message = `${totalBroken} internal links reference ${brokenLinks.length} removed URL pattern(s). Fix or update links before deploying.`;

  return {
    rule: 'Rule 2 — Internal link audit',
    severity: 'BLOCK',
    message,
    evidence: { brokenLinks },
  };
}

function extractRemovedPatterns(changedFiles, orgPath) {
  const patterns = [];

  // Parse next.config.ts diff for redirect source patterns
  if (changedFiles.includes('next.config.ts') || changedFiles.includes('next.config.js')) {
    const file = changedFiles.includes('next.config.ts') ? 'next.config.ts' : 'next.config.js';
    try {
      const diff = execSync(`git -C ${orgPath} diff origin/main...HEAD -- ${file}`, {
        encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore']
      });
      const matches = diff.matchAll(/\+\s*source:\s*['"`]([^'"`]+)['"`]/g);
      for (const m of matches) {
        patterns.push(m[1]);
      }
    } catch { /* skip */ }
  }

  return patterns;
}

module.exports = { check };
