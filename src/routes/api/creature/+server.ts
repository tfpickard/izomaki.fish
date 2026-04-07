import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
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

  const { rows } = await sql`
    SELECT c.id, c.created_at, c.generation_count, c.next_generation_at,
           COUNT(f.id)::int as frame_count
    FROM creatures c
    LEFT JOIN frames f ON f.creature_id = c.id
    WHERE c.user_id = ${session.userId}
    GROUP BY c.id
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No creature found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
