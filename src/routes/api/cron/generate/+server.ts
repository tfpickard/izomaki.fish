import { processScheduledGenerations } from '$lib/server/scheduler';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  // Vercel sets this header automatically on scheduled cron invocations.
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  // Allow manual triggers via ?secret=... for debugging.
  const url = new URL(request.url);
  const isManual = env.CRON_SECRET && url.searchParams.get('secret') === env.CRON_SECRET;

  if (!isVercelCron && !isManual) {
    return new Response('Unauthorized', { status: 401 });
  }

  await processScheduledGenerations();
  return new Response('OK', { status: 200 });
};
