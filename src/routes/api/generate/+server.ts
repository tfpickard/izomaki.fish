import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { generateEvolvedFrame } from '$lib/server/generation';
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
    SELECT id, last_generated_at FROM creatures WHERE user_id = ${session.userId}
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No creature found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const creature = rows[0];
  const fiveMinutes = 5 * 60 * 1000;

  if (creature.last_generated_at) {
    const lastGenTime = new Date(creature.last_generated_at).getTime();
    if (Date.now() - lastGenTime < fiveMinutes) {
      return new Response(JSON.stringify({ error: 'Rate limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  await generateEvolvedFrame(creature.id);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
