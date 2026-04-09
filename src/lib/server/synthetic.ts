import { sql } from './db';
import { generateInitFrame } from './generation';

const SYNTHETIC_NAMES = [
  'Mori', 'Tanabe', 'Kusano', 'Ogata', 'Shimizu',
  'Nagai', 'Ueno', 'Kato', 'Hayashi', 'Fujita',
  'Watanabe', 'Endo', 'Aoki', 'Morita', 'Kuroda',
  'Takeda', 'Inoue', 'Nakano', 'Sasaki', 'Kimura',
  'Ishida', 'Yamada', 'Ota', 'Matsuo', 'Okada',
  'Sugiyama', 'Hasegawa', 'Murakami', 'Saito', 'Oishi',
  'Tamura', 'Fukuda', 'Nomura', 'Miyake', 'Hara',
  'Nishida', 'Kaneko', 'Tsuda', 'Iwata', 'Kubo',
  'Maruyama', 'Kondo', 'Uchida', 'Ozawa', 'Sakamoto',
  'Ikeda', 'Hirata', 'Nakata', 'Omori', 'Tsuji'
];

const ATTRACTOR_TYPES = ['chen-lee', 'sprott-b', 'aizawa', 'halvorsen', 'dadras', 'rossler'];

export async function spawnSyntheticUsers(count: number): Promise<string[]> {
  const createdIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const userId = crypto.randomUUID();
    const nameIndex = Math.floor(Math.random() * SYNTHETIC_NAMES.length);
    const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const displayName = `${SYNTHETIC_NAMES[nameIndex]}${suffix}`;

    await sql`
      INSERT INTO users (id, provider, provider_id, display_name, is_synthetic)
      VALUES (${userId}, 'synthetic', ${userId}, ${displayName}, true)
    `;

    const creatureId = crypto.randomUUID();
    const hoursOld = Math.floor(Math.random() * 720);
    const attractorType = ATTRACTOR_TYPES[Math.floor(Math.random() * ATTRACTOR_TYPES.length)];

    await sql`
      INSERT INTO creatures (id, user_id, is_synthetic, created_at, attractor_type)
      VALUES (${creatureId}, ${userId}, true, NOW() - (${hoursOld} || ' hours')::interval, ${attractorType})
    `;

    generateInitFrame(creatureId).catch((err: unknown) => {
      console.error('generateInitFrame failed for synthetic creature', creatureId, err);
    });

    createdIds.push(userId);
  }

  return createdIds;
}

export async function getSyntheticUserCount(): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*)::int as count FROM users WHERE is_synthetic = true
  `;
  return rows[0]?.count ?? 0;
}

export async function getSyntheticCreatureCount(): Promise<number> {
  const { rows } = await sql`
    SELECT COUNT(*)::int as count FROM creatures WHERE is_synthetic = true
  `;
  return rows[0]?.count ?? 0;
}

export async function purgeAllSynthetic(): Promise<void> {
  await sql`DELETE FROM users WHERE is_synthetic = true`;
}
