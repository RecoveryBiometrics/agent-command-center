/**
 * Stage 1: Classify TODOs
 *
 * Reads Active TODOs from Sheet, parses them into typed objects.
 * Formats match what seo-reporting/todos.js writes:
 *   "Optimize /slug — position X.X, Y impressions" → opportunity
 *   "No page for \"keyword\" — Z impressions, position X.X" → gap
 *   "/slug dropped X.X positions — no known cause" → investigate (skip)
 */
const { readPendingTodos } = require('../../lib/sheet');

// Regex patterns matching seo-reporting/todos.js output formats
const PATTERNS = {
  gap: /No page for "(.+?)"\s*—\s*(\d+)\s*impressions,\s*position\s*([\d.]+)/i,
  opportunity: /Optimize\s+(\S+)\s*—\s*position\s*([\d.]+),\s*(\d+)\s*impressions/i,
  investigate: /dropped\s+([\d.]+)\s*positions/i,
};

// Detect language from keyword text or area tag
const SPANISH_INDICATORS = /[áéíóúñ¿¡]|gohighlevel\s+(para|en|cómo|guía|precios|prueba)|agencia|automatización|whatsapp.*negocio/i;
const HINDI_INDICATORS = /india|rupee|₹|razorpay|upi|mumbai|bangalore|delhi|hyderabad|pune|chennai|indian/i;
const ARABIC_INDICATORS = /[\u0600-\u06FF]/;

function detectLanguage(keyword, area) {
  const text = `${keyword} ${area}`.toLowerCase();
  if (ARABIC_INDICATORS.test(keyword)) return 'ar';
  if (SPANISH_INDICATORS.test(keyword)) return 'es';
  if (HINDI_INDICATORS.test(text)) return 'en-IN';
  // Check area tag for language hints
  if (area.includes('Spanish') || area.includes('ES')) return 'es';
  if (area.includes('India') || area.includes('IN')) return 'en-IN';
  if (area.includes('Arabic') || area.includes('AR')) return 'ar';
  return 'en';
}

function parseTodo(todo) {
  const { task, area } = todo;

  // Try gap pattern
  const gapMatch = task.match(PATTERNS.gap);
  if (gapMatch || area.includes('Gap')) {
    const keyword = gapMatch ? gapMatch[1] : task;
    return {
      ...todo,
      type: 'gap',
      keyword,
      impressions: gapMatch ? parseInt(gapMatch[2]) : 0,
      position: gapMatch ? parseFloat(gapMatch[3]) : 0,
      language: detectLanguage(keyword, area),
    };
  }

  // Try opportunity pattern
  const oppMatch = task.match(PATTERNS.opportunity);
  if (oppMatch || area.includes('Opportunity')) {
    const slug = oppMatch ? oppMatch[1] : '';
    return {
      ...todo,
      type: 'opportunity',
      slug,
      position: oppMatch ? parseFloat(oppMatch[2]) : 0,
      impressions: oppMatch ? parseInt(oppMatch[3]) : 0,
      language: detectLanguage(slug, area),
    };
  }

  // Investigate — skip
  if (task.match(PATTERNS.investigate) || area.includes('Investigate')) {
    return { ...todo, type: 'investigate' };
  }

  // Unknown — skip
  return { ...todo, type: 'unknown' };
}

async function classify(config) {
  if (!config.TRACKING_SHEET_ID) {
    console.log('  No tracking_sheet_id — nothing to classify');
    return [];
  }

  const todos = await readPendingTodos(config.TRACKING_SHEET_ID);
  console.log(`  Read ${todos.length} pending TODOs from Sheet`);

  const classified = todos.map(parseTodo);

  // Filter out investigate + unknown
  const actionable = classified.filter(t => t.type === 'gap' || t.type === 'opportunity');

  // Filter gaps below min impressions
  const filtered = actionable.filter(t => {
    if (t.type === 'gap' && t.impressions < config.MIN_IMPRESSIONS) {
      console.log(`  Skipped: "${t.keyword}" — only ${t.impressions} impressions (min: ${config.MIN_IMPRESSIONS})`);
      return false;
    }
    return true;
  });

  // Cap at max
  const capped = filtered.slice(0, config.MAX_TODOS);

  const skipped = classified.filter(t => t.type === 'investigate' || t.type === 'unknown');
  if (skipped.length > 0) {
    console.log(`  Skipped ${skipped.length} non-actionable TODOs (investigate/unknown)`);
  }

  console.log(`  Classified: ${capped.filter(t => t.type === 'gap').length} gaps, ${capped.filter(t => t.type === 'opportunity').length} opportunities`);

  return capped;
}

module.exports = { classify, parseTodo };
