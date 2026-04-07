import { google } from '$lib/server/auth';
import { dev } from '$app/environment';
import { generateCodeVerifier, generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile']);

  // Store code verifier in cookie for PKCE validation on callback.
  // State validation is skipped -- Vercel strips Set-Cookie from redirects
  // and cookies don't persist through the OAuth flow.
  cookies.set('google-code-verifier', codeVerifier, {
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    path: '/',
    maxAge: 600
  });

  return new Response(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${url.toString()}"></head><body></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
};
