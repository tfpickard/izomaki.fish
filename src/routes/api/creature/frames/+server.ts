import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await sql`
    SELECT id FROM creatures
    WHERE user_id = ${session.userId}
    ORDER BY display_order ASC
    LIMIT 1
  `;
  if (rows.length === 0) return json({ error: 'No creature found' }, { status: 404 });

  const creatureId = rows[0].id;
  const { rowCount } = await sql`DELETE FROM frames WHERE creature_id = ${creatureId}`;

  return json({ ok: true, deleted: rowCount ?? 0 });
};
