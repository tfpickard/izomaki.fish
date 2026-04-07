import { sql } from './db';
import type { NeighborCreature } from '$lib/types';

export type { NeighborCreature };

const NEIGHBOR_COUNT = 3;

interface CreatureRow {
  id: string;
  user_id: string;
  created_at: string;
  creature_id?: string;
}

export async function getOrAssignNeighbors(userId: string): Promise<NeighborCreature[]> {
  await sql`DELETE FROM neighbors WHERE expires_at < NOW()`;

  const { rows: existing } = await sql`
    SELECT n.creature_id, c.id, c.user_id, c.created_at
    FROM neighbors n
    JOIN creatures c ON c.id = n.creature_id
    WHERE n.user_id = ${userId}
    AND n.expires_at > NOW()
    ORDER BY n.assigned_at
  `;

  if (existing.length >= NEIGHBOR_COUNT) {
    return await hydrateNeighbors(existing.slice(0, NEIGHBOR_COUNT));
  }

  const existingIds = existing.map((r: CreatureRow) => r.creature_id ?? r.id);
  const needed = NEIGHBOR_COUNT - existing.length;

  const { rows: ownCreature } = await sql`
    SELECT id FROM creatures WHERE user_id = ${userId}
  `;

  if (ownCreature.length === 0) return [];

  const excludeIds = [...existingIds, ownCreature[0].id];

  const { rows } = await sql`
    SELECT id, user_id, created_at FROM creatures
    WHERE id != ALL(${excludeIds})
    AND is_active = true
    AND last_seen_at > NOW() - INTERVAL '7 days'
    ORDER BY RANDOM()
    LIMIT ${needed}
  `;
  const candidates = rows as CreatureRow[];

  let assigned = [...candidates];
  if (assigned.length < needed) {
    const allExclude = [...excludeIds, ...assigned.map((c: CreatureRow) => c.id)];
    const { rows: fallback } = await sql`
      SELECT id, user_id, created_at FROM creatures
      WHERE id != ALL(${allExclude})
      ORDER BY RANDOM()
      LIMIT ${needed - assigned.length}
    `;
    assigned = [...assigned, ...(fallback as CreatureRow[])];
  }

  for (const creature of assigned) {
    await sql`
      INSERT INTO neighbors (id, user_id, creature_id, assigned_at, expires_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${creature.id}, NOW(), NOW() + INTERVAL '4 hours')
      ON CONFLICT (user_id, creature_id) DO NOTHING
    `;
  }

  const allNeighbors = [...existing, ...assigned];
  return await hydrateNeighbors(allNeighbors.slice(0, NEIGHBOR_COUNT));
}

async function hydrateNeighbors(creatures: CreatureRow[]): Promise<NeighborCreature[]> {
  const result: NeighborCreature[] = [];

  for (const creature of creatures) {
    const creatureId = creature.creature_id ?? creature.id;

    const { rows: frames } = await sql`
      SELECT id, ascii, weights FROM frames
      WHERE creature_id = ${creatureId}
      ORDER BY created_at
    `;

    if (frames.length === 0) continue;

    const { rows: expRows } = await sql`
      SELECT
        COUNT(*) as total_logs,
        AVG(attractor_x) as avg_x,
        AVG(attractor_y) as avg_y,
        AVG(attractor_z) as avg_z,
        STDDEV(attractor_x) as std_x,
        STDDEV(attractor_y) as std_y,
        STDDEV(attractor_z) as std_z
      FROM experience_log
      WHERE creature_id = ${creatureId}
    `;

    result.push({
      creatureId,
      frames: frames.map((f: { id: string; ascii: string; weights: unknown }) => ({
        id: f.id,
        ascii: f.ascii,
        weights: f.weights
      })),
      experience: expRows[0] ?? null,
      createdAt: creature.created_at
    });
  }

  return result;
}
