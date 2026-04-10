function totals(rows) {
  const t = rows.reduce(
    (acc, r) => {
      acc.clicks += r.clicks;
      acc.impressions += r.impressions;
      return acc;
    },
    { clicks: 0, impressions: 0 }
  );
  t.ctr = t.impressions > 0 ? t.clicks / t.impressions : 0;
  t.avgPosition =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.position * r.impressions, 0) /
        rows.reduce((s, r) => s + r.impressions, 0)
      : 0;
  return t;
}

function analyze(data) {
  const { byPage, byQuery, priorByPage, queryByLang } = data;

  const priorMap = Object.fromEntries(
    priorByPage.map(r => [r.keys[0], r])
  );

  const pageChanges = byPage.map(row => {
    const url = row.keys[0];
    const prior = priorMap[url];
    return {
      url,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      priorClicks: prior?.clicks ?? null,
      priorImpressions: prior?.impressions ?? null,
      priorPosition: prior?.position ?? null,
      // positive delta = improved (moved up in rankings)
      positionDelta: prior != null ? prior.position - row.position : null,
      clickDelta: prior != null ? row.clicks - prior.clicks : null,
    };
  });

  // Wins: moved up 3+ positions with at least 20 impressions
  const wins = pageChanges
    .filter(p => p.positionDelta >= 3 && p.impressions >= 20)
    .sort((a, b) => b.positionDelta - a.positionDelta)
    .slice(0, 10);

  // Drops: fell 3+ positions with at least 20 impressions
  const drops = pageChanges
    .filter(p => p.positionDelta !== null && p.positionDelta <= -3 && p.impressions >= 20)
    .sort((a, b) => a.positionDelta - b.positionDelta)
    .slice(0, 10);

  // Opportunities: positions 8–20, CTR below 3%, 30+ impressions
  // These are close to page 1 — a meta tweak or internal link could push them over
  const opportunities = byPage
    .filter(r => r.position >= 8 && r.position <= 20 && r.ctr < 0.03 && r.impressions >= 30)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  // Gaps: queries with 50+ impressions and 0 clicks — likely no dedicated page exists
  const gaps = byQuery
    .filter(r => r.impressions >= 50 && r.clicks === 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  // Language-specific gaps from country-bucketed queries
  const langGaps = {};
  if (queryByLang) {
    for (const [lang, rows] of Object.entries(queryByLang)) {
      langGaps[lang] = rows
        .filter(r => r.impressions >= 20 && r.clicks === 0)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 15)
        .map(r => ({
          query: r.keys[0],
          country: r.country,
          impressions: r.impressions,
          position: r.position,
          language: lang,
        }));
    }
  }

  return {
    currentTotals: totals(byPage),
    priorTotals: totals(priorByPage),
    wins,
    drops,
    opportunities,
    gaps,
    langGaps,
    pageCount: byPage.length,
    queryCount: byQuery.length,
  };
}

module.exports = { analyze };
