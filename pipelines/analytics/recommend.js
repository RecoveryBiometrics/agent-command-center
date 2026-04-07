/**
 * Recommender — Generates prioritized action items from fact-checked insights.
 *
 * Only HIGH confidence insights become auto-dispatched recommendations.
 * MEDIUM confidence goes to Sheet as suggestions. LOW is logged only.
 * Max 3 recommendations per pipeline per run.
 */
const config = require('./config');

const MAX_RECOMMENDATIONS_PER_PIPELINE = 3;

function recommend(checkedInsights, snapshot, trendData) {
  const recommendations = [];
  const suggestions = [];
  const dispatchTargets = config.dispatchTargets;

  const highInsights = checkedInsights.filter(i => i.confidence === 'high');
  const mediumInsights = checkedInsights.filter(i => i.confidence === 'medium');

  // Generate recommendations from high-confidence insights

  // 1. Geo-based content recommendations (for seo-content pipeline)
  if (dispatchTargets.includes('seo-content')) {
    const geoInsight = highInsights.find(i => i.category === 'geo' && i.data?.coveragePct !== undefined);
    if (geoInsight && geoInsight.data.coveragePct < 60) {
      // Find top regions driving traffic that might need more content
      const topGeoRegions = snapshot.geo
        .filter(g => config.serviceAreaStates.some(s => g.region.includes(s)))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 3);

      if (topGeoRegions.length > 0) {
        recommendations.push({
          action: 'prioritize_cities',
          target: 'seo-content',
          what: `Prioritize content for ${topGeoRegions.map(r => r.region).join(', ')}`,
          why: `These service area regions drive the most traffic but coverage is only ${geoInsight.data.coveragePct}%`,
          params: { cities: topGeoRegions.map(r => r.region) },
          impact: 'medium',
          effort: 'low',
          sourceInsight: geoInsight.message,
        });
      }
    }

    // Content category recommendations based on conversion data
    const contentInsight = highInsights.find(i => i.category === 'content' && i.data?.conversions > 0);
    if (contentInsight) {
      const topPage = contentInsight.data;
      // Detect page type from URL pattern
      const pageType = detectPageType(topPage.page || '');
      if (pageType) {
        recommendations.push({
          action: 'prioritize_categories',
          target: 'seo-content',
          what: `Prioritize "${pageType}" content — it converts best`,
          why: `${topPage.page} drives ${topPage.conversions} conversions from ${topPage.sessions} sessions`,
          params: { categories: [pageType] },
          impact: 'high',
          effort: 'low',
          sourceInsight: contentInsight.message,
        });
      }
    }

    // High-bounce content needs attention
    const bounceInsight = highInsights.find(i =>
      i.category === 'content' && i.message.includes('bounce rates above')
    );
    if (bounceInsight && Array.isArray(bounceInsight.data)) {
      suggestions.push({
        what: `Review high-bounce pages: ${bounceInsight.data.map(p => p.page).join(', ')}`,
        why: 'These pages get traffic but visitors leave immediately — may need better CTAs or content',
        impact: 'medium',
        effort: 'medium',
        sourceInsight: bounceInsight.message,
      });
    }
  }

  // 2. Podcast/content-production recommendations
  if (dispatchTargets.includes('content-production')) {
    const channelInsight = highInsights.find(i => i.category === 'channels');
    if (channelInsight && channelInsight.data?.channel === 'Organic Search' && channelInsight.data?.changePct > 15) {
      // Organic is growing — double down on what's working
      const topPages = snapshot.landingPages.slice(0, 5);
      const topicHints = topPages.map(p => extractTopic(p.page)).filter(Boolean);
      if (topicHints.length > 0) {
        recommendations.push({
          action: 'adjust_topic_weights',
          target: 'content-production',
          what: `Increase weight for topics: ${topicHints.join(', ')}`,
          why: `Organic search up ${channelInsight.data.changePct}% — these pages are driving the growth`,
          params: { topics: topicHints, direction: 'increase' },
          impact: 'medium',
          effort: 'low',
          sourceInsight: channelInsight.message,
        });
      }
    }
  }

  // 3. Directory recommendations
  if (dispatchTargets.includes('directory')) {
    if (trendData.serviceAreaCoverage && trendData.serviceAreaCoverage.coveragePct > 0) {
      const topRegions = snapshot.geo
        .filter(g => config.serviceAreaStates.some(s => g.region.includes(s)))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 3);

      if (topRegions.length > 0) {
        recommendations.push({
          action: 'prioritize_regions',
          target: 'directory',
          what: `Focus directory listings on ${topRegions.map(r => r.region).join(', ')}`,
          why: `These regions drive the most qualified traffic`,
          params: { regions: topRegions.map(r => r.region) },
          impact: 'medium',
          effort: 'low',
          sourceInsight: `Service area coverage: ${trendData.serviceAreaCoverage.coveragePct}%`,
        });
      }
    }
  }

  // Add medium-confidence insights as suggestions
  for (const insight of mediumInsights) {
    if (insight.category !== 'anomaly' && insight.category !== 'data_quality') {
      suggestions.push({
        what: insight.message,
        why: insight.factCheckReasons.length > 0 ? insight.factCheckReasons[0] : 'Medium confidence — worth monitoring',
        impact: 'unknown',
        effort: 'unknown',
        sourceInsight: insight.message,
      });
    }
  }

  // Enforce max per pipeline
  const perPipeline = {};
  const finalRecs = [];
  for (const rec of recommendations) {
    const count = perPipeline[rec.target] || 0;
    if (count < MAX_RECOMMENDATIONS_PER_PIPELINE) {
      finalRecs.push(rec);
      perPipeline[rec.target] = count + 1;
    } else {
      suggestions.push({
        what: rec.what,
        why: `${rec.why} (queued — max ${MAX_RECOMMENDATIONS_PER_PIPELINE} per pipeline reached)`,
        impact: rec.impact,
        effort: rec.effort,
        sourceInsight: rec.sourceInsight,
      });
    }
  }

  console.log(`  Generated ${finalRecs.length} recommendations, ${suggestions.length} suggestions`);
  for (const rec of finalRecs) {
    console.log(`    → ${rec.target}: ${rec.what}`);
  }

  return { recommendations: finalRecs, suggestions };
}

function detectPageType(pagePath) {
  if (pagePath.includes('safety-tip') || pagePath.includes('safety')) return 'safety-tip';
  if (pagePath.includes('local-news') || pagePath.includes('news')) return 'local-news';
  if (pagePath.includes('community')) return 'community';
  if (pagePath.includes('directory')) return 'directory';
  if (pagePath.includes('grab-bar') || pagePath.includes('location')) return 'location';
  return null;
}

function extractTopic(pagePath) {
  // Extract meaningful topic from URL path
  const parts = pagePath.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  return last.replace(/-/g, ' ').replace(/\d+/g, '').trim() || null;
}

module.exports = { recommend };
