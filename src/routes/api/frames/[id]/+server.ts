import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { rows: creatureRows } = await sql`
    SELECT id FROM creatures WHERE user_id = ${session.userId}
  `;

  if (creatureRows.length === 0) {
    return new Response(JSON.stringify({ error: 'No creature found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await sql`
    DELETE FROM frames
    WHERE id = ${params.id} AND creature_id = ${creatureRows[0].id}
  `;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
