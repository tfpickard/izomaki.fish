import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { getMaxCreaturesPerUser } from '$lib/server/settings';
import { generateInitFrame } from '$lib/server/generation';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const maxCreatures = await getMaxCreaturesPerUser();

  const { rows } = await sql`
    SELECT COUNT(*)::int as count, COALESCE(MAX(display_order), -1) as max_order
    FROM creatures WHERE user_id = ${session.userId}
  `;

  const currentCount = rows[0]?.count ?? 0;
  if (currentCount >= maxCreatures) {
    return json({ error: `Maximum ${maxCreatures} creatures allowed` }, { status: 400 });
  }

  const nextOrder = (rows[0]?.max_order ?? -1) + 1;
  const creatureId = crypto.randomUUID();
  await sql`
    INSERT INTO creatures (id, user_id, display_order)
    VALUES (${creatureId}, ${session.userId}, ${nextOrder})
  `;

  generateInitFrame(creatureId).catch(() => {});

  return json({ creatureId });
};
