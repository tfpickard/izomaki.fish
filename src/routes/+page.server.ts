import { sql } from '$lib/server/db';
import { generateInitFrame, generateEvolvedFrame } from '$lib/server/generation';
import { updatePresence } from '$lib/server/presence';
import { getOrAssignNeighbors } from '$lib/server/neighbors';
import { getMaxCreaturesPerUser } from '$lib/server/settings';
import type { UserProfile } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    return { creature: null, allCreatures: [], frames: [], neighbors: [], profile: null, maxCreatures: 3 };
  }

  const { rows: allCreatureRows } = await sql`
    SELECT id, created_at, generation_count, last_generated_at, next_generation_at, display_order, last_seen_at
    FROM creatures
    WHERE user_id = ${user.id}
    ORDER BY display_order ASC
  `;

  const maxCreatures = await getMaxCreaturesPerUser();

  if (allCreatureRows.length === 0) {
    return { creature: null, allCreatures: [], frames: [], neighbors: [], profile: null, maxCreatures };
  }

  const creature = allCreatureRows[0];

  const { rows: frameRows } = await sql`
    SELECT id, ascii, weights, generation_index, created_at
    FROM frames
    WHERE creature_id = ${creature.id}
    ORDER BY created_at ASC
  `;

  if (frameRows.length === 0) {
    generateInitFrame(creature.id).catch(() => {});
  } else if (creature.next_generation_at && new Date(creature.next_generation_at) <= new Date()) {
    generateEvolvedFrame(creature.id).catch(() => {});
  }

  await updatePresence(user.id);
  const neighbors = await getOrAssignNeighbors(user.id);

  const { rows: profileRows } = await sql`
    SELECT handle, bio, links, bio_answers FROM users WHERE id = ${user.id}
  `;
  const pr = profileRows[0];
  const profile: UserProfile = {
    handle: pr?.handle ?? null,
    bio: pr?.bio ?? null,
    links: pr?.links ?? {},
    bioAnswers: pr?.bio_answers ?? {}
  };

  const allCreatures = await Promise.all(
    allCreatureRows.map(async (c: typeof creature) => {
      if (c.id === creature.id) {
        return { ...c, frames: frameRows };
      }
      const { rows: secFrames } = await sql`
        SELECT id, ascii, weights, generation_index, created_at
        FROM frames WHERE creature_id = ${c.id}
        ORDER BY created_at ASC
      `;
      return { ...c, frames: secFrames };
    })
  );

  return { creature, allCreatures, frames: frameRows, neighbors, profile, maxCreatures };
};
