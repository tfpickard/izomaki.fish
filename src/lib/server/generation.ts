import Anthropic from '@anthropic-ai/sdk';
import { sql } from './db';
import type { StateVector } from '$lib/engine/types';

const client = new Anthropic();

const INIT_PROMPT = `Generate an ASCII art critter which is impossible to identify.`;

const EVOLVE_PROMPT_TEMPLATE = `Generate one animation variant for this critter:
---
{ascii}
---
The variant is derived from the original frame but depicts a single snapshot of organic movement — a limb shifted, a lean in some direction, an expression change, a step mid-stride, or any combination of these. It should look like a freeze-frame of the creature caught in the middle of doing something it does naturally.
The variant must be recognizably the same creature as the original. Same proportions, same character vocabulary, same general silhouette. What changes is posture, not identity.
If the critter has a face (or something that functions like one), the expression may shift. If it has limbs (or appendages, tendrils, fins — whatever it has), they may be in a different position. If it has a body axis, it may be leaning or tilted. The movement should feel involuntary — a thing the creature does because it's alive, not because it was told to.
Use the same spacing convention as the original frame (dots as visible spacers if needed).`;

export async function generateInitFrame(creatureId: string): Promise<void> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: INIT_PROMPT }],
    system: 'Respond with only ASCII art. No explanation. No markdown code fences. No preamble. Just the ASCII art.'
  });

  const ascii = extractText(response);
  const weights = generateRandomWeights();

  await sql`
    INSERT INTO frames (id, creature_id, ascii, weights, generation_index, parent_frame_id)
    VALUES (
      ${crypto.randomUUID()},
      ${creatureId},
      ${ascii},
      ${JSON.stringify(weights)},
      0,
      NULL
    )
  `;

  await updateGenerationSchedule(creatureId);
}

export async function generateEvolvedFrame(creatureId: string): Promise<void> {
  const { rows } = await sql`
    SELECT id, ascii, weights FROM frames
    WHERE creature_id = ${creatureId}
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (rows.length === 0) {
    await generateInitFrame(creatureId);
    return;
  }

  const parent = rows[0];
  const prompt = EVOLVE_PROMPT_TEMPLATE.replace('{ascii}', parent.ascii);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
    system: 'Respond with only ASCII art. No explanation. No markdown code fences. No preamble. Just the ASCII art.'
  });

  const ascii = extractText(response);
  const parentWeights = parent.weights as StateVector;
  const weights = deriveWeights(parentWeights);

  const { rows: countRows } = await sql`
    SELECT COUNT(*) as count FROM frames WHERE creature_id = ${creatureId}
  `;
  const generationIndex = parseInt(countRows[0].count);

  await sql`
    INSERT INTO frames (id, creature_id, ascii, weights, generation_index, parent_frame_id)
    VALUES (
      ${crypto.randomUUID()},
      ${creatureId},
      ${ascii},
      ${JSON.stringify(weights)},
      ${generationIndex},
      ${parent.id}
    )
  `;

  await updateGenerationSchedule(creatureId);
}

export async function updateGenerationSchedule(creatureId: string): Promise<void> {
  const { rows } = await sql`
    SELECT generation_count FROM creatures WHERE id = ${creatureId}
  `;

  if (rows.length === 0) return;

  const BASE_INTERVAL_MS = 2 * 60 * 60 * 1000;
  const MAX_INTERVAL_MS = 64 * 60 * 60 * 1000;

  const count = rows[0].generation_count;
  const interval = Math.min(BASE_INTERVAL_MS * Math.pow(2, count), MAX_INTERVAL_MS);
  const nextAt = new Date(Date.now() + interval);

  await sql`
    UPDATE creatures
    SET generation_count = generation_count + 1,
        last_generated_at = NOW(),
        next_generation_at = ${nextAt.toISOString()}
    WHERE id = ${creatureId}
  `;
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

function generateRandomWeights(): StateVector {
  return {
    wakefulness: Math.random(),
    contentment: Math.random(),
    curiosity: Math.random(),
    agitation: Math.random(),
    hunger: Math.random(),
    presence: Math.random()
  };
}

function deriveWeights(parent: StateVector): StateVector {
  const drift = 0.15;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return {
    wakefulness: clamp(parent.wakefulness + (Math.random() - 0.5) * drift * 2),
    contentment: clamp(parent.contentment + (Math.random() - 0.5) * drift * 2),
    curiosity: clamp(parent.curiosity + (Math.random() - 0.5) * drift * 2),
    agitation: clamp(parent.agitation + (Math.random() - 0.5) * drift * 2),
    hunger: clamp(parent.hunger + (Math.random() - 0.5) * drift * 2),
    presence: clamp(parent.presence + (Math.random() - 0.5) * drift * 2)
  };
}
