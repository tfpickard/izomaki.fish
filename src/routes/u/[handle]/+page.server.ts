import { error } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { QUESTIONS, questionId } from '$lib/data/questions';
import type { PageServerLoad } from './$types';

interface UserRow {
  id: string;
  handle: string;
  bio: string | null;
  links: { website?: string; mastodon?: string; github?: string } | null;
  bio_answers: Record<string, string> | null;
}

interface CreatureRow {
  id: string;
  created_at: string;
  generation_count: number;
  attractor_type: string;
}

interface FrameRow {
  id: string;
  ascii: string;
  weights: unknown;
}

export const load: PageServerLoad = async ({ params }) => {
  const handle = params.handle;

  const { rows: userRows } = await sql<UserRow>`
    SELECT id, handle, bio, links, bio_answers
    FROM users
    WHERE lower(handle) = lower(${handle})
      AND is_synthetic = false
    LIMIT 1
  `;

  if (userRows.length === 0) {
    throw error(404, 'Not found');
  }

  const user = userRows[0];

  const { rows: creatureRows } = await sql<CreatureRow>`
    SELECT id, created_at, generation_count, attractor_type
    FROM creatures
    WHERE user_id = ${user.id}
      AND is_active = true
      AND is_synthetic = false
    ORDER BY display_order ASC
    LIMIT 1
  `;

  const creature = creatureRows[0] ?? null;

  let frames: FrameRow[] = [];
  if (creature) {
    const { rows: frameRows } = await sql<FrameRow>`
      SELECT id, ascii, weights
      FROM frames
      WHERE creature_id = ${creature.id}
      ORDER BY created_at ASC
    `;
    frames = frameRows;
  }

  const rawAnswers: Record<string, string> = user.bio_answers ?? {};
  const filledAnswers: { id: string; question: string; answer: string }[] = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    const id = questionId(i);
    const answer = rawAnswers[id];
    if (answer && answer.trim()) {
      filledAnswers.push({ id, question: String(QUESTIONS[i]), answer: answer.trim() });
    }
  }

  return {
    handle: user.handle,
    bio: user.bio,
    links: user.links ?? {},
    filledAnswers,
    creature,
    frames
  };
};
