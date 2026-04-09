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

  let body: { action: string; count?: number };
  try {
    const raw = await request.json();
    if (typeof raw?.action !== 'string') {
      return json({ error: 'Invalid body' }, { status: 400 });
    }
    body = raw as { action: string; count?: number };
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.action === 'spawn') {
    const rawCount = body.count;
    const count = (typeof rawCount === 'number' && Number.isFinite(rawCount))
      ? Math.min(Math.max(1, Math.floor(rawCount)), 50)
      : 1;
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
