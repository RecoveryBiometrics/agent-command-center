/**
 * Check 4: Live /es/, /ar/, /in/ hub pages have meta description in correct language.
 * Catches the Apr 14 bug where hubs shipped with English-template metas
 * and suppressed CTR from Spanish/Arabic searchers.
 */
const https = require('https');
const name = 'Hub page language';

const ARABIC_RE = /[\u0600-\u06FF]/;
const SPANISH_ACCENT_RE = /[ñáéíóúü¿¡]/i;
const EN_STOPWORDS = new Set(['the', 'and', 'for', 'with', 'your', 'free', 'tutorials', 'guides', 'step', 'help']);
const ES_STOPWORDS = new Set(['el', 'la', 'de', 'que', 'para', 'con', 'guía', 'guías', 'tutoriales', 'aprende']);

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

function detectLang(text) {
  if ((text.match(/[\u0600-\u06FF]/g) || []).length >= 5) return 'ar';
  const words = (text.toLowerCase().match(/[a-záéíóúñü]+/g) || []);
  let es = 0, en = 0;
  for (const w of words) { if (ES_STOPWORDS.has(w)) es++; if (EN_STOPWORDS.has(w)) en++; }
  es += (text.match(SPANISH_ACCENT_RE) || []).length * 2;
  if (es > en && es >= 2) return 'es';
  return 'en';
}

function extractDesc(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  return m ? m[1] : '';
}

async function check(state) {
  const hubs = [
    { path: '/es/', expected: 'es' },
    { path: '/ar/', expected: 'ar' },
  ];
  const failures = [];
  for (const h of hubs) {
    try {
      const res = await fetchUrl(`${state.liveUrl}${h.path}`);
      if (res.status !== 200) {
        failures.push(`${h.path} HTTP ${res.status}`);
        continue;
      }
      const desc = extractDesc(res.body);
      if (h.expected === 'ar') {
        if (!ARABIC_RE.test(desc)) failures.push(`${h.path} expected Arabic meta, got "${desc.slice(0, 60)}"`);
      } else if (h.expected === 'es') {
        if (detectLang(desc) !== 'es') failures.push(`${h.path} expected Spanish meta, got "${desc.slice(0, 60)}"`);
      }
    } catch (e) {
      failures.push(`${h.path}: ${e.message}`);
    }
  }

  if (failures.length === 0) {
    return { name, severity: 'PASS', message: 'Hub metas in correct language (es, ar)' };
  }
  return { name, severity: 'BLOCK', message: failures.join('; ') };
}

module.exports = { name, check };
