import { COOKIE_NAME, verifySessionToken } from '$lib/server/session';
import { updatePresence, getActiveCreatureCount, getTotalCreatureCount } from '$lib/server/presence';
import type { RequestHandler } from './$types';

const unauthorized = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return unauthorized();

  const session = verifySessionToken(token);
  if (!session) return unauthorized();

  await updatePresence(session.userId);

  const active = await getActiveCreatureCount();
  const total = await getTotalCreatureCount();

  return new Response(JSON.stringify({ active, total }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
