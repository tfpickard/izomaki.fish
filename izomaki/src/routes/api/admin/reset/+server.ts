import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { generateInitFrame } from '$lib/server/generation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
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

  const creatureId = rows[0].id;

  await sql`DELETE FROM frames WHERE creature_id = ${creatureId}`;
  await sql`DELETE FROM experience_log WHERE creature_id = ${creatureId}`;
  await sql`
    UPDATE creatures
    SET generation_count = 0, last_generated_at = NULL, next_generation_at = NULL
    WHERE id = ${creatureId}
  `;

  await generateInitFrame(creatureId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
