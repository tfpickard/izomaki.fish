import { verifySessionToken, COOKIE_NAME } from '$lib/server/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return { user: null };

  const session = verifySessionToken(token);
  if (!session) return { user: null };

  return { user: { id: session.userId } };
};
