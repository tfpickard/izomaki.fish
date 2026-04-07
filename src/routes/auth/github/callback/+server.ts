import { github } from '$lib/server/auth';
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

  const tokens = await github.validateAuthorizationCode(code);
  const accessToken = tokens.accessToken();

  const profileResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'izomaki'
    }
  });

  if (!profileResponse.ok) {
    error(502, 'Failed to fetch GitHub profile');
  }

  const profile = await profileResponse.json();

  if (!profile.id) {
    error(502, 'Invalid GitHub profile response');
  }

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
  const secure = dev ? '' : ' Secure;';
  const maxAge = 30 * 24 * 60 * 60;
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`;

  return new Response(
    `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/"></head><body></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html', 'Set-Cookie': cookie } }
  );
};
