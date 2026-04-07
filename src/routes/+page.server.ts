import { sql } from '$lib/server/db';
import { generateEvolvedFrame } from '$lib/server/generation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    return { creature: null, frames: [] };
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

  // Trigger scheduled generation on page load if due.
  // Replaces Vercel cron -- generation happens when the creature is visited.
  if (creature.next_generation_at && new Date(creature.next_generation_at) <= new Date()) {
    generateEvolvedFrame(creature.id).catch(() => {});
  }

  const { rows: frameRows } = await sql`
    SELECT id, ascii, weights, generation_index, created_at
    FROM frames
    WHERE creature_id = ${creature.id}
    ORDER BY created_at ASC
  `;

  return { creature, frames: frameRows };
};
