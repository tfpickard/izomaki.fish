import { verifySessionToken } from '$lib/server/session';
import { updatePresence, getActiveCreatureCount, getTotalCreatureCount } from '$lib/server/presence';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('izomaki-session');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const session = verifySessionToken(token);
  if (!session) return new Response('Unauthorized', { status: 401 });

  await updatePresence(session.userId);

  const active = await getActiveCreatureCount();
  const total = await getTotalCreatureCount();

  return new Response(JSON.stringify({ active, total }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
