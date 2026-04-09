import { sql } from './db';

export async function getSetting(key: string): Promise<string | null> {
  const { rows } = await sql`
    SELECT value FROM admin_settings WHERE key = ${key}
  `;
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO admin_settings (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
  `;
}

export async function getMaxCreaturesPerUser(): Promise<number> {
  const val = await getSetting('max_creatures_per_user');
  const n = val ? parseInt(val, 10) : 3;
  return Number.isFinite(n) ? n : 3;
}

export async function getMinCreatureFloor(): Promise<number> {
  const val = await getSetting('min_creature_floor');
  const n = val ? parseInt(val, 10) : 25;
  return Number.isFinite(n) ? n : 25;
}
