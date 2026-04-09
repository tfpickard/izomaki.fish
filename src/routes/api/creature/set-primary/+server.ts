import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: { creatureId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { creatureId } = body;
  if (typeof creatureId !== 'string' || !creatureId) {
    return json({ error: 'creatureId required' }, { status: 400 });
  }

  const { rows } = await sql`
    SELECT id FROM creatures
    WHERE user_id = ${session.userId}
    ORDER BY display_order ASC
  `;

  const target = rows.find(r => r.id === creatureId);
  if (!target) return json({ error: 'Not found' }, { status: 404 });

  const ordered = [target, ...rows.filter(r => r.id !== creatureId)];

  for (let i = 0; i < ordered.length; i++) {
    await sql`UPDATE creatures SET display_order = ${i} WHERE id = ${ordered[i].id}`;
  }

  return json({ ok: true });
};
