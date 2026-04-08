/**
 * Cluster definitions — which counties are adjacent, how to determine neighbors.
 *
 * This is the geographic knowledge that drives interlinking.
 * Adjacency is based on real geography, not the YAML.
 */

// Counties that share a border or are close enough to be useful neighbors
const ADJACENT_COUNTIES = {
  'Chester County, PA':       ['Delaware County, PA', 'Montgomery County, PA', 'Lancaster County, PA', 'Philadelphia County, PA', 'New Castle County, DE'],
  'Delaware County, PA':      ['Chester County, PA', 'Montgomery County, PA', 'Philadelphia County, PA'],
  'Montgomery County, PA':    ['Chester County, PA', 'Delaware County, PA', 'Philadelphia County, PA', 'Lancaster County, PA'],
  'Philadelphia County, PA':  ['Delaware County, PA', 'Montgomery County, PA', 'Chester County, PA'],
  'Lancaster County, PA':     ['Chester County, PA', 'Montgomery County, PA'],
  'New Castle County, DE':    ['Chester County, PA', 'Cecil County, MD'],
  'Cecil County, MD':         ['New Castle County, DE'],
  'Montgomery County, MD':    [],  // DC metro — no adjacent SafeBath counties
  'Clark County, NV':         [],  // Las Vegas — standalone market
  'Horry County, SC':         [],  // Myrtle Beach — standalone market
};

// Category → most relevant service slug mapping
const CATEGORY_SERVICE_MAP = {
  'safety-tip':  'bathroom-grab-bar-installation',
  'local-news':  'bathroom-grab-bar-installation',
  'community':   'accessible-shower-seat-installation',
  'seasonal':    'bathroom-grab-bar-installation',
  'stats':       'toilet-safety-frame-installation',
};

/**
 * Get adjacent counties for a given county name.
 */
function getAdjacentCounties(countyName) {
  return ADJACENT_COUNTIES[countyName] || [];
}

/**
 * Get the service slug most relevant to an article category.
 */
function getServiceForCategory(category) {
  return CATEGORY_SERVICE_MAP[category] || 'bathroom-grab-bar-installation';
}

module.exports = { ADJACENT_COUNTIES, CATEGORY_SERVICE_MAP, getAdjacentCounties, getServiceForCategory };
