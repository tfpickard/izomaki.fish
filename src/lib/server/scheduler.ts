import { sql } from './db';
import { generateEvolvedFrame, updateGenerationSchedule } from './generation';

export { updateGenerationSchedule };

const BASE_INTERVAL_MS = 2 * 60 * 60 * 1000;
const MAX_INTERVAL_MS = 64 * 60 * 60 * 1000;

export async function processScheduledGenerations(): Promise<void> {
  const { rows } = await sql`
    SELECT c.id FROM creatures c
    WHERE c.next_generation_at IS NOT NULL
    AND c.next_generation_at <= NOW()
  `;

  for (const row of rows) {
    await generateEvolvedFrame(row.id);
  }
}

export function getNextGenerationTime(generationCount: number): number {
  return Math.min(BASE_INTERVAL_MS * Math.pow(2, generationCount), MAX_INTERVAL_MS);
}
