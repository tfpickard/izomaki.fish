import { google } from '$lib/server/auth';
import { dev } from '$app/environment';
import { generateCodeVerifier, generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);

  const secure = dev ? '' : ' Secure;';
  const headers = new Headers();
  headers.set('Location', url.toString());
  headers.append('Set-Cookie', `google-oauth-state=${state}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=600`);
  headers.append('Set-Cookie', `google-code-verifier=${codeVerifier}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=600`);

  return new Response(null, { status: 302, headers });
};
