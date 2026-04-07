import { github } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
  const state = crypto.randomUUID();

  const url = github.createAuthorizationURL(state, []);

  cookies.set('github-oauth-state', state, {
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10
  });

  redirect(302, url.toString());
};
