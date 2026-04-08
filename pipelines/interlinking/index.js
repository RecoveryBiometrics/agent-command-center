/**
 * Interlinking Pipeline — Orchestrator
 *
 * Usage:
 *   node index.js --business safebath              # full run
 *   node index.js --business safebath --stage graph # just rebuild graph
 *   node index.js --business safebath --audit-only  # just run auditor
 *
 * Stages:
 *   1. Graph — build link graph from constants.ts + data files
 *   2. Neighbors — generate city-neighbors.json
 *   3. Inject — add relatedLinks to articles (Phase 2)
 *   4. Audit — check link health (Phase 2)
 */
require('dotenv').config();

const config = require('./lib/config');
const { buildGraph } = require('./stages/01-graph/graph');
const { generateNeighbors } = require('./stages/02-neighbors/neighbors');
const { injectLinks } = require('./stages/03-inject/inject');
const { auditLinks } = require('./stages/04-audit/audit');

const args = process.argv.slice(2);
const stageFlag = args.indexOf('--stage');
const targetStage = stageFlag >= 0 ? args[stageFlag + 1] : null;
const auditOnly = args.includes('--audit-only');

async function run() {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`${config.BUSINESS_NAME} Interlinking Pipeline`);
  console.log(`${'='.repeat(50)}\n`);

  if (auditOnly) {
    console.log('[Audit only mode — skipping graph and neighbors]\n');
    // TODO: Phase 2 — run auditor only
    console.log('Audit stage not yet implemented (Phase 2)');
    return;
  }

  // Stage 1: Build graph
  if (!targetStage || targetStage === 'graph') {
    console.log('[1/4] Building link graph...');
    buildGraph(config);
  }

  // Stage 2: Generate neighbors
  if (!targetStage || targetStage === 'neighbors') {
    console.log('\n[2/4] Generating city neighbors...');
    generateNeighbors(config);
  }

  // Stage 3: Inject relatedLinks into articles
  if (!targetStage || targetStage === 'inject') {
    console.log('\n[3/4] Injecting related links into articles...');
    injectLinks(config);
  }

  // Stage 4: Audit link health
  if (!targetStage || targetStage === 'audit') {
    console.log('\n[4/4] Auditing link health...');
    auditLinks(config);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('Interlinking complete.');
  console.log(`${'='.repeat(50)}\n`);
}

run().catch(err => {
  console.error('Interlinking pipeline failed:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
