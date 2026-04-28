/**
 * Check 3: Live sitemap.xml reachable + post count matches local expectation.
 * Confirms Cloudflare actually rebuilt from latest origin.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const name = 'Live sitemap ↔ origin';

function fetchUrl(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function countLocalPosts(repo) {
  try {
    const postsDir = path.join(repo, 'globalhighlevel-site', 'posts');
    return fs.readdirSync(postsDir).filter(f => f.endsWith('.json')).length;
  } catch { return null; }
}

async function check(state) {
  try {
    const res = await fetchUrl(`${state.liveUrl}/sitemap.xml`);
    if (res.status !== 200) {
      return { name, severity: 'BLOCK', message: `Sitemap HTTP ${res.status} — Cloudflare build may be failing` };
    }
    const urlCount = (res.body.match(/<url>/g) || []).length;
    const localPostCount = countLocalPosts(state.localRepo);

    if (localPostCount == null) {
      return { name, severity: 'PASS', message: `Sitemap OK (${urlCount} URLs). Could not compare to local.` };
    }

    // Sitemap has posts + hubs/categories. Expect urlCount >= localPostCount.
    if (urlCount < localPostCount) {
      const gap = localPostCount - urlCount;
      return {
        name,
        severity: 'WARN',
        message: `Live sitemap has ${urlCount} URLs, local has ${localPostCount} posts — gap of ${gap}. Cloudflare may be serving a stale build.`,
      };
    }
    return { name, severity: 'PASS', message: `${urlCount} sitemap URLs ≥ ${localPostCount} local posts` };
  } catch (e) {
    return { name, severity: 'BLOCK', message: `Sitemap fetch failed: ${e.message}` };
  }
}

module.exports = { name, check };
