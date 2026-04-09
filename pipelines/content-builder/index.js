/**
 * Content Builder Pipeline — Orchestrator
 *
 * Reads Active TODOs from Sheet, builds content for SEO gaps/opportunities,
 * and deploys it.
 *
 * Usage:
 *   node index.js --business safebath              # full run
 *   node index.js --business safebath --dry        # classify + research, don't deploy
 *   node index.js --business safebath --max 2      # process max 2 TODOs
 */
require('dotenv').config();

const config = require('./lib/config');
const { classify } = require('./stages/01-classify/classify');
const { research } = require('./stages/02-research/research');
const { writeArticle } = require('./stages/03-write/write');
const { checkArticle } = require('./stages/04-check/check');
const { addLinks } = require('./stages/05-link/link');
const { deployArticle } = require('./stages/06-deploy/deploy');
const { optimizePage } = require('./stages/07-optimize/optimize');

// Lazy-load constants parser (shared with interlinking pipeline)
const { parseConstants } = require('../interlinking/lib/parse-constants');

async function run() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${config.BUSINESS_NAME} Content Builder`);
  console.log(`Mode: ${config.DRY_RUN ? 'DRY RUN' : 'LIVE'} | Max TODOs: ${config.MAX_TODOS}`);
  console.log(`${'='.repeat(50)}\n`);

  // Load constants for research + linking
  const constants = parseConstants(config.CONSTANTS_PATH);

  // Stage 1: Classify
  console.log('[1/6] Classifying TODOs...');
  const todos = await classify(config);

  if (todos.length === 0) {
    console.log('\nNo actionable TODOs found. Done.');
    return;
  }

  const results = [];
  const failures = [];

  for (const todo of todos) {
    console.log(`\n--- Processing: ${todo.type} — "${todo.keyword || todo.slug}" ---`);

    try {
      // Stage 2: Research (gaps only — opportunities skip to link stage)
      if (todo.type === 'gap') {
        console.log('[2/6] Researching keyword...');
        const researchResult = await research(todo, config, constants);

        if (researchResult.skip) {
          console.log(`  Skipped: ${researchResult.reason}`);
          failures.push({ todo, reason: researchResult.reason });
          continue;
        }

        // Stage 3: Write
        let article = null;
        let checkResult = null;

        for (let attempt = 1; attempt <= config.MAX_RETRY; attempt++) {
          console.log(`[3/6] Writing content (attempt ${attempt}/${config.MAX_RETRY})...`);
          article = await writeArticle(researchResult, config);
          article._keyword = todo.keyword; // Pass through for linking

          // Stage 4: Check (structural + fact-check)
          console.log('[4/6] Checking content...');
          checkResult = await checkArticle(article, config, researchResult);

          if (checkResult.pass) {
            break;
          } else {
            console.log(`  Check failed: ${checkResult.issues.join(', ')}`);
            if (attempt === config.MAX_RETRY) {
              console.log(`  Failed after ${config.MAX_RETRY} attempts`);
            }
          }
        }

        if (!checkResult.pass) {
          failures.push({ todo, reason: checkResult.issues.join('; ') });
          continue;
        }

        // Stage 5: Link
        console.log('[5/6] Adding internal links...');
        article = addLinks(article, config, constants);

        if (config.DRY_RUN) {
          console.log('[6/6] DRY RUN — skipping deploy');
          console.log(`  Would deploy: "${article.title}" (${article.body.length} chars)`);
          console.log(`  relatedLinks: ${article.relatedLinks.length}`);
          results.push({ todo, article, deployed: false });
          continue;
        }

        // Stage 6: Deploy
        console.log('[6/6] Deploying...');
        const deployResult = await deployArticle(article, todo, config, constants);
        results.push({ todo, article, ...deployResult });

      } else if (todo.type === 'opportunity') {
        // Optimize existing page: rewrite title/meta, regenerate links
        console.log('[7/7] Optimizing existing page...');
        const optimizeResult = await optimizePage(todo, config, constants);
        results.push({ todo, deployed: optimizeResult.optimized, ...optimizeResult });
      }

    } catch (err) {
      console.error(`  Error: ${err.message}`);
      failures.push({ todo, reason: err.message });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log('Content Builder Complete');
  console.log(`${'='.repeat(50)}`);
  console.log(`  Processed: ${todos.length} TODOs`);
  console.log(`  Deployed: ${results.filter(r => r.deployed).length}`);
  console.log(`  Skipped/Dry: ${results.filter(r => !r.deployed).length}`);
  console.log(`  Failed: ${failures.length}`);

  if (results.filter(r => r.deployed).length > 0) {
    console.log('\nDeployed:');
    for (const r of results.filter(r => r.deployed)) {
      console.log(`  "${r.article.title}" → ${r.city}`);
    }
  }

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  "${f.todo.keyword || f.todo.slug}" — ${f.reason}`);
    }
  }

  return { results, failures };
}

run().catch(err => {
  console.error('Content builder failed:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
