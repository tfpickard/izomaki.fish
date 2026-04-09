import { sql } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin';
import { getSetting } from '$lib/server/settings';
import { getSyntheticUserCount, getSyntheticCreatureCount } from '$lib/server/synthetic';
import type { PageServerLoad } from './$types';

function parseIntSafe(val: string | null, fallback: number): number {
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    redirect(302, '/');
  }

  if (!(await isAdmin(user.id))) {
    redirect(302, '/');
  }

  const { rows: creatureRows } = await sql`
    SELECT id, created_at, generation_count, last_generated_at, next_generation_at
    FROM creatures
    WHERE user_id = ${user.id}
    LIMIT 1
  `;

  const [frameResult, syntheticUsers, syntheticCreatures, maxVal, minVal] = await Promise.all([
    creatureRows.length > 0
      ? sql`
          SELECT id, ascii, weights, generation_index, created_at
          FROM frames
          WHERE creature_id = ${creatureRows[0].id}
          ORDER BY created_at DESC
        `
      : Promise.resolve({ rows: [] }),
    getSyntheticUserCount(),
    getSyntheticCreatureCount(),
    getSetting('max_creatures_per_user'),
    getSetting('min_creature_floor')
  ]);

  return {
    creature: creatureRows[0] ?? null,
    frames: frameResult.rows,
    syntheticUsers,
    syntheticCreatures,
    maxCreaturesPerUser: parseIntSafe(maxVal, 3),
    minCreatureFloor: parseIntSafe(minVal, 25)
  };
};
