import { github } from '$lib/server/auth';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const state = crypto.randomUUID();
  const url = github.createAuthorizationURL(state, []);

  const secure = dev ? '' : ' Secure;';
  const cookie = `github-oauth-state=${state}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=600`;

  return new Response(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url.toString()}"></head><body></body></html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': cookie
      }
    }
  );
};
