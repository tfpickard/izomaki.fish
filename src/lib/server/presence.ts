import { sql } from './db';

export async function updatePresence(userId: string): Promise<void> {
  await sql`
    UPDATE creatures SET last_seen_at = NOW(), is_active = true
    WHERE user_id = ${userId}
  `;
}

export async function getActiveCreatureCount(): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*) as count FROM creatures
    WHERE last_seen_at > NOW() - INTERVAL '10 minutes'
  `;
  return parseInt(rows[0].count);
}

export async function getTotalCreatureCount(): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*) as count FROM creatures
  `;
  return parseInt(rows[0].count);
}
