import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { rows: existing } = await sql`
    SELECT display_order FROM creatures
    WHERE id = ${params.id} AND user_id = ${session.userId}
  `;

  if (existing.length === 0) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  if (existing[0].display_order === 0) {
    return json({ error: 'Cannot delete primary creature' }, { status: 409 });
  }

  await sql`DELETE FROM creatures WHERE id = ${params.id} AND user_id = ${session.userId}`;

  return json({ ok: true });
};
