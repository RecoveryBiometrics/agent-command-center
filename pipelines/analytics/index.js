require('dotenv').config();

const config = require('./config');
const { collect } = require('./collect');
const { detectTrends } = require('./trends');
const { generateInsights } = require('./insights');
const { factCheck } = require('./fact-check');
const { recommend } = require('./recommend');
const { dispatch } = require('./dispatch');
const { logToSheet } = require('./sheet');
const { postToSlack } = require('./slack');
const { writeSuggestionsAsTodos } = require('./todos');

async function run() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${config.businessName} Analytics Pipeline`);
  console.log(`Property: ${config.ga4PropertyId} | Niche: ${config.niche}`);
  console.log(`${'='.repeat(60)}`);

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.error('\n ERROR: GOOGLE_SERVICE_ACCOUNT_KEY is not set.');
    console.error(' Set it in .env or as a GitHub Actions secret.\n');
    process.exit(1);
  }

  try {
    // 1. Collect all GA4 data
    console.log('\n[1/7] Collecting GA4 data...');
    const snapshot = await collect();

    // 2. Detect trends and anomalies
    console.log('\n[2/7] Detecting trends...');
    const trendData = detectTrends(snapshot);

    // 3. Generate insights
    console.log('\n[3/7] Generating insights...');
    const insights = generateInsights(snapshot, trendData);

    // 4. Fact-check insights
    console.log('\n[4/7] Fact-checking...');
    const { insights: checkedInsights, summary: factCheckSummary } = factCheck(insights, snapshot, trendData);

    // 5. Generate recommendations
    console.log('\n[5/7] Generating recommendations...');
    const { recommendations, suggestions } = recommend(checkedInsights, snapshot, trendData);

    // 6. Dispatch to target pipelines
    console.log('\n[6/7] Dispatching...');
    const dispatched = dispatch(recommendations);

    // 7. Report — Sheet + Slack + TODOs
    console.log('\n[7/7] Reporting...');
    await logToSheet(snapshot, checkedInsights, recommendations, suggestions, dispatched);
    const todosAdded = await writeSuggestionsAsTodos(suggestions, dispatched);
    await postToSlack(snapshot, checkedInsights, recommendations, suggestions, dispatched, todosAdded);

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('Pipeline complete.');
    console.log(`  Sessions: ${snapshot.overview.current?.sessions ?? 'N/A'}`);
    console.log(`  Insights: ${checkedInsights.length} (${factCheckSummary.high} high, ${factCheckSummary.medium} medium, ${factCheckSummary.low} low)`);
    console.log(`  Recommendations: ${recommendations.length} dispatched, ${suggestions.length} suggestions`);
    console.log(`  Dispatches: ${dispatched.length > 0 ? dispatched.map(d => `${d.target} (${d.instructions})`).join(', ') : 'none'}`);
    console.log(`${'='.repeat(60)}\n`);

    return { snapshot, trendData, checkedInsights, recommendations, suggestions, dispatched };
  } catch (err) {
    console.error('\nAnalytics pipeline failed:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

run();
