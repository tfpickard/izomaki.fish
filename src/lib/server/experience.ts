import { sql } from './db';
import type { StateVector, AttractorState, CelestialState, ExperienceSummary } from '$lib/engine/types';

export type { ExperienceSummary };

export async function logExperience(
  creatureId: string,
  attractor: AttractorState,
  celestial: CelestialState,
  state: StateVector
): Promise<void> {
  await sql`
    INSERT INTO experience_log (id, creature_id, attractor_x, attractor_y, attractor_z, celestial_sun, celestial_moon, state_snapshot)
    VALUES (
      ${crypto.randomUUID()},
      ${creatureId},
      ${attractor.x},
      ${attractor.y},
      ${attractor.z},
      ${celestial.sun},
      ${celestial.moon},
      ${JSON.stringify(state)}
    )
  `;
}

export async function getExperienceSummary(creatureId: string): Promise<ExperienceSummary> {
  const { rows } = await sql`
    SELECT
      COUNT(*)::int as total_logs,
      COALESCE(AVG(attractor_x), 0) as avg_x,
      COALESCE(AVG(attractor_y), 0) as avg_y,
      COALESCE(AVG(attractor_z), 0) as avg_z,
      COALESCE(STDDEV(attractor_x), 0) as std_x,
      COALESCE(STDDEV(attractor_y), 0) as std_y,
      COALESCE(STDDEV(attractor_z), 0) as std_z
    FROM experience_log
    WHERE creature_id = ${creatureId}
  `;

  const row = rows[0];
  return {
    total_logs: Number(row.total_logs),
    avg_x: Number(row.avg_x),
    avg_y: Number(row.avg_y),
    avg_z: Number(row.avg_z),
    std_x: Number(row.std_x),
    std_y: Number(row.std_y),
    std_z: Number(row.std_z)
  };
}
