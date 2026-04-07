#!/usr/bin/env node
// Run with: node --env-file=.env scripts/migrate.js
// Or:       POSTGRES_URL=... node scripts/migrate.js

import { createClient } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(join(__dirname, '../src/lib/server/schema.sql'), 'utf8');

if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL is not set. Run with --env-file=.env or set it in your environment.');
  process.exit(1);
}

const client = createClient();
await client.connect();

console.log('Running schema migration...');

const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

for (const statement of statements) {
  try {
    await client.query(statement);
    const first = statement.slice(0, 60).replace(/\s+/g, ' ');
    console.log(`  ok: ${first}...`);
  } catch (err) {
    if (err.message?.includes('already exists')) {
      const first = statement.slice(0, 60).replace(/\s+/g, ' ');
      console.log(`  skip (exists): ${first}...`);
    } else {
      console.error(`  error: ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }
}

await client.end();
console.log('Migration complete.');
