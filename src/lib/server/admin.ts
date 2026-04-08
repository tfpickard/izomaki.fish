import { sql } from './db';

const ADMIN_GITHUB_ID = '45548991';

export async function isAdmin(userId: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM users
    WHERE id = ${userId} AND provider = 'github' AND provider_id = ${ADMIN_GITHUB_ID}
  `;
  return rows.length > 0;
}
