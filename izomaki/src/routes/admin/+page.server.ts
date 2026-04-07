import { sql } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    redirect(302, '/');
  }

  const { rows: creatureRows } = await sql`
    SELECT id, created_at, generation_count, last_generated_at, next_generation_at
    FROM creatures
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  if (creatureRows.length === 0) {
    return { creature: null, frames: [] };
  }

  const creature = creatureRows[0];

  const { rows: frameRows } = await sql`
    SELECT id, ascii, weights, generation_index, created_at
    FROM frames
    WHERE creature_id = ${creature.id}
    ORDER BY created_at DESC
  `;

  return { creature, frames: frameRows };
};
