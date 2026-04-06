require('dotenv').config();

const config = require('./config');
const { fetchSearchConsoleData } = require('./fetch-gsc');
const { fetchGA4Data } = require('./fetch-ga4');
const { inspectPages } = require('./inspect');
const { analyze } = require('./analyze');
const { interpret } = require('./interpret');
const { review } = require('./review');
const { generateReport, generateEmailBody } = require('./report');
const { sendToSlack } = require('./slack');

async function run() {
  console.log(`${config.businessName} SEO Agent starting...`);

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.error('\n ERROR: GOOGLE_SERVICE_ACCOUNT_KEY is not set.');
    console.error(' Set it in .env or as a GitHub Actions secret.\n');
    process.exit(1);
  }

  try {
    // 1. Fetch from Google Search Console
    console.log('\n[1/7] Fetching Search Console data...');
    const data = await fetchSearchConsoleData();

    // 2. Fetch from Google Analytics 4
    console.log('[2/7] Fetching GA4 data...');
    let ga4 = null;
    try {
      ga4 = await fetchGA4Data();
    } catch (err) {
      console.warn('GA4 fetch failed (may not have data yet):', err.message);
    }

    // 3. Inspect — check indexing status of not-indexed pages
    console.log('[3/7] Inspecting indexing status...');
    const inspection = await inspectPages();

    // 4. Analyze — find wins, drops, opportunities, gaps
    console.log('[4/7] Analyzing...');
    const analysis = analyze(data);

    // 5. Interpret — connect page movements to changelog entries
    console.log('[5/7] Interpreting — linking changes to results...');
    const interpretation = interpret(analysis, data);

    // 6. Review — second pass to validate interpretations
    console.log('[6/7] Reviewing — checking for false correlations...');
    const reviewResult = review(interpretation, analysis);

    // 7. Generate report file
    console.log('[7/7] Generating report...');
    const { md, reportPath } = generateReport(data, analysis, interpretation, reviewResult, inspection);

    // Send report to Slack #safebath channel
    const date = new Date().toISOString().split('T')[0];
    const emailBody = generateEmailBody(data, analysis, interpretation, reviewResult, inspection, ga4);
    await sendToSlack(`${config.businessName} SEO Report — ${date}`, emailBody);

    console.log('\nDone.');
    console.log(`  Clicks:       ${analysis.currentTotals.clicks}`);
    console.log(`  Impressions:  ${analysis.currentTotals.impressions}`);
    console.log(`  Avg position: ${analysis.currentTotals.avgPosition.toFixed(1)}`);
    console.log(`  Wins: ${analysis.wins.length}  |  Drops: ${analysis.drops.length}  |  Gaps: ${analysis.gaps.length}`);
    if (inspection.summary) {
      console.log(`  Indexed: ${inspection.summary.indexed}/${inspection.summary.totalPages} total  |  Not indexed: ${inspection.summary.notIndexed}`);
    }
    console.log(`  Attributed: ${reviewResult.stats.totalAttributed}  |  Unattributed: ${reviewResult.stats.totalUnattributed}  |  Warnings: ${reviewResult.stats.warningCount}`);
    console.log(`  Overall confidence: ${reviewResult.overallConfidence}`);
    console.log(`  Report: ${reportPath}`);

  } catch (err) {
    console.error('\nSEO Agent failed:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

run();
