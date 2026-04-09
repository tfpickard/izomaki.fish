import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { RequestHandler } from './$types';
import type { UserProfile } from '$lib/types';

function getSession(cookies: Parameters<RequestHandler>[0]['cookies']) {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;
  return verifySessionToken(token);
}

export const GET: RequestHandler = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  const { rows } = await sql`
    SELECT handle, bio, links FROM users WHERE id = ${session.userId}
  `;

  if (rows.length === 0) return json({ error: 'Not found' }, { status: 404 });

  const row = rows[0];
  const profile: UserProfile = {
    handle: row.handle ?? null,
    bio: row.bio ?? null,
    links: row.links ?? {}
  };

  return json(profile);
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
  const session = getSession(cookies);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: Partial<UserProfile>;
  try {
    body = await request.json() as Partial<UserProfile>;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const handle = typeof body.handle === 'string' ? body.handle.trim().slice(0, 32) || null : undefined;
  const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 160) || null : undefined;
  const links = (body.links !== undefined && typeof body.links === 'object' && body.links !== null)
    ? body.links
    : undefined;

  await sql`
    UPDATE users SET
      handle = COALESCE(${handle ?? null}::text, handle),
      bio    = COALESCE(${bio ?? null}::text, bio),
      links  = COALESCE(${links !== undefined ? JSON.stringify(links) : null}::jsonb, links)
    WHERE id = ${session.userId}
  `;

  return json({ ok: true });
};
