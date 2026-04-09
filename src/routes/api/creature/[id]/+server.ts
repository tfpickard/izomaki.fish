import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await sql`
    DELETE FROM creatures
    WHERE id = ${params.id}
      AND user_id = ${session.userId}
      AND display_order != 0
    RETURNING id
  `;

  if (rows.length === 0) {
    return json({ error: 'Not found or is primary creature' }, { status: 400 });
  }

  return json({ ok: true });
};
