import { json } from '@sveltejs/kit';
import { sql, db } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  let creatureId: string;
  try {
    const body = await request.json() as { creatureId?: unknown };
    if (typeof body?.creatureId !== 'string' || !body.creatureId) {
      return json({ error: 'Invalid creatureId' }, { status: 400 });
    }
    creatureId = body.creatureId;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { rows } = await sql`
    SELECT id FROM creatures
    WHERE user_id = ${session.userId}
    ORDER BY display_order ASC
  `;

  const target = rows.find(r => r.id === creatureId);
  if (!target) return json({ error: 'Not found' }, { status: 404 });

  const ordered = [target, ...rows.filter(r => r.id !== creatureId)];

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < ordered.length; i++) {
      await client.query(
        'UPDATE creatures SET display_order = $1 WHERE id = $2',
        [i, ordered[i].id]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  return json({ ok: true });
};
