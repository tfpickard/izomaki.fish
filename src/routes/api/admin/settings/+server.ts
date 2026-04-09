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

const NUMERIC_KEYS = new Set(['max_creatures_per_user', 'min_creature_floor']);
const BOOLEAN_KEYS = new Set(['synthetic_generation_enabled']);

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await isAdmin(session.userId))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { key: string; value: string };
  try {
    const raw = await request.json();
    if (typeof raw?.key !== 'string' || typeof raw?.value !== 'string') {
      return json({ error: 'Invalid body' }, { status: 400 });
    }
    body = raw as { key: string; value: string };
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!ALLOWED_KEYS.has(body.key)) {
    return json({ error: 'Unknown setting key' }, { status: 400 });
  }

  if (NUMERIC_KEYS.has(body.key)) {
    const n = parseInt(body.value, 10);
    if (!Number.isFinite(n) || n < 1) {
      return json({ error: 'Invalid value for numeric setting' }, { status: 400 });
    }
  } else if (BOOLEAN_KEYS.has(body.key)) {
    if (body.value !== 'true' && body.value !== 'false') {
      return json({ error: 'Invalid value for boolean setting' }, { status: 400 });
    }
  }

  await setSetting(body.key, body.value);

  return json({ ok: true });
};
