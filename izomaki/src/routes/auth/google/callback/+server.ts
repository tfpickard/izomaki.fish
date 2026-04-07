import { google } from '$lib/server/auth';
import { sql } from '$lib/server/db';
import { createSessionToken, COOKIE_NAME } from '$lib/server/session';
import { generateInitFrame } from '$lib/server/generation';
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google-oauth-state');
  const codeVerifier = cookies.get('google-code-verifier');

  if (!code || !state || state !== storedState || !codeVerifier) {
    error(400, 'Invalid OAuth state');
  }

  cookies.delete('google-oauth-state', { path: '/' });
  cookies.delete('google-code-verifier', { path: '/' });

  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  const accessToken = tokens.accessToken();

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const profile = await profileResponse.json();

  const providerId = String(profile.sub);
  const email = profile.email ?? null;
  const displayName = profile.name ?? null;

  let userId: string;

  const { rows: existing } = await sql`
    SELECT id FROM users WHERE provider = 'google' AND provider_id = ${providerId}
  `;

  if (existing.length > 0) {
    userId = existing[0].id;
  } else {
    userId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, provider, provider_id, email, display_name)
      VALUES (${userId}, 'google', ${providerId}, ${email}, ${displayName})
    `;

    const creatureId = crypto.randomUUID();
    await sql`
      INSERT INTO creatures (id, user_id)
      VALUES (${creatureId}, ${userId})
    `;

    await generateInitFrame(creatureId);
  }

  const token = createSessionToken(userId);
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60
  });

  redirect(302, '/');
};
