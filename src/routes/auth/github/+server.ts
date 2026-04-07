import { github } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const state = crypto.randomUUID();
  const url = github.createAuthorizationURL(state, []);

  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() }
  });
};
