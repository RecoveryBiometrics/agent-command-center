/**
 * Detect the change set: files, added/removed URLs, change type classification.
 * Reads git diff against origin/main.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function detectChanges(orgPath) {
  const cwd = orgPath;

  // Get changed files
  let changedFiles = [];
  try {
    // Diff between HEAD and origin/main (what's about to deploy or just did)
    const output = execSync('git diff --name-only HEAD origin/main 2>/dev/null', {
      cwd, encoding: 'utf8'
    });
    changedFiles = output.trim().split('\n').filter(Boolean);

    // If no diff vs origin/main (already pushed), fall back to last commit
    if (changedFiles.length === 0) {
      const last = execSync('git show --name-only --pretty=format: HEAD', {
        cwd, encoding: 'utf8'
      });
      changedFiles = last.trim().split('\n').filter(Boolean);
    }
  } catch (e) {
    // Not a git repo, or no origin/main — return empty
    return { changedFiles: [], changeType: ['unknown'], affectedUrls: [], commitSha: null, branch: 'unknown' };
  }

  // Get commit SHA and branch
  const commitSha = safeExec('git rev-parse HEAD', cwd).trim().slice(0, 8);
  const branch = safeExec('git branch --show-current', cwd).trim() || 'detached';

  // Classify change type
  const changeType = classifyChanges(changedFiles, cwd);

  // Extract affected URLs
  const affectedUrls = extractAffectedUrls(changedFiles, cwd);

  // Count new redirect rules in next.config.ts
  const newRedirectCount = countNewRedirects(changedFiles, cwd);

  return {
    changedFiles,
    changeType,
    affectedUrls,
    commitSha,
    branch,
    fileCount: changedFiles.length,
    newRedirectCount,
  };
}

function classifyChanges(files, cwd) {
  const types = new Set();

  for (const file of files) {
    // Quality fix candidates: JSX content, FAQ, markdown, localized text
    const isContentFile =
      /\.(md|mdx)$/.test(file) ||
      file.includes('/data/') ||
      file.includes('/content/') ||
      file.includes('local-news');

    // Structural files
    const isStructural =
      file === 'next.config.ts' ||
      file === 'next.config.js' ||
      file === 'src/app/sitemap.ts' ||
      file === 'src/lib/constants.ts' ||
      file.match(/src\/app\/.+\/(page|layout|route)\.(tsx|ts|jsx|js)$/);

    // Market entry/removal — specifically constants.ts changes
    if (file === 'src/lib/constants.ts') {
      const diff = safeExec(`git diff origin/main...HEAD -- ${file}`, cwd);
      if (diff.includes('+') && diff.match(/\+\s*county:/)) types.add('market-entry');
      if (diff.includes('-') && diff.match(/-\s*county:/)) types.add('market-removal');
    }

    if (file === 'next.config.ts') {
      const diff = safeExec(`git diff origin/main...HEAD -- ${file}`, cwd);
      // If adding redirects, likely market-removal
      if (diff.match(/\+\s*source:\s*['"`]\//)) types.add('market-removal');
    }

    if (isStructural) {
      types.add('structural');
    } else if (isContentFile) {
      types.add('content');
    } else {
      // JSX files with content changes only (no route changes) = quality-fix
      types.add('quality-fix');
    }
  }

  return Array.from(types);
}

function extractAffectedUrls(files, cwd) {
  const urls = new Set();

  for (const file of files) {
    // Route pages: src/app/{route}/page.tsx → /{route}
    const routeMatch = file.match(/^src\/app\/(.+?)\/page\.(tsx|ts|jsx|js)$/);
    if (routeMatch) {
      const route = '/' + routeMatch[1].replace(/\[[^\]]+\]/g, ':param');
      urls.add(route);
    }

    // If constants.ts changed, it affects all dynamic routes
    if (file === 'src/lib/constants.ts') {
      urls.add('/:location');
      urls.add('/:location/:service');
      urls.add('/:county');
    }

    // If next.config.ts changed, parse redirect sources
    if (file === 'next.config.ts') {
      const diff = safeExec(`git diff origin/main...HEAD -- ${file}`, cwd);
      const sourceMatches = diff.matchAll(/\+\s*source:\s*['"`]([^'"`]+)['"`]/g);
      for (const m of sourceMatches) {
        urls.add(m[1]);
      }
    }
  }

  return Array.from(urls);
}

function countNewRedirects(files, cwd) {
  if (!files.includes('next.config.ts') && !files.includes('next.config.js')) return 0;

  const configFile = files.includes('next.config.ts') ? 'next.config.ts' : 'next.config.js';
  const diff = safeExec(`git diff origin/main...HEAD -- ${configFile}`, cwd);

  // Count added lines that look like redirect source declarations
  const matches = diff.match(/^\+\s*source:\s*['"`]/gm);
  return matches ? matches.length : 0;
}

function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

module.exports = { detectChanges };
