/**
 * Quality Report Generator — Summarizes audit and research results.
 *
 * Generates a human-readable quality report after each pipeline run.
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { loadQualityScores } = require('./auditor');

/**
 * Generate a quality report from audit results.
 *
 * @param {object[]} auditResults - Array of city audit results
 * @param {object} researchResults - { applied, pending, removed } from researcher
 * @returns {string} - Formatted report text
 */
function generateReport(auditResults = null, researchResults = null) {
  const scores = loadQualityScores();
  const allEntries = Object.entries(scores);
  const now = new Date().toISOString().split('T')[0];

  let report = `\n=== Quality Report — ${now} ===\n`;

  if (auditResults) {
    const totalCities = auditResults.length;
    const totalBiz = auditResults.reduce((sum, c) => sum + c.summary.total, 0);
    const totalPassed = auditResults.reduce((sum, c) => sum + c.summary.passed, 0);
    const totalFlagged = auditResults.reduce((sum, c) => sum + c.summary.flagged, 0);

    report += `Cities processed: ${totalCities}\n`;
    report += `Businesses audited: ${totalBiz}\n`;
    report += `  Passed: ${totalPassed} (${totalBiz > 0 ? Math.round(totalPassed / totalBiz * 100) : 0}%)\n`;
    report += `  Flagged: ${totalFlagged} (${totalBiz > 0 ? Math.round(totalFlagged / totalBiz * 100) : 0}%)\n`;
  }

  if (researchResults) {
    const { applied = [], pending = 0, removed = [] } = researchResults;
    report += `\nResearcher results:\n`;
    report += `  Auto-corrected: ${applied.length}\n`;
    report += `  Pending review: ${pending}\n`;
    report += `  Removed (closed): ${removed.length}\n`;
  }

  // Aggregate flag types across all scores
  const flagCounts = {};
  for (const [slug, data] of allEntries) {
    for (const flag of (data.qualityFlags || [])) {
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    }
  }

  if (Object.keys(flagCounts).length > 0) {
    report += `\nTop issues:\n`;
    const sorted = Object.entries(flagCounts).sort((a, b) => b[1] - a[1]);
    for (const [flag, count] of sorted.slice(0, 10)) {
      report += `  - ${count}x ${flag}\n`;
    }
  }

  // Overall health
  const totalScored = allEntries.length;
  const verifiedCount = allEntries.filter(([, d]) => d.qualityScore >= 70).length;
  const healthPct = totalScored > 0 ? Math.round(verifiedCount / totalScored * 100) : 0;
  report += `\nOverall directory health: ${healthPct}% verified (${verifiedCount}/${totalScored} listings)\n`;

  // Score distribution
  const buckets = { '90-100': 0, '70-89': 0, '50-69': 0, '0-49': 0 };
  for (const [, data] of allEntries) {
    const s = data.qualityScore;
    if (s >= 90) buckets['90-100']++;
    else if (s >= 70) buckets['70-89']++;
    else if (s >= 50) buckets['50-69']++;
    else buckets['0-49']++;
  }

  report += `\nScore distribution:\n`;
  for (const [range, count] of Object.entries(buckets)) {
    report += `  ${range}: ${count}\n`;
  }

  return report;
}

/**
 * Print report to console and optionally save to file.
 */
function printReport(auditResults, researchResults, savePath) {
  const report = generateReport(auditResults, researchResults);
  console.log(report);

  if (savePath) {
    fs.writeFileSync(savePath, report);
    console.log(`Report saved to ${savePath}`);
  }

  return report;
}

module.exports = { generateReport, printReport };
