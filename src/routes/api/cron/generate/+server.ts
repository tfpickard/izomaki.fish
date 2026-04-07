import { env } from '$env/dynamic/private';
import { processScheduledGenerations } from '$lib/server/scheduler';
import { sql } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  const auth = request.headers.get('authorization');
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await processScheduledGenerations();

  await sql`
    UPDATE creatures SET is_active = false
    WHERE last_seen_at < NOW() - INTERVAL '7 days'
    AND is_active = true
  `;

  await sql`DELETE FROM neighbors WHERE expires_at < NOW()`;

  return new Response('ok');
};
