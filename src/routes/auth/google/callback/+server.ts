import { google } from '$lib/server/auth';
import { sql } from '$lib/server/db';
import { createSessionToken, COOKIE_NAME } from '$lib/server/session';
import { generateInitFrame } from '$lib/server/generation';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    error(400, 'Missing authorization code');
  }

  const tokens = await google.validateAuthorizationCode(code, 'izomaki-verifier');
  const accessToken = tokens.accessToken();

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!profileResponse.ok) {
    error(502, 'Failed to fetch Google profile');
  }

  const profile = await profileResponse.json();

  if (!profile.sub) {
    error(502, 'Invalid Google profile response');
  }

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
  }

  const { rows: creatureRows } = await sql`
    SELECT id FROM creatures WHERE user_id = ${userId}
  `;

  if (creatureRows.length === 0) {
    const creatureId = crypto.randomUUID();
    await sql`
      INSERT INTO creatures (id, user_id)
      VALUES (${creatureId}, ${userId})
    `;

    generateInitFrame(creatureId).catch(() => {});
  }

  const token = createSessionToken(userId);
  const secure = dev ? '' : ' Secure;';
  const maxAge = 30 * 24 * 60 * 60;
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`;

  return new Response(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/"></head><body></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html', 'Set-Cookie': cookie } }
  );
};
