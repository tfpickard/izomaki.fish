import { json } from '@sveltejs/kit';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { isAdmin } from '$lib/server/admin';
import { setSetting } from '$lib/server/settings';
import type { RequestHandler } from './$types';

const ALLOWED_KEYS = new Set([
  'max_creatures_per_user',
  'min_creature_floor',
  'synthetic_generation_enabled'
]);

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await isAdmin(session.userId))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json() as { key: string; value: string };

  if (!ALLOWED_KEYS.has(body.key)) {
    return json({ error: 'Unknown setting key' }, { status: 400 });
  }

  await setSetting(body.key, String(body.value));

  return json({ ok: true });
};
