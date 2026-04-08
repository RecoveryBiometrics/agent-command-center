/**
 * Stage 1: Build Link Graph
 *
 * Reads constants.ts (locations, services) and local-news data.
 * Produces a link graph with nodes (pages) and edges (links between them).
 */
const fs = require('fs');
const path = require('path');
const { parseConstants } = require('../../lib/parse-constants');
const { getAdjacentCounties } = require('../../lib/clusters');

function slugifyCity(city) {
  const slug = city.slug || city.name.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  const state = (city.state || '').toLowerCase();
  return `bathroom-safety-${slug}-${state}`;
}

function slugifyCounty(countyName) {
  return `bathroom-safety-${countyName.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}`;
}

function buildGraph(config) {
  const { counties, services } = parseConstants(config.CONSTANTS_PATH);

  const nodes = {};
  const edges = [];

  // --- Add city page nodes ---
  for (const county of counties) {
    for (const city of county.cities) {
      const citySlug = slugifyCity(city);
      nodes[`/${citySlug}`] = {
        type: 'city',
        name: city.name,
        state: city.state,
        county: county.county,
        slug: citySlug,
      };
    }
  }

  // --- Add county page nodes ---
  for (const county of counties) {
    const countySlug = slugifyCounty(county.county);
    nodes[`/${countySlug}`] = {
      type: 'county',
      name: county.county,
      state: county.county.slice(-2),
      slug: countySlug,
      cityCount: county.cities.length,
    };
  }

  // --- Add service page nodes ---
  for (const service of services) {
    nodes[`/bathroom-safety-services/${service.slug}`] = {
      type: 'service',
      name: service.name,
      slug: service.slug,
    };
  }

  // --- Add article nodes (from local-news JSON files) ---
  const newsDir = config.LOCAL_NEWS_DIR;
  const articlesByCitySlug = {};
  if (fs.existsSync(newsDir)) {
    for (const file of fs.readdirSync(newsDir).filter(f => f.endsWith('.json'))) {
      const cityDataSlug = file.replace('.json', '');
      try {
        const articles = JSON.parse(fs.readFileSync(path.join(newsDir, file), 'utf8'));
        if (Array.isArray(articles)) {
          articlesByCitySlug[cityDataSlug] = articles;
          for (const article of articles) {
            const cityPageSlug = Object.keys(nodes).find(k =>
              nodes[k].type === 'city' && k.includes(cityDataSlug)
            );
            if (cityPageSlug) {
              nodes[`${cityPageSlug}/local-news/${article.slug}`] = {
                type: 'article',
                title: article.title,
                category: article.category || 'local-news',
                cityPageSlug,
                date: article.date,
              };
            }
          }
        }
      } catch { /* skip malformed */ }
    }
  }

  // --- Build edges ---

  // 1. Same-county city↔city links (geographic siblings)
  for (const county of counties) {
    const citySlugs = county.cities.map(c => `/${slugifyCity(c)}`);
    for (const from of citySlugs) {
      for (const to of citySlugs) {
        if (from !== to) {
          edges.push({
            from,
            to,
            type: 'geographic-sibling',
            weight: 1.0, // same county = strongest
          });
        }
      }
    }
  }

  // 2. Adjacent-county city links
  for (const county of counties) {
    const adjacent = getAdjacentCounties(county.county);
    for (const adjCountyName of adjacent) {
      const adjCounty = counties.find(c => c.county === adjCountyName);
      if (!adjCounty) continue;
      // Link first 3 cities from each to first 3 of adjacent (not all-to-all)
      const fromCities = county.cities.slice(0, 3);
      const toCities = adjCounty.cities.slice(0, 3);
      for (const from of fromCities) {
        for (const to of toCities) {
          edges.push({
            from: `/${slugifyCity(from)}`,
            to: `/${slugifyCity(to)}`,
            type: 'adjacent-county',
            weight: 0.5,
          });
        }
      }
    }
  }

  // 3. City → county link (breadcrumb up)
  for (const county of counties) {
    const countySlug = `/${slugifyCounty(county.county)}`;
    for (const city of county.cities) {
      edges.push({
        from: `/${slugifyCity(city)}`,
        to: countySlug,
        type: 'city-to-county',
        weight: 0.8,
      });
    }
  }

  // 4. City → service links
  for (const county of counties) {
    for (const city of county.cities) {
      // Each city links to the main service
      edges.push({
        from: `/${slugifyCity(city)}`,
        to: '/bathroom-safety-services/bathroom-grab-bar-installation',
        type: 'city-to-service',
        weight: 0.6,
      });
    }
  }

  // 5. Article → city page link
  for (const [nodePath, node] of Object.entries(nodes)) {
    if (node.type === 'article' && node.cityPageSlug) {
      edges.push({
        from: nodePath,
        to: node.cityPageSlug,
        type: 'article-to-city',
        weight: 0.9,
      });
    }
  }

  const graph = {
    generatedAt: new Date().toISOString(),
    stats: {
      cities: Object.values(nodes).filter(n => n.type === 'city').length,
      counties: Object.values(nodes).filter(n => n.type === 'county').length,
      services: Object.values(nodes).filter(n => n.type === 'service').length,
      articles: Object.values(nodes).filter(n => n.type === 'article').length,
      edges: edges.length,
    },
    nodes,
    edges,
  };

  // Write graph
  const outputDir = path.dirname(config.LINK_GRAPH_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(config.LINK_GRAPH_PATH, JSON.stringify(graph, null, 2));

  console.log(`  Link graph: ${graph.stats.cities} cities, ${graph.stats.counties} counties, ${graph.stats.services} services, ${graph.stats.articles} articles, ${graph.stats.edges} edges`);
  console.log(`  Written to: ${config.LINK_GRAPH_PATH}`);

  return graph;
}

module.exports = { buildGraph };
