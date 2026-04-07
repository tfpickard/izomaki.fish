import { github } from '$lib/server/auth';
import { sql } from '$lib/server/db';
import { createSessionToken, COOKIE_NAME } from '$lib/server/session';
import { generateInitFrame } from '$lib/server/generation';
import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('github-oauth-state');

  if (!code || !state || state !== storedState) {
    error(400, 'Invalid OAuth state');
  }

  cookies.delete('github-oauth-state', { path: '/' });

  const tokens = await github.validateAuthorizationCode(code);
  const accessToken = tokens.accessToken();

  const profileResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'izomaki'
    }
  });

  const profile = await profileResponse.json();

  const providerId = String(profile.id);
  const email = profile.email ?? null;
  const displayName = profile.login ?? null;

  let userId: string;

  const { rows: existing } = await sql`
    SELECT id FROM users WHERE provider = 'github' AND provider_id = ${providerId}
  `;

  if (existing.length > 0) {
    userId = existing[0].id;
  } else {
    userId = crypto.randomUUID();
    await sql`
      INSERT INTO users (id, provider, provider_id, email, display_name)
      VALUES (${userId}, 'github', ${providerId}, ${email}, ${displayName})
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
