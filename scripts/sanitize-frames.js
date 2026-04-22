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

const client = new Client({ connectionString: url });
await client.connect();

const { rows } = await client.query('SELECT id, ascii FROM frames');
console.log(`Checking ${rows.length} frames...`);

const updates = [];
for (const row of rows) {
  const clean = sanitizeAscii(row.ascii);
  if (clean !== row.ascii) updates.push({ id: row.id, ascii: clean });
}

if (updates.length > 0) {
  const BATCH = 500;
  await client.query('BEGIN');
  try {
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      const values = [];
      const placeholders = batch.map((u, idx) => {
        values.push(u.id, u.ascii);
        const o = idx * 2;
        return `($${o + 1}::uuid, $${o + 2}::text)`;
      }).join(', ');
      await client.query(
        `UPDATE frames AS f SET ascii = v.ascii FROM (VALUES ${placeholders}) AS v(id, ascii) WHERE f.id = v.id`,
        values
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

console.log(`Done. Sanitized ${updates.length} / ${rows.length} frames.`);
await client.end();
