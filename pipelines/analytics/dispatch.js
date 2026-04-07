/**
 * Executor — Routes recommendations to target pipelines via dispatch files.
 *
 * SEO Content + Directory: writes JSON dispatch files to state/{businessId}/
 * Podcast: commits updated topic-weights.json to the content-autopilot repo
 *
 * Dispatch files only influence ordering/weighting — they never bypass quality checks.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./config');

function dispatch(recommendations) {
  const dispatched = [];

  // Group recommendations by target pipeline
  const byTarget = {};
  for (const rec of recommendations) {
    if (!byTarget[rec.target]) byTarget[rec.target] = [];
    byTarget[rec.target].push(rec);
  }

  const now = new Date().toISOString();

  // SEO Content dispatch
  if (byTarget['seo-content']) {
    const filePath = path.join(config.stateDir, 'analytics-dispatch.json');
    const payload = {
      dispatched_at: now,
      dispatched_by: 'analytics-team',
      business_id: config.businessId,
      instructions: byTarget['seo-content'].map(rec => ({
        type: rec.action,
        ...rec.params,
        reason: rec.why,
      })),
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    console.log(`  Dispatched to seo-content: ${filePath}`);
    dispatched.push({ target: 'seo-content', file: filePath, instructions: payload.instructions.length });
  }

  // Directory dispatch
  if (byTarget['directory']) {
    const filePath = path.join(config.stateDir, 'directory-dispatch.json');
    const payload = {
      dispatched_at: now,
      dispatched_by: 'analytics-team',
      business_id: config.businessId,
      instructions: byTarget['directory'].map(rec => ({
        type: rec.action,
        ...rec.params,
        reason: rec.why,
      })),
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    console.log(`  Dispatched to directory: ${filePath}`);
    dispatched.push({ target: 'directory', file: filePath, instructions: payload.instructions.length });
  }

  // Podcast / content-production dispatch via topic-weights.json
  if (byTarget['content-production']) {
    const podcastRepo = config._raw.org?.path?.replace('~', process.env.HOME);
    if (!podcastRepo) {
      console.warn('  Cannot dispatch to content-production: no org.path in business YAML');
    } else {
      const weightsPath = path.join(podcastRepo, 'ghl-podcast-pipeline/data/topic-weights.json');
      if (fs.existsSync(weightsPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
          const weights = existing.weights || {};

          // Apply recommendations
          for (const rec of byTarget['content-production']) {
            if (rec.action === 'adjust_topic_weights' && rec.params?.topics) {
              const multiplier = rec.params.direction === 'increase' ? 1.3 : 0.7;
              for (const topic of rec.params.topics) {
                weights[topic] = Math.round((weights[topic] || 1.0) * multiplier * 10) / 10;
              }
            }
          }

          const updated = {
            updated_by: 'analytics-team',
            updated_at: now,
            weights,
            reason: byTarget['content-production'].map(r => r.why).join('; '),
          };

          fs.writeFileSync(weightsPath, JSON.stringify(updated, null, 2));
          console.log(`  Updated topic weights: ${weightsPath}`);

          // Git commit + push so VPS picks it up
          try {
            const repoDir = path.join(podcastRepo, 'ghl-podcast-pipeline');
            execSync(`cd "${repoDir}" && git add data/topic-weights.json && git commit -m "analytics-team: update topic weights" && git push`, {
              stdio: 'pipe',
              timeout: 30000,
            });
            console.log('  Pushed topic-weights.json to remote');
          } catch (gitErr) {
            console.warn(`  Git push failed (VPS will pick up on next pull): ${gitErr.message}`);
          }

          dispatched.push({ target: 'content-production', file: weightsPath, instructions: byTarget['content-production'].length });
        } catch (e) {
          console.warn(`  Could not update topic weights: ${e.message}`);
        }
      } else {
        console.warn(`  topic-weights.json not found at ${weightsPath}`);
      }
    }
  }

  if (dispatched.length === 0) {
    console.log('  No dispatches this run (no high-confidence actionable recommendations)');
  }

  return dispatched;
}

module.exports = { dispatch };
