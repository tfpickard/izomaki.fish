import { json } from '@sveltejs/kit';
import { getLandingData } from '$lib/server/landing';

export async function GET() {
  const data = await getLandingData();
  return json(data, {
    headers: { 'Cache-Control': 'public, max-age=30' }
  });
}
