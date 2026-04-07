import { COOKIE_NAME, verifySessionToken } from '$lib/server/session';
import { getOrAssignNeighbors } from '$lib/server/neighbors';
import type { RequestHandler } from './$types';

const unauthorized = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return unauthorized();

  const session = verifySessionToken(token);
  if (!session) return unauthorized();

  const neighbors = await getOrAssignNeighbors(session.userId);

  return new Response(JSON.stringify({ neighbors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
