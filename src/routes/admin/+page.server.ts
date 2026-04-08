import { sql } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

const ADMIN_GITHUB_ID = '45548991';
import { getSetting } from '$lib/server/settings';
import { getSyntheticUserCount, getSyntheticCreatureCount } from '$lib/server/synthetic';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    redirect(302, '/');
  }

  const { rows: userRows } = await sql`
    SELECT provider, provider_id FROM users WHERE id = ${user.id}
  `;

  if (userRows.length === 0 || !(userRows[0].provider === 'github' && userRows[0].provider_id === ADMIN_GITHUB_ID)) {
    redirect(302, '/');
  }

  const { rows: creatureRows } = await sql`
    SELECT id, created_at, generation_count, last_generated_at, next_generation_at
    FROM creatures
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  if (creatureRows.length === 0) {
    return { creature: null, frames: [], syntheticUsers: 0, syntheticCreatures: 0, maxCreaturesPerUser: 3, minCreatureFloor: 25 };
  }

  const creature = creatureRows[0];

  const [frameResult, syntheticUsers, syntheticCreatures, maxVal, minVal] = await Promise.all([
    sql`
      SELECT id, ascii, weights, generation_index, created_at
      FROM frames
      WHERE creature_id = ${creature.id}
      ORDER BY created_at DESC
    `,
    getSyntheticUserCount(),
    getSyntheticCreatureCount(),
    getSetting('max_creatures_per_user'),
    getSetting('min_creature_floor')
  ]);

  return {
    creature,
    frames: frameResult.rows,
    syntheticUsers,
    syntheticCreatures,
    maxCreaturesPerUser: maxVal ? parseInt(maxVal, 10) : 3,
    minCreatureFloor: minVal ? parseInt(minVal, 10) : 25
  };
};
