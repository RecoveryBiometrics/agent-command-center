#!/usr/bin/env node
/**
 * CLI entry point for the SEO deploy gate.
 *
 * Usage:
 *   node run.js --business safebath --summary "Add 10 new city pages"
 *   node run.js --business safebath --summary "Emergency revert" --force --force-reason "broken deploy"
 *
 * Exit codes:
 *   0 — PASS (or FORCED)
 *   1 — WARN (deploy allowed, but logged)
 *   2 — BLOCK (deploy halted)
 */
const { runGate } = require('./lib/run');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--business') args.businessId = argv[++i];
    else if (a === '--summary') args.summary = argv[++i];
    else if (a === '--force') args.forceOverride = true;
    else if (a === '--force-reason') args.forceReason = argv[++i];
  }
  return args;
}

function usage() {
  console.error(`
SEO Deploy Gate — pre-deploy safety checks

Usage:
  node run.js --business <id> --summary "<description>"
  node run.js --business <id> --summary "<description>" --force --force-reason "<reason>"

Required:
  --business    Business ID (e.g. safebath, ghl)
  --summary     One-line description of the change

Optional:
  --force              Override BLOCK findings (logs loudly)
  --force-reason       Required when using --force (stored in tracker)

Exit codes:
  0 = PASS (safe to deploy)
  1 = WARN (deploy allowed, logged)
  2 = BLOCK (deploy halted)
`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.businessId || !args.summary) {
    usage();
    process.exit(2);
  }

  if (args.forceOverride && !args.forceReason) {
    console.error('ERROR: --force requires --force-reason "<explanation>"');
    process.exit(2);
  }

  try {
    const { exitCode } = await runGate(args);
    process.exit(exitCode);
  } catch (e) {
    console.error('Gate error:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(2);
  }
}

main();
