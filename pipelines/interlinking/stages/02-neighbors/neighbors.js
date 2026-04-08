/**
 * Stage 2: Generate City Neighbors
 *
 * Reads the link graph and produces city-neighbors.json.
 * This file is consumed by the RelatedCities React component at build time.
 */
const fs = require('fs');
const path = require('path');

function generateNeighbors(config) {
  const graphPath = config.LINK_GRAPH_PATH;
  if (!fs.existsSync(graphPath)) {
    throw new Error(`Link graph not found at ${graphPath}. Run stage 01-graph first.`);
  }

  const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const maxNeighbors = config.NEIGHBOR_COUNT;
  const neighbors = {};

  // Get all city nodes
  const cityNodes = Object.entries(graph.nodes)
    .filter(([, node]) => node.type === 'city')
    .map(([path, node]) => ({ path, ...node }));

  for (const city of cityNodes) {
    // Find same-county neighbors (strongest links)
    const sameCounty = cityNodes
      .filter(c => c.county === city.county && c.path !== city.path)
      .map(c => ({
        slug: c.slug,
        name: c.name,
        state: c.state,
      }));

    // Find adjacent-county neighbors from graph edges
    const adjacentEdges = graph.edges
      .filter(e =>
        e.type === 'adjacent-county' &&
        (e.from === city.path || e.to === city.path)
      );

    const adjacentSlugs = new Set();
    const nearbyCounty = [];
    for (const edge of adjacentEdges) {
      const targetPath = edge.from === city.path ? edge.to : edge.from;
      const target = graph.nodes[targetPath];
      if (target && target.type === 'city' && !adjacentSlugs.has(target.slug)) {
        adjacentSlugs.add(target.slug);
        nearbyCounty.push({
          slug: target.slug,
          name: target.name,
          state: target.state,
        });
      }
    }

    // Cap at maxNeighbors total, prioritizing same county
    const allNeighbors = [...sameCounty, ...nearbyCounty].slice(0, maxNeighbors);
    const sameCountyCapped = allNeighbors.filter(n => sameCounty.some(s => s.slug === n.slug));
    const nearbyCountyCapped = allNeighbors.filter(n => nearbyCounty.some(nc => nc.slug === n.slug));

    // Use the city data slug (without prefix) as key for React lookup
    neighbors[city.slug] = {
      sameCounty: sameCountyCapped.map(n => n.slug),
      nearbyCounty: nearbyCountyCapped.map(n => n.slug),
      // Include display names for the React component
      labels: Object.fromEntries(
        allNeighbors.map(n => [n.slug, `${n.name}, ${n.state}`])
      ),
    };
  }

  // Write neighbors file
  const outputDir = path.dirname(config.NEIGHBORS_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(config.NEIGHBORS_PATH, JSON.stringify(neighbors, null, 2));

  const totalLinks = Object.values(neighbors).reduce((sum, n) => sum + n.sameCounty.length + n.nearbyCounty.length, 0);
  console.log(`  Neighbors: ${Object.keys(neighbors).length} cities, ${totalLinks} total links`);
  console.log(`  Written to: ${config.NEIGHBORS_PATH}`);

  return neighbors;
}

module.exports = { generateNeighbors };
