import { sql } from '$lib/server/db';
import { generateInitFrame, generateEvolvedFrame } from '$lib/server/generation';
import { updatePresence } from '$lib/server/presence';
import { getOrAssignNeighbors } from '$lib/server/neighbors';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    return { creature: null, frames: [], neighbors: [] };
  }

  const { rows: creatureRows } = await sql`
    SELECT id, created_at, generation_count, last_generated_at, next_generation_at
    FROM creatures
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  if (creatureRows.length === 0) {
    return { creature: null, frames: [], neighbors: [] };
  }

  const creature = creatureRows[0];

  const { rows: frameRows } = await sql`
    SELECT id, ascii, weights, generation_index, created_at
    FROM frames
    WHERE creature_id = ${creature.id}
    ORDER BY created_at ASC
  `;

  // Trigger generation on page load if needed.
  if (frameRows.length === 0) {
    generateInitFrame(creature.id).catch(() => {});
  } else if (creature.next_generation_at && new Date(creature.next_generation_at) <= new Date()) {
    generateEvolvedFrame(creature.id).catch(() => {});
  }

  await updatePresence(user.id);
  const neighbors = await getOrAssignNeighbors(user.id);

  return { creature, frames: frameRows, neighbors };
};
