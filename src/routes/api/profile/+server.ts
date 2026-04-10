import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { QUESTIONS, questionId } from '$lib/data/questions';
import type { RequestHandler } from './$types';
import type { UserProfile } from '$lib/types';

function getSession(cookies: Parameters<RequestHandler>[0]['cookies']) {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;
  return verifySessionToken(token);
}

const VALID_QUESTION_IDS = new Set(QUESTIONS.map((_, i) => questionId(i)));

export const GET: RequestHandler = async ({ cookies }) => {
  const session = getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { rows } = await sql`
    SELECT handle, bio, links, bio_answers FROM users WHERE id = ${session.userId}
  `;

  if (rows.length === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const row = rows[0];
  const profile: UserProfile = {
    handle: row.handle ?? null,
    bio: row.bio ?? null,
    links: row.links ?? {},
    bioAnswers: row.bio_answers ?? {}
  };

  return json(profile);
};

export const PUT: RequestHandler = async ({ cookies, request }) => {
  const session = getSession(cookies);
  if (!session) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json() as Partial<UserProfile> & { bioAnswers?: Record<string, string> };

  const handle = typeof body.handle === 'string' ? body.handle.trim().slice(0, 32) || null : undefined;
  const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 160) || null : undefined;
  const links = body.links !== undefined ? body.links : undefined;

  if (body.bioAnswers !== undefined) {
    const raw = body.bioAnswers;
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return new Response(JSON.stringify({ error: 'Invalid bioAnswers' }), { status: 400 });
    }
    const validated: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!VALID_QUESTION_IDS.has(k)) {
        return new Response(JSON.stringify({ error: `Unknown question id: ${k}` }), { status: 400 });
      }
      if (typeof v !== 'string') {
        return new Response(JSON.stringify({ error: `Answer must be a string` }), { status: 400 });
      }
      validated[k] = v.trim().slice(0, 280);
    }

    // Merge into existing answers rather than replacing
    await sql`
      UPDATE users SET
        bio_answers = COALESCE(bio_answers, '{}'::jsonb) || ${JSON.stringify(validated)}::jsonb
      WHERE id = ${session.userId}
    `;
  }

  if (handle !== undefined || bio !== undefined || links !== undefined) {
    await sql`
      UPDATE users SET
        handle = COALESCE(${handle ?? null}::text, handle),
        bio    = COALESCE(${bio ?? null}::text, bio),
        links  = COALESCE(${links !== undefined ? JSON.stringify(links) : null}::jsonb, links)
      WHERE id = ${session.userId}
    `;
  }

  return json({ ok: true });
};
