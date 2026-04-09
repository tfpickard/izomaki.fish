import { json } from '@sveltejs/kit';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { isAdmin } from '$lib/server/admin';
import {
  spawnSyntheticUsers,
  getSyntheticUserCount,
  getSyntheticCreatureCount,
  purgeAllSynthetic
} from '$lib/server/synthetic';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await isAdmin(session.userId))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { action: unknown; count?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.action === 'spawn') {
    const count = Math.min(Math.max(1, Number(body.count) || 1), 50);
    await spawnSyntheticUsers(count);
  } else if (body.action === 'purge') {
    await purgeAllSynthetic();
  } else {
    return json({ error: 'Unknown action' }, { status: 400 });
  }

  const syntheticUsers = await getSyntheticUserCount();
  const syntheticCreatures = await getSyntheticCreatureCount();

  return json({ syntheticUsers, syntheticCreatures });
};
