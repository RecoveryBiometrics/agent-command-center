/**
 * Fact Checker — Validates insights before they become recommendations.
 *
 * Checks: bot traffic, sample size, conflicting signals, data freshness,
 * seasonal patterns. Tags each insight with validated confidence.
 */
const config = require('./config');

const MIN_SESSIONS_FOR_CONFIDENCE = 100;
const MIN_CONVERSIONS_FOR_CONFIDENCE = 5;

function factCheck(insights, snapshot, trendData) {
  const checked = [];
  const flags = [];

  for (const insight of insights) {
    let validatedConfidence = insight.confidence;
    const reasons = [];

    // 1. Bot traffic — downgrade everything if bot suspect
    if (trendData.botSuspect && insight.category === 'traffic') {
      validatedConfidence = 'low';
      reasons.push('Possible bot traffic detected — traffic insights unreliable');
    }

    // 2. Sample size — need enough data to act on
    if (insight.category === 'conversions' && insight.data) {
      const current = insight.data.current || insight.data.conversions || 0;
      if (current < MIN_CONVERSIONS_FOR_CONFIDENCE) {
        validatedConfidence = downgrade(validatedConfidence);
        reasons.push(`Only ${current} conversions — too few to draw conclusions`);
      }
    }

    if (insight.category === 'content' && insight.data?.sessions) {
      if (insight.data.sessions < 10) {
        validatedConfidence = downgrade(validatedConfidence);
        reasons.push(`Only ${insight.data.sessions} sessions on this page — small sample`);
      }
    }

    // 3. Overall session count too low
    if (snapshot.overview?.current?.sessions < MIN_SESSIONS_FOR_CONFIDENCE) {
      if (['traffic', 'channels', 'geo', 'devices'].includes(insight.category)) {
        validatedConfidence = downgrade(validatedConfidence);
        reasons.push(`Total sessions (${snapshot.overview.current.sessions}) below ${MIN_SESSIONS_FOR_CONFIDENCE} — patterns may not be meaningful`);
      }
    }

    // 4. Conflicting signals — traffic up but conversions down
    if (insight.category === 'traffic' && insight.data?.direction === 'up') {
      const conversionInsights = insights.filter(i => i.category === 'conversions');
      const droppingConversions = conversionInsights.filter(i => {
        const change = i.data?.prior > 0 ? ((i.data.current - i.data.prior) / i.data.prior) : 0;
        return change < -0.15;
      });
      if (droppingConversions.length > 0) {
        reasons.push('Traffic is up but conversions are down — quality of new traffic may be poor');
        flags.push({
          type: 'conflicting_signals',
          message: 'Traffic increasing while conversions decreasing — investigate traffic quality',
        });
      }
    }

    // 5. Data freshness — GA4 can lag 24-48hrs
    const fetchedAt = new Date(snapshot.fetchedAt);
    const endDate = new Date(snapshot.periods.current.endDate);
    const hoursAgo = (fetchedAt - endDate) / (1000 * 60 * 60);
    if (hoursAgo < 24 && insight.category !== 'anomaly') {
      // Data for "yesterday" might not be complete yet
      reasons.push('Most recent day may have incomplete data (GA4 processing lag)');
    }

    // 6. Bounce rate context — high bounce on specific page types may be OK
    if (insight.category === 'content' && insight.data?.bounceRate > 0.8) {
      const pages = Array.isArray(insight.data) ? insight.data : [insight.data];
      const locationPages = pages.filter(p =>
        p.page && (p.page.includes('/location') || p.page.includes('/city/') || p.page.includes('/grab-bar'))
      );
      if (locationPages.length > 0) {
        reasons.push('Some of these are location/service pages — high bounce may be OK if visitors call directly');
      }
    }

    checked.push({
      ...insight,
      originalConfidence: insight.confidence,
      confidence: validatedConfidence,
      factCheckReasons: reasons,
    });
  }

  const summary = {
    total: checked.length,
    high: checked.filter(i => i.confidence === 'high').length,
    medium: checked.filter(i => i.confidence === 'medium').length,
    low: checked.filter(i => i.confidence === 'low').length,
    flags,
  };

  console.log(`  Fact-checked ${summary.total} insights: ${summary.high} high, ${summary.medium} medium, ${summary.low} low`);
  if (flags.length > 0) {
    console.log(`  Flags: ${flags.map(f => f.message).join('; ')}`);
  }

  return { insights: checked, summary };
}

function downgrade(confidence) {
  if (confidence === 'high') return 'medium';
  if (confidence === 'medium') return 'low';
  return 'low';
}

module.exports = { factCheck };
