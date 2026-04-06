/**
 * Agent 5: SEO Audit
 * Validates that articles meet SEO requirements before deployment.
 * Checks: title length, excerpt/meta length, slug format, schema readiness, internal link targets.
 */
const { slugifyCity } = require('./cities');
const config = require('./config');

function audit(entries, city) {
  const issues = [];
  const fixes = [];

  const locationSlug = slugifyCity(city);

  for (const entry of entries) {
    // Title checks
    if (entry.title.length > 70) {
      issues.push(`Title too long (${entry.title.length} chars, max 70): "${entry.title}"`);
      fixes.push({
        entry: entry.id,
        field: 'title',
        action: 'truncate',
        suggestion: entry.title.slice(0, 67) + '...',
      });
    }
    if (entry.title.length < 20) {
      const expandedTitle = `${city.name}: ${entry.title}`;
      if (expandedTitle.length >= 20) {
        fixes.push({ entry: entry.id, field: 'title', action: 'expand', suggestion: expandedTitle });
        issues.push(`Auto-fix: Title expanded from "${entry.title}" to "${expandedTitle}"`);
      } else {
        issues.push(`BLOCK: Title too short even after expansion (${expandedTitle.length} chars): "${expandedTitle}"`);
      }
    }

    // Excerpt / meta description
    if (entry.excerpt.length > 160) {
      issues.push(`Excerpt too long for meta description (${entry.excerpt.length} chars, max 160)`);
      fixes.push({
        entry: entry.id,
        field: 'excerpt',
        action: 'truncate',
        suggestion: entry.excerpt.slice(0, 157) + '...',
      });
    }
    if (entry.excerpt.length < 50) {
      const firstSentence = entry.body.split(/[.!?]/)[0].trim();
      const expandedExcerpt = firstSentence.length >= 50
        ? firstSentence.slice(0, 157)
        : `${firstSentence}. Local event in ${city.name}, ${city.county}.`;
      if (expandedExcerpt.length >= 50) {
        fixes.push({ entry: entry.id, field: 'excerpt', action: 'expand', suggestion: expandedExcerpt });
        issues.push(`Auto-fix: Excerpt expanded from ${entry.excerpt.length} to ${expandedExcerpt.length} chars`);
      } else {
        issues.push(`BLOCK: Excerpt too short even after expansion (${expandedExcerpt.length} chars, min 50)`);
      }
    }

    // Slug format
    if (entry.slug !== entry.slug.toLowerCase()) {
      issues.push(`Slug contains uppercase: "${entry.slug}"`);
      fixes.push({ entry: entry.id, field: 'slug', action: 'lowercase', suggestion: entry.slug.toLowerCase() });
    }
    if (/[^a-z0-9-]/.test(entry.slug)) {
      issues.push(`BLOCK: Slug contains invalid characters: "${entry.slug}"`);
    }

    // Body checks
    if (entry.body.length < 300) {
      issues.push(`BLOCK: Body too thin for indexing (${entry.body.length} chars, min 300)`);
    }

    // Must mention city name (local relevance signal)
    const cityMentions = (entry.body.match(new RegExp(city.name, 'gi')) || []).length;
    if (cityMentions < 2) {
      issues.push(`Low local relevance: "${entry.title}" mentions ${city.name} only ${cityMentions} time(s) (min 2)`);
    }

    // Must mention county (broader local signal)
    if (!entry.body.includes(city.county)) {
      issues.push(`Missing county mention: "${entry.title}" should reference ${city.county}`);
    }

    // Internal link target validation
    const prefix = config.CITY_SLUG_PREFIX;
    if (!locationSlug.startsWith(`${prefix}-`)) {
      issues.push(`BLOCK: Invalid location slug: "${locationSlug}"`);
    }
  }

  const blockers = issues.filter(i => i.startsWith('BLOCK:'));

  return {
    pass: blockers.length === 0,
    issues,
    fixes,
    blockers: blockers.length,
    warnings: issues.length - blockers.length,
    auditedAt: new Date().toISOString(),
  };
}

function applyFixes(entries, fixes) {
  for (const fix of fixes) {
    const entry = entries.find(e => e.id === fix.entry);
    if (!entry) continue;

    if ((fix.action === 'truncate' || fix.action === 'expand') && fix.field === 'excerpt') {
      entry.excerpt = fix.suggestion;
    }
    if (fix.action === 'expand' && fix.field === 'title') {
      entry.title = fix.suggestion;
    }
    if (fix.action === 'lowercase' && fix.field === 'slug') {
      entry.slug = fix.suggestion;
    }
  }

  return entries;
}

module.exports = { audit, applyFixes };
