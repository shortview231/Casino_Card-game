#!/usr/bin/env node
import fs from 'node:fs';

function usage() {
  console.error('Usage: node market-radar/compare-snapshots.mjs <old.json> <new.json>');
  process.exit(2);
}

if (process.argv.length !== 4) usage();

const oldSnap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const newSnap = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

function key(row) {
  return `${String(row.title ?? '').trim().toLowerCase()}::${String(row.creator ?? '').trim().toLowerCase()}`;
}

function compareRanked(oldRows = [], newRows = []) {
  const oldMap = new Map(oldRows.map((row) => [key(row), row]));
  const newMap = new Map(newRows.map((row) => [key(row), row]));

  const newEntries = [];
  const dropped = [];
  const movers = [];
  const persistent = [];

  for (const [k, row] of newMap) {
    const previous = oldMap.get(k);
    if (!previous) {
      newEntries.push(row);
      continue;
    }
    const delta = Number(previous.rank ?? previous.seed_rank ?? 0) - Number(row.rank ?? row.seed_rank ?? 0);
    const item = {
      title: row.title,
      creator: row.creator,
      old_rank: previous.rank ?? previous.seed_rank ?? null,
      new_rank: row.rank ?? row.seed_rank ?? null,
      delta,
    };
    persistent.push(item);
    if (delta !== 0) movers.push(item);
  }

  for (const [k, row] of oldMap) {
    if (!newMap.has(k)) dropped.push(row);
  }

  movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return { newEntries, dropped, movers, persistent };
}

function genreCounts(rows = []) {
  const out = {};
  for (const row of rows) {
    const genre = row.genre || 'Unknown';
    out[genre] = (out[genre] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function browserCount(rows = []) {
  return rows.filter((row) => row.browser_explicit === true).length;
}

function pricedCount(rows = []) {
  return rows.filter((row) => String(row.price_display || '').trim() !== '').length;
}

const report = {
  old_snapshot: oldSnap.snapshot_id,
  new_snapshot: newSnap.snapshot_id,
  captured_at: newSnap.captured_at,
  itch_top_sellers: {
    ...compareRanked(oldSnap.itch_top_sellers, newSnap.itch_top_sellers),
    old_genres: genreCounts(oldSnap.itch_top_sellers),
    new_genres: genreCounts(newSnap.itch_top_sellers),
    old_browser_explicit: browserCount(oldSnap.itch_top_sellers),
    new_browser_explicit: browserCount(newSnap.itch_top_sellers),
    old_priced_display: pricedCount(oldSnap.itch_top_sellers),
    new_priced_display: pricedCount(newSnap.itch_top_sellers),
  },
  itch_new_popular: {
    ...compareRanked(oldSnap.itch_new_popular, newSnap.itch_new_popular),
    old_genres: genreCounts(oldSnap.itch_new_popular),
    new_genres: genreCounts(newSnap.itch_new_popular),
    old_browser_explicit: browserCount(oldSnap.itch_new_popular),
    new_browser_explicit: browserCount(newSnap.itch_new_popular),
    old_priced_display: pricedCount(oldSnap.itch_new_popular),
    new_priced_display: pricedCount(newSnap.itch_new_popular),
  },
  newgrounds_popular: compareRanked(oldSnap.newgrounds_popular, newSnap.newgrounds_popular),
};

console.log(JSON.stringify(report, null, 2));
