import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { sanitizeAscii } from '$lib/server/generation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

  let body: { ascii?: string };
  try {
    body = await request.json() as { ascii?: string };
  } catch {
    return json({ error: 'Malformed JSON' }, { status: 400 });
  }

  if (typeof body.ascii !== 'string') {
    return json({ error: 'ascii is required' }, { status: 400 });
  }

  const clean = sanitizeAscii(body.ascii);

  const { rows } = await sql`
    UPDATE frames
    SET ascii = ${clean}
    WHERE id = ${params.id}
      AND creature_id IN (
        SELECT id FROM creatures WHERE user_id = ${session.userId}
      )
    RETURNING id
  `;

  if (rows.length === 0) return json({ error: 'Not found' }, { status: 404 });
  return json({ ok: true });
};
