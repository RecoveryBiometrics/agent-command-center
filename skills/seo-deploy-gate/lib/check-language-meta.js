/**
 * Rule 8: Language-meta alignment
 * BLOCK if any deployed HTML page under /es/, /ar/, /in/ has a meta description
 * written in the wrong language. Catches regressions where a generator or
 * AI rewrite produces English copy on a Spanish/Arabic page.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARABIC_RE = /[\u0600-\u06FF]/;
const SPANISH_ACCENT_RE = /[ñáéíóúü¿¡]/i;
const EN_STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'your', 'free', 'step', 'how', 'to', 'learn',
  'tutorials', 'guides', 'agencies', 'businesses', 'help',
]);
const ES_STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'que', 'para', 'con', 'por',
  'guía', 'guías', 'tutoriales', 'aprende', 'configurar', 'gratis', 'paso',
]);

function expectedLang(urlOrPath) {
  const p = urlOrPath.replace(/^https?:\/\/[^/]+/, '');
  if (p.startsWith('/es/') || p === '/es') return 'es';
  if (p.startsWith('/ar/') || p === '/ar') return 'ar';
  return 'en';
}

function detectLang(text) {
  if (!text || !text.trim()) return 'en';
  if ((text.match(/[\u0600-\u06FF]/g) || []).length >= 5) return 'ar';
  const words = (text.toLowerCase().match(/[a-záéíóúñü]+/g) || []);
  if (words.length === 0) return 'en';
  let es = 0, en = 0;
  for (const w of words) {
    if (ES_STOPWORDS.has(w)) es++;
    if (EN_STOPWORDS.has(w)) en++;
  }
  es += (text.match(SPANISH_ACCENT_RE) || []).length * 2;
  if (es > en && es >= 2) return 'es';
  return 'en';
}

function extractMeta(html) {
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [, ''])[1];
  const desc = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [, ''])[1];
  return { title: title.trim(), description: desc.trim() };
}

function validateFile(filePath, siteRoot) {
  const rel = path.relative(siteRoot, filePath).replace(/\\/g, '/');
  const urlPath = '/' + rel.replace(/\/?index\.html$/, '/').replace(/^\/+/, '');
  const expected = expectedLang(urlPath);
  if (expected === 'en') return null;

  const html = fs.readFileSync(filePath, 'utf8');
  const { title, description } = extractMeta(html);

  if (expected === 'ar') {
    if (ARABIC_RE.test(description) && ARABIC_RE.test(title)) return null;
    return `${urlPath} — expected Arabic meta, got title="${title.slice(0, 60)}" description="${description.slice(0, 80)}"`;
  }
  if (expected === 'es') {
    if (detectLang(description) === 'es') return null;
    return `${urlPath} — expected Spanish meta, got description="${description.slice(0, 80)}"`;
  }
  return null;
}

function check(changeContext) {
  const { config, affectedFiles = [] } = changeContext;
  const orgPath = config.orgPath;

  // Find the public/ output directory. GHL ships from globalhighlevel-site/public/.
  const candidates = [
    path.join(orgPath, 'globalhighlevel-site', 'public'),
    path.join(orgPath, 'public'),
  ];
  const siteRoot = candidates.find(p => fs.existsSync(p));
  if (!siteRoot) {
    return {
      rule: 'Rule 8 — Language-meta alignment',
      severity: 'PASS',
      message: 'No public/ build output found — skipping',
    };
  }

  // Scan all language-hub and category/blog pages under /es/, /ar/.
  const targets = [];
  for (const prefix of ['es', 'ar']) {
    const dir = path.join(siteRoot, prefix);
    if (!fs.existsSync(dir)) continue;
    try {
      const out = execSync(`find "${dir}" -name "index.html" -type f`, { encoding: 'utf8' });
      out.split('\n').filter(Boolean).forEach(f => targets.push(f));
    } catch {}
  }

  const violations = [];
  for (const f of targets) {
    try {
      const v = validateFile(f, siteRoot);
      if (v) violations.push(v);
    } catch (e) {
      violations.push(`${f}: read error ${e.message}`);
    }
  }

  if (violations.length === 0) {
    return {
      rule: 'Rule 8 — Language-meta alignment',
      severity: 'PASS',
      message: `Scanned ${targets.length} /es/ + /ar/ pages, all metas in correct language`,
    };
  }

  const sample = violations.slice(0, 5).map(v => `  • ${v}`).join('\n');
  const more = violations.length > 5 ? `\n  … and ${violations.length - 5} more` : '';
  return {
    rule: 'Rule 8 — Language-meta alignment',
    severity: 'BLOCK',
    message: `${violations.length} page(s) have meta written in the wrong language:\n${sample}${more}`,
  };
}

module.exports = { check };
