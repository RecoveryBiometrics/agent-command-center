#!/usr/bin/env node
/**
 * Pipeline Health — cross-checks VPS, origin, and live Cloudflare.
 *
 * Exit codes:
 *   0 = all pass
 *   1 = warn (monitoring concerns, deploy still functional)
 *   2 = block (actionable failure — content stranded or live site broken)
 */
const { runChecks } = require('./lib/run');

function parseArgs(argv) {
  const args = { alert: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--alert') args.alert = true;
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  try {
    const { exitCode } = await runChecks(args);
    process.exit(exitCode);
  } catch (e) {
    console.error('Pipeline Health error:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(2);
  }
})();
