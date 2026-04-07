import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { logExperience } from '$lib/server/experience';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
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
    SELECT id FROM creatures WHERE user_id = ${session.userId}
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No creature found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.json();
  await logExperience(rows[0].id, body.attractor, body.celestial, body.state);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
