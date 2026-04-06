/**
 * Agents 2 & 4: Fact Checker
 * Pass 1: Validates research — filters out past events.
 * Pass 2: Validates written copy for accuracy and uniqueness.
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

function extractEventDate(event) {
  const text = `${event.title} ${event.summary || ''} ${event.description || ''}`;
  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const pattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\b/gi;

  let match;
  let latestDate = null;

  while ((match = pattern.exec(text)) !== null) {
    const monthIdx = monthNames.indexOf(match[1].toLowerCase());
    const day = parseInt(match[2]);
    const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();

    if (monthIdx >= 0 && day >= 1 && day <= 31) {
      const d = new Date(year, monthIdx, day);
      if (!latestDate || d > latestDate) {
        latestDate = d;
      }
    }
  }

  return latestDate;
}

function isEventPast(event) {
  const eventDate = extractEventDate(event);
  if (!eventDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function checkResearch(research) {
  const issues = [];
  const verified = [];

  if (!research.events || research.events.length === 0) {
    issues.push('No events found for this city');
    return { valid: true, issues, verified, filteredEvents: [], checkedAt: new Date().toISOString() };
  }

  const futureEvents = [];
  const pastEvents = [];

  for (const event of research.events) {
    if (isEventPast(event)) {
      pastEvents.push(event);
      issues.push(`FILTERED: "${event.title}" — event date has passed`);
    } else {
      futureEvents.push(event);
      verified.push(`"${event.title}" — date is upcoming or today`);
    }
  }

  if (pastEvents.length > 0) {
    console.log(`  Filtered ${pastEvents.length} past event(s), ${futureEvents.length} remaining`);
  }

  if (futureEvents.length === 0) {
    issues.push('All events have passed — city needs fresh events');
  }

  return {
    valid: true,
    issues,
    verified,
    filteredEvents: futureEvents,
    checkedAt: new Date().toISOString(),
  };
}

function checkCopy(entries, city) {
  const issues = [];
  const verified = [];

  for (const entry of entries) {
    if (!entry.body.includes(city.name)) {
      issues.push(`BLOCK: Article "${entry.title}" does not mention ${city.name}`);
    }

    const placeholders = ['[CITY]', '[STATE]', '[COUNTY]', 'Lorem ipsum', 'TODO'];
    for (const ph of placeholders) {
      if (entry.body.includes(ph) || entry.title.includes(ph)) {
        issues.push(`BLOCK: Found placeholder "${ph}" in "${entry.title}"`);
      }
    }

    if (entry.body.length < 200) {
      issues.push(`BLOCK: Article "${entry.title}" body is too short (${entry.body.length} chars, min 200)`);
    }

    if (!entry.excerpt || entry.excerpt.length < 20) {
      issues.push(`BLOCK: Article "${entry.title}" has missing or short excerpt`);
    }

    verified.push(`"${entry.title}" — ${entry.body.length} chars, mentions ${city.name}`);
  }

  const siblingFiles = getSiblingContent(city);
  for (const entry of entries) {
    for (const [siblingSlug, siblingEntries] of Object.entries(siblingFiles)) {
      for (const sibEntry of siblingEntries) {
        const similarity = calculateSimilarity(entry.body, sibEntry.body);
        if (similarity > config.MAX_SIMILARITY_PERCENT) {
          issues.push(
            `BLOCK: "${entry.title}" is ${similarity}% similar to "${sibEntry.title}" (${siblingSlug}). Must be more unique.`
          );
        }
      }
    }
  }

  return {
    valid: issues.filter(i => i.startsWith('BLOCK:')).length === 0,
    issues,
    verified,
    checkedAt: new Date().toISOString(),
  };
}

function getSiblingContent(city) {
  const siblings = {};
  if (!fs.existsSync(config.NEWS_DATA_DIR)) return siblings;

  const files = fs.readdirSync(config.NEWS_DATA_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const slug = file.replace('.json', '');
    if (slug === city.slug) continue;

    try {
      const data = JSON.parse(fs.readFileSync(path.join(config.NEWS_DATA_DIR, file), 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        siblings[slug] = data;
      }
    } catch {
      // Skip malformed files
    }
  }

  return siblings;
}

function calculateSimilarity(textA, textB) {
  const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return Math.round((overlap / union) * 100);
}

module.exports = { checkResearch, checkCopy };
