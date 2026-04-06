#!/usr/bin/env node
/**
 * verify-and-clean.js — Removes fabricated/templated listings from city-wiki data.
 *
 * Run modes:
 *   --dry-run     Show what would be removed without changing files (default)
 *   --apply       Actually remove bad listings and rewrite JSON files
 *   --report      Output CSV of all listings with their status
 *
 * What it catches:
 *   1. "{CityName} Senior Center" pattern (fabricated)
 *   2. "Visiting Nurses Association — {City} Area" (fabricated)
 *   3. "{County} Department of Human Services" without contact info (templated wrong name)
 *   4. "{County} Area Agency on Aging" without contact info (templated wrong name)
 *   5. Generic descriptions that are clearly fill-in-the-blank templates
 *   6. State-level resources duplicated across every city (keeps 1 per state)
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--apply');
const REPORT = args.includes('--report');

const DATA_DIR = config.WIKI_DATA_DIR;

// ─── Detection patterns ───────────────────────────────────────────────────────

/**
 * Check if a listing is a templated "{CityName} Senior Center" fake.
 */
function isTemplatedSeniorCenter(biz, cityName) {
  if (!biz.name.includes(cityName)) return false;
  if (!/Senior Center/i.test(biz.name)) return false;
  // If it has real contact info, it might be legit (e.g., West Chester Area Senior Center)
  if (biz.phone && biz.website) return false;
  return true;
}

/**
 * Check if a listing is a templated "VNA — {City} Area" fake.
 */
function isTemplatedVNA(biz, cityName) {
  return /^Visiting Nurses Association\s*[—–-]\s*/i.test(biz.name) && !biz.phone && !biz.website;
}

/**
 * Check if a listing is a templated county department with wrong name.
 */
function isTemplatedCountyDept(biz) {
  if (biz.phone && biz.website) return false;
  return /County (Department of Human Services|Area Agency on Aging)/i.test(biz.name);
}

/**
 * Check if a listing is a state-level resource (2-1-1, state programs).
 * These are real but shouldn't be duplicated per city.
 */
function isStateLevelResource(biz) {
  return biz.type === 'Resource Helpline' || biz.type === 'State Program';
}

/**
 * Check if description is a generic template.
 */
function isGenericDescription(biz) {
  const desc = biz.description || '';
  const patterns = [
    /serving the .+ area\.$/i,
    /^(Senior Center|Home Care|Medical Supply|Home Health) serving/i,
    /^Community center offering programs, meals, social activities/i,
    /^Government agency coordinating senior services across/i,
    /^County department providing social services including/i,
    /^Home health nursing and rehabilitation services for seniors/i,
  ];
  return patterns.some(p => p.test(desc));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function run() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

  const stats = {
    totalFiles: files.length,
    totalListings: 0,
    removed: { seniorCenter: 0, vna: 0, countyDept: 0, stateDupe: 0, genericOnly: 0 },
    kept: 0,
    stateResourcesSeen: new Map(), // track first occurrence per state
  };

  const report = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const cityName = data.cityName;
    const businesses = data.localBusinesses || [];
    const originalCount = businesses.length;

    stats.totalListings += originalCount;

    const kept = [];

    for (const biz of businesses) {
      let status = 'keep';
      let reason = '';

      if (isTemplatedSeniorCenter(biz, cityName)) {
        status = 'remove';
        reason = 'templated-senior-center';
        stats.removed.seniorCenter++;
      } else if (isTemplatedVNA(biz, cityName)) {
        status = 'remove';
        reason = 'templated-vna';
        stats.removed.vna++;
      } else if (isTemplatedCountyDept(biz)) {
        status = 'remove';
        reason = 'templated-county-dept';
        stats.removed.countyDept++;
      } else if (isStateLevelResource(biz)) {
        const stateKey = `${biz.name}::${data.state}`;
        if (stats.stateResourcesSeen.has(stateKey)) {
          status = 'remove';
          reason = 'state-resource-duplicate';
          stats.removed.stateDupe++;
        } else {
          stats.stateResourcesSeen.set(stateKey, file);
          status = 'keep';
        }
      } else if (isGenericDescription(biz) && !biz.phone && !biz.website) {
        status = 'remove';
        reason = 'generic-no-contact';
        stats.removed.genericOnly++;
      }

      if (REPORT) {
        report.push({
          file: file.replace('.json', ''),
          city: cityName,
          state: data.state,
          name: biz.name,
          type: biz.type,
          hasPhone: !!biz.phone,
          hasWebsite: !!biz.website,
          status,
          reason,
        });
      }

      if (status === 'keep') {
        kept.push(biz);
        stats.kept++;
      }
    }

    // Write updated file
    if (!DRY_RUN && kept.length !== originalCount) {
      data.localBusinesses = kept;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  ${file}: ${originalCount} → ${kept.length} (removed ${originalCount - kept.length})`);
    } else if (DRY_RUN && kept.length !== originalCount) {
      console.log(`  [DRY RUN] ${file}: ${originalCount} → ${kept.length} (would remove ${originalCount - kept.length})`);
    }
  }

  // Summary
  const totalRemoved = Object.values(stats.removed).reduce((a, b) => a + b, 0);
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  VERIFICATION SUMMARY ${DRY_RUN ? '(DRY RUN)' : '(APPLIED)'}`);
  console.log('═══════════════════════════════════════════════');
  console.log(`  Total files:            ${stats.totalFiles}`);
  console.log(`  Total listings:         ${stats.totalListings}`);
  console.log(`  Removed:                ${totalRemoved}`);
  console.log(`    - Fake senior centers: ${stats.removed.seniorCenter}`);
  console.log(`    - Fake VNA entries:    ${stats.removed.vna}`);
  console.log(`    - Bad county depts:    ${stats.removed.countyDept}`);
  console.log(`    - State dupes:         ${stats.removed.stateDupe}`);
  console.log(`    - Generic no-contact:  ${stats.removed.genericOnly}`);
  console.log(`  Kept:                   ${stats.kept}`);
  console.log('═══════════════════════════════════════════════');

  if (DRY_RUN) {
    console.log('\n  Run with --apply to execute the cleanup.');
  }

  // CSV report
  if (REPORT) {
    const csvPath = path.join(__dirname, 'verification-report.csv');
    const header = 'file,city,state,name,type,hasPhone,hasWebsite,status,reason';
    const rows = report.map(r =>
      `"${r.file}","${r.city}","${r.state}","${r.name.replace(/"/g, '""')}","${r.type}",${r.hasPhone},${r.hasWebsite},${r.status},"${r.reason}"`
    );
    fs.writeFileSync(csvPath, [header, ...rows].join('\n'));
    console.log(`\n  Report written to: ${csvPath}`);
  }
}

run();
