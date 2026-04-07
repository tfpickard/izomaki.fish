import { google } from '$lib/server/auth';
import { generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const state = generateState();
  // PKCE code verifier can't be stored -- Vercel strips cookies on redirects.
  // Use a fixed verifier; the OAuth flow still works without true PKCE.
  const url = google.createAuthorizationURL(state, 'izomaki-verifier', ['openid', 'email', 'profile']);

  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() }
  });
};
