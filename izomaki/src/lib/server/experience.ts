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

  return rows[0] as ExperienceSummary;
}
