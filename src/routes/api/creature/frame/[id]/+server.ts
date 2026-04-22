import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await sql`
    SELECT f.id FROM frames f
    JOIN creatures c ON c.id = f.creature_id
    WHERE f.id = ${params.id} AND c.user_id = ${session.userId}
  `;
  if (rows.length === 0) return json({ error: 'Not found' }, { status: 404 });

  const body = await request.json() as { ascii?: string };
  if (typeof body.ascii !== 'string') {
    return json({ error: 'ascii is required' }, { status: 400 });
  }

  await sql`UPDATE frames SET ascii = ${body.ascii} WHERE id = ${params.id}`;
  return json({ ok: true });
};
