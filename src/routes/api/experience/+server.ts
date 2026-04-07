import { sql } from '$lib/server/db';
import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import { logExperience } from '$lib/server/experience';
import type { AttractorState, CelestialState, StateVector } from '$lib/engine/types';
import type { RequestHandler } from './$types';

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function isAttractor(v: unknown): v is AttractorState {
  if (!v || typeof v !== 'object') return false;
  const a = v as Record<string, unknown>;
  return isNumber(a.x) && isNumber(a.y) && isNumber(a.z);
}

function isCelestial(v: unknown): v is CelestialState {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return isNumber(c.sun) && isNumber(c.moon);
}

function isStateVector(v: unknown): v is StateVector {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return ['wakefulness', 'contentment', 'curiosity', 'agitation', 'hunger', 'presence']
    .every(k => isNumber(s[k]));
}

export const POST: RequestHandler = async ({ request, cookies }) => {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!body || typeof body !== 'object') {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { attractor, celestial, state } = body as Record<string, unknown>;

  if (!isAttractor(attractor) || !isCelestial(celestial) || !isStateVector(state)) {
    return new Response(JSON.stringify({ error: 'Invalid body shape' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { rows } = await sql`
    SELECT id FROM creatures WHERE user_id = ${session.userId}
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'No creature found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await logExperience(rows[0].id, attractor, celestial, state);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
