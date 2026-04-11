import { sql } from './db';
import type { LandingCreatureData, PlatformStats } from '$lib/types';

interface CreatureRow {
  id: string;
  created_at: string;
  attractor_type: string;
}

interface FrameRow {
  id: string;
  ascii: string;
  weights: unknown;
}

interface StatsRow {
  total_creatures: string;
  total_frames: string;
  active_creatures: string;
  oldest_hours: string | null;
  avg_frames: string;
}

async function fetchCreatureFrames(id: string, attractorType: string): Promise<LandingCreatureData | null> {
  const { rows } = await sql<FrameRow>`
    SELECT id, ascii, weights FROM frames
    WHERE creature_id = ${id}
    ORDER BY created_at
  `;
  if (rows.length === 0) return null;
  return {
    creatureId: id,
    attractorType,
    frames: rows.map(f => ({ id: f.id, ascii: f.ascii, weights: f.weights }))
  };
}

export async function getLandingData(): Promise<{ creatures: LandingCreatureData[]; stats: PlatformStats }> {
  const { rows: creatureRows } = await sql<CreatureRow>`
    SELECT id, created_at, attractor_type FROM creatures
    WHERE is_active = true
      AND (last_seen_at > NOW() - INTERVAL '7 days' OR is_synthetic = true)
    ORDER BY RANDOM()
    LIMIT 12
  `;

  const { rows: statsRows } = await sql<StatsRow>`
    SELECT
      (SELECT COUNT(*) FROM creatures)::text AS total_creatures,
      (SELECT COUNT(*) FROM frames)::text AS total_frames,
      (SELECT COUNT(*) FROM creatures WHERE is_active = true AND last_seen_at > NOW() - INTERVAL '24 hours')::text AS active_creatures,
      EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 3600 AS oldest_hours,
      (SELECT CAST(COUNT(*) AS float) / NULLIF((SELECT COUNT(*) FROM creatures), 0) FROM frames)::text AS avg_frames
    FROM creatures
  `;

  const creatureResults = await Promise.all(
    creatureRows.map((r: CreatureRow) => fetchCreatureFrames(r.id, r.attractor_type))
  );

  const creatures = creatureResults.filter((c): c is LandingCreatureData => c !== null);

  const s = statsRows[0];
  const stats: PlatformStats = {
    totalCreatures: parseInt(s?.total_creatures ?? '0', 10),
    totalFrames: parseInt(s?.total_frames ?? '0', 10),
    activeCreatures: parseInt(s?.active_creatures ?? '0', 10),
    oldestCreatureAge: Math.round(parseFloat(s?.oldest_hours ?? '0')),
    avgFramesPerCreature: Math.round(parseFloat(s?.avg_frames ?? '0'))
  };

  return { creatures, stats };
}
