/**
 * Content Changelog — Tracks every page change made by automated pipelines.
 * Path is configured per-business via the YAML config.
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

function getChangelogPath() {
  return config.CHANGELOG_PATH;
}

function load() {
  const p = getChangelogPath();
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
  }
  return [];
}

function save(entries) {
  const p = getChangelogPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(entries, null, 2));
}

function logChange({ page, action, detail, source }) {
  const entries = load();
  entries.push({
    page,
    action,
    detail,
    source,
    date: new Date().toISOString(),
  });
  save(entries);
}

function wasRecentlyModified(page, days = 21) {
  const entries = load();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return entries.some(e =>
    e.page === page && new Date(e.date) > cutoff
  );
}

function getChangesSince(date) {
  const entries = load();
  const since = new Date(date);
  return entries.filter(e => new Date(e.date) > since);
}

function getTodaysChanges() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getChangesSince(today);
}

module.exports = { logChange, wasRecentlyModified, getChangesSince, getTodaysChanges, load };
