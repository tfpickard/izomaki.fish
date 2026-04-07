import { verifySessionToken } from '$lib/server/session';
import { getOrAssignNeighbors } from '$lib/server/neighbors';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('izomaki-session');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const neighbors = await getOrAssignNeighbors(session.userId);

  return new Response(JSON.stringify({ neighbors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
