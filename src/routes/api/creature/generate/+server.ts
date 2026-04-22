import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { generateEvolvedFrame } from '$lib/server/generation';
import { isAdmin } from '$lib/server/admin';
import type { RequestHandler } from './$types';

const RATE_LIMIT_MS = 5 * 60 * 1000;

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await sql`
    SELECT id, last_generated_at FROM creatures
    WHERE user_id = ${session.userId}
    ORDER BY display_order ASC
    LIMIT 1
  `;

  if (rows.length === 0) {
    return json({ error: 'No creature found' }, { status: 404 });
  }

  const creature = rows[0];
  const adminUser = await isAdmin(session.userId);

  if (!adminUser && creature.last_generated_at) {
    const elapsed = Date.now() - new Date(creature.last_generated_at).getTime();
    if (elapsed < RATE_LIMIT_MS) {
      const retryAfter = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return json({ error: 'Rate limited', retryAfter }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) }
      });
    }
  }

  await generateEvolvedFrame(creature.id);

  return json({ ok: true });
};
