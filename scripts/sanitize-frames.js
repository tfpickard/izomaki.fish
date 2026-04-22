#!/usr/bin/env node
// Run with: node --env-file=.env scripts/sanitize-frames.js
// Or:       POSTGRES_URL=... node scripts/sanitize-frames.js
//
// Applies the same sanitization logic as generation.ts to all existing frames.
// Strips prose lines and code fences. Updates rows where the sanitized result differs.

import pg from 'pg';

const { Client } = pg;

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error('POSTGRES_URL is not set. Run with --env-file=.env or set it in your environment.');
  process.exit(1);
}

function looksLikeText(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  const nonSpace = trimmed.replace(/\s/g, '');
  if (nonSpace.length === 0) return false;
  const letters = (nonSpace.match(/[a-zA-Z]/g) ?? []).length;
  return letters / nonSpace.length > 0.65 && /[a-z]{2,}\s+[a-z]/i.test(trimmed);
}

function sanitizeAscii(raw) {
  return raw
    .split('\n')
    .filter(line => !/^```[\w]*$/.test(line.trim()))
    .filter(line => !looksLikeText(line))
    .slice(0, 50)
    .map(line => line.slice(0, 80))
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query('SELECT id, ascii FROM frames');
console.log(`Checking ${rows.length} frames...`);

let sanitized = 0;
for (const row of rows) {
  const clean = sanitizeAscii(row.ascii);
  if (clean !== row.ascii) {
    await client.query('UPDATE frames SET ascii = $1 WHERE id = $2', [clean, row.id]);
    sanitized++;
  }
}

console.log(`Done. Sanitized ${sanitized} / ${rows.length} frames.`);
await client.end();
