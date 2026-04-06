/**
 * Shared Content Pipeline — Daily Orchestrator
 *
 * Usage: node index.js --business safebath
 *
 * 6-agent pipeline:
 *   1. Researcher — gathers local info from Reddit + web
 *   2. Fact Checker #1 — validates research
 *   3. Copywriter — writes unique articles
 *   4. Fact Checker #2 — validates copy for accuracy + uniqueness
 *   5. SEO Audit — checks titles, meta, slugs, schema readiness
 *   6. Engineer — writes to the business's data directory
 *
 * Self-healing: failed checks loop back with fixes, max 3 retries.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const config = require('./config');
const { parseCities, slugifyCity } = require('./cities');
const { research } = require('./researcher');
const { checkResearch, checkCopy } = require('./fact-checker');
const { writeArticles } = require('./copywriter');
const { audit, applyFixes } = require('./seo-audit');
const { deploy } = require('./engineer');
const { sendPipelineEmail } = require('./email');

function loadState() {
  // Ensure state directory exists
  const stateDir = path.dirname(config.STATE_FILE);
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });

  if (fs.existsSync(config.STATE_FILE)) {
    return JSON.parse(fs.readFileSync(config.STATE_FILE, 'utf8'));
  }
  return { lastOffset: 0, processedCities: [], lastRun: null };
}

function saveState(state) {
  const dir = path.dirname(config.STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.STATE_FILE, JSON.stringify(state, null, 2));
}

async function processCity(city) {
  const locationSlug = slugifyCity(city);

  for (let attempt = 1; attempt <= config.MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const researchData = await research(city);

      const researchCheck = checkResearch(researchData);
      if (!researchCheck.valid) {
        console.log(`  ${city.name}: research check failed — ${researchCheck.issues.join(', ')}`);
        if (attempt === config.MAX_RETRY_ATTEMPTS) return null;
        continue;
      }

      researchData.events = researchCheck.filteredEvents || researchData.events;

      if (!researchData.events || researchData.events.length === 0) {
        console.log(`  ${city.name}: no upcoming events — needs fresh event data`);
        return { city: city.name, slug: city.slug, deployed: 0, reason: 'no upcoming events' };
      }

      let existing = [];
      const existingPath = path.join(config.NEWS_DATA_DIR, `${city.slug}.json`);
      if (fs.existsSync(existingPath)) {
        try { existing = JSON.parse(fs.readFileSync(existingPath, 'utf8')); } catch {}
      }
      let articles = writeArticles(researchData, existing);
      if (articles.length === 0) {
        return { city: city.name, slug: city.slug, deployed: 0, reason: 'no new events to write' };
      }

      const copyCheck = checkCopy(articles, city);
      if (!copyCheck.valid) {
        console.log(`  ${city.name}: copy check failed (attempt ${attempt}) — ${copyCheck.issues.join(', ')}`);
        if (attempt === config.MAX_RETRY_ATTEMPTS) return null;
        continue;
      }

      const seoResult = audit(articles, city);
      if (!seoResult.pass) {
        console.log(`  ${city.name}: SEO audit failed (attempt ${attempt}) — ${seoResult.issues.filter(i => i.startsWith('BLOCK:')).join(', ')}`);

        if (seoResult.fixes.length > 0) {
          articles = applyFixes(articles, seoResult.fixes);
          console.log(`  ${city.name}: applied ${seoResult.fixes.length} auto-fixes, retrying audit...`);

          const retryAudit = audit(articles, city);
          if (!retryAudit.pass) {
            if (attempt === config.MAX_RETRY_ATTEMPTS) return null;
            continue;
          }
        } else {
          if (attempt === config.MAX_RETRY_ATTEMPTS) return null;
          continue;
        }
      }

      const deployResult = deploy(city, articles);

      return {
        city: city.name,
        state: city.state,
        slug: city.slug,
        locationSlug,
        deployed: deployResult.deployed,
        total: deployResult.total,
        articles: articles.map(a => ({ title: a.title, slug: a.slug })),
        url: `${config.BRAND.url}/${locationSlug}/local-news`,
        attempt,
      };

    } catch (err) {
      console.error(`  ${city.name}: error on attempt ${attempt} — ${err.message}`);
      if (attempt === config.MAX_RETRY_ATTEMPTS) return null;
    }
  }

  return null;
}

async function run() {
  console.log(`${config.BUSINESS_NAME} Content Pipeline starting...\n`);

  const allCities = parseCities();
  const state = loadState();

  let offset = state.lastOffset;
  if (offset >= allCities.length) offset = 0;

  const batch = allCities.slice(offset, offset + config.CITIES_PER_RUN);
  const nextOffset = offset + batch.length;

  console.log(`Processing cities ${offset + 1}–${offset + batch.length} of ${allCities.length}\n`);

  const results = [];
  const failures = [];

  for (const city of batch) {
    console.log(`\n--- ${city.name}, ${city.state} (${city.county}) ---`);
    const result = await processCity(city);
    if (result) {
      results.push(result);
    } else {
      failures.push(city.name);
      console.log(`  ${city.name}: FAILED after ${config.MAX_RETRY_ATTEMPTS} attempts`);
    }
  }

  saveState({
    lastOffset: nextOffset >= allCities.length ? 0 : nextOffset,
    processedCities: [...state.processedCities, ...results.map(r => r.slug)],
    lastRun: new Date().toISOString(),
  });

  const totalDeployed = results.reduce((sum, r) => sum + r.deployed, 0);
  console.log('\n========================================');
  console.log(`${config.BUSINESS_NAME} Content Pipeline Complete`);
  console.log('========================================');
  console.log(`Cities processed: ${batch.length}`);
  console.log(`Articles deployed: ${totalDeployed}`);
  console.log(`Failures: ${failures.length}${failures.length > 0 ? ` (${failures.join(', ')})` : ''}`);
  console.log(`Next batch starts at city #${nextOffset >= allCities.length ? 1 : nextOffset + 1}`);

  if (results.length > 0) {
    console.log('\nDeployed:');
    for (const r of results) {
      if (r.deployed > 0) {
        console.log(`  ${r.city}, ${r.state}: ${r.deployed} articles → ${r.url}`);
        for (const a of r.articles || []) {
          console.log(`    - ${a.title}`);
        }
      }
    }
  }

  try {
    await sendPipelineEmail(results, failures);
  } catch (err) {
    console.warn('Email failed:', err.message);
  }

  return { results, failures };
}

run().catch(err => {
  console.error('Pipeline failed:', err.message);
  process.exit(1);
});
