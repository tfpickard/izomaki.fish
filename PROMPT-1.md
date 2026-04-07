# Izomaki -- Phase 1 Implementation Spec

You are extending an existing SvelteKit application called Izomaki. Phase 0 is complete and working. Read this entire document before writing any code. Follow it exactly. Do not improvise. Do not add features beyond what is specified. Do not skip steps. Do not refactor existing file structure unless this document says to. Do not substitute libraries. If something is ambiguous, choose the simpler interpretation.

Phase 0 spec is in `PROMPT.md`. This document is `PROMPT-PHASE1.md`. Where this document contradicts Phase 0, this document wins.

---

## 1. Phase 1 Overview

Phase 1 adds:

1. **Backend persistence** -- Vercel Postgres database replaces localStorage
2. **Authentication** -- OAuth via GitHub and Google
3. **Multi-user** -- every authenticated user gets one creature
4. **LLM frame generation** -- creatures auto-generate their own ASCII art frames via Claude API
5. **Exponential backoff generation** -- frames generate on a schedule: 2h → 4h → 8h → 16h → 32h → ... with a manual force-generate button
6. **Life experience engine** -- accumulated attractor exposure permanently shapes the creature's response
7. **Attractor visualization** -- semi-transparent Lorenz butterfly rendered behind the creature
8. **1Hz animation** -- display updates once per second (up from 2s in Phase 0)
9. **Admin page** -- account management, creature reset/delete, frame management

---

## 2. New Dependencies

Install exactly these. Do not add others.

```bash
npm install @vercel/postgres
npm install @anthropic-ai/sdk
npm install arctic        # OAuth library
npm install oslo          # session/token utilities
```

Do not install an ORM. Use raw SQL with `@vercel/postgres`. Do not install a component library.

---

## 3. Database Schema

Create a migration file at `src/lib/server/schema.sql`. Run this against Vercel Postgres.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- crypto.randomUUID()
  provider TEXT NOT NULL,                 -- 'github' | 'google'
  provider_id TEXT NOT NULL,              -- OAuth provider user ID
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

CREATE TABLE creatures (
  id TEXT PRIMARY KEY,                    -- crypto.randomUUID()
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  generation_count INTEGER DEFAULT 0,    -- total frames generated
  last_generated_at TIMESTAMP,           -- timestamp of last frame generation
  next_generation_at TIMESTAMP,          -- scheduled next generation
  experience JSONB DEFAULT '{}',         -- accumulated life experience data
  UNIQUE(user_id)                        -- one creature per user
);

CREATE TABLE frames (
  id TEXT PRIMARY KEY,                    -- crypto.randomUUID()
  creature_id TEXT NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  ascii TEXT NOT NULL,
  weights JSONB NOT NULL,                -- StateVector as JSON
  generation_index INTEGER NOT NULL,     -- 0 = init frame, 1+ = evolved frames
  parent_frame_id TEXT REFERENCES frames(id),  -- null for init, parent id for evolved
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experience_log (
  id TEXT PRIMARY KEY,                    -- crypto.randomUUID()
  creature_id TEXT NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  attractor_x REAL NOT NULL,
  attractor_y REAL NOT NULL,
  attractor_z REAL NOT NULL,
  celestial_sun REAL NOT NULL,
  celestial_moon REAL NOT NULL,
  state_snapshot JSONB NOT NULL,          -- StateVector at time of log
  logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_frames_creature ON frames(creature_id);
CREATE INDEX idx_experience_creature ON experience_log(creature_id);
CREATE INDEX idx_creatures_next_gen ON creatures(next_generation_at);
```

Do not add tables. Do not rename columns. Do not change types.

---

## 4. Environment Variables

Required in `.env` and Vercel project settings:

```
POSTGRES_URL=                            # Vercel Postgres connection string
ANTHROPIC_API_KEY=                       # Claude API key
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SESSION_SECRET=                          # random 32+ char string for signing sessions
```

Do not hardcode any of these. Do not commit `.env`.

---

## 5. Updated File Structure

Keep all Phase 0 files. Add these new files and directories:

```
src/
  lib/
    server/
      db.ts                              -- database connection and query helpers
      schema.sql                         -- migration SQL (reference only)
      auth.ts                            -- OAuth setup (GitHub, Google)
      session.ts                         -- session management (cookies)
      generation.ts                      -- LLM frame generation logic
      scheduler.ts                       -- exponential backoff scheduling
      experience.ts                      -- life experience accumulation
    engine/
      (keep all Phase 0 files)
      experience.ts                      -- client-side experience modulation
      visualization.ts                   -- attractor visualization math
    stores/
      (keep all Phase 0 files)
      user.ts                            -- user/auth state
      visualization.ts                   -- attractor trail data
    components/
      (keep all Phase 0 files)
      AttractorVisualization.svelte      -- Lorenz butterfly canvas
      GenerationStatus.svelte            -- shows next gen time, force button
      LoginPage.svelte                   -- OAuth login buttons
      AdminPage.svelte                   -- admin controls
      CreatureInfo.svelte                -- creature metadata display
  routes/
    +page.svelte                         -- (update existing)
    +page.server.ts                      -- server load function
    +layout.svelte                       -- (update existing)
    +layout.server.ts                    -- session check
    auth/
      github/
        +server.ts                       -- GitHub OAuth redirect
        callback/
          +server.ts                     -- GitHub OAuth callback
      google/
        +server.ts                       -- Google OAuth redirect
        callback/
          +server.ts                     -- Google OAuth callback
      logout/
        +server.ts                       -- session destroy
    api/
      generate/
        +server.ts                       -- force-generate endpoint
      creature/
        +server.ts                       -- creature CRUD
      frames/
        +server.ts                       -- frame listing
      admin/
        reset/
          +server.ts                     -- reset creature
        delete/
          +server.ts                     -- delete account
    admin/
      +page.svelte                       -- admin page UI
      +page.server.ts                    -- admin page data
```

Do not add files beyond this list. Do not rename files.

---

## 6. Authentication (`src/lib/server/auth.ts`)

Use the `arctic` library for OAuth.

```ts
import { GitHub, Google } from 'arctic';

export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID!,
  process.env.GITHUB_CLIENT_SECRET!,
  null
);

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.ORIGIN + '/auth/google/callback'
);
```

Adjust constructor arguments to match the current `arctic` API. Do not add additional OAuth providers.

---

## 7. Session Management (`src/lib/server/session.ts`)

Use signed cookies for sessions. Store only the user ID.

```ts
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

const SECRET = env.SESSION_SECRET;
const COOKIE_NAME = 'izomaki-session';

export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifySessionToken(token: string): { userId: string } | null {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;
  const payload = Buffer.from(payloadB64, 'base64').toString();
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  if (signature !== expected) return null;
  const data = JSON.parse(payload);
  if (data.exp < Date.now()) return null;
  return { userId: data.userId };
}
```

Set the cookie with `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`, `maxAge: 30 * 24 * 60 * 60`.

---

## 8. Database (`src/lib/server/db.ts`)

```ts
import { sql } from '@vercel/postgres';

export { sql };
```

That is the entire file. Use `sql` tagged template literals for all queries. Do not abstract further. Do not build a query builder.

---

## 9. OAuth Routes

### `src/routes/auth/github/+server.ts`

On GET: generate OAuth state, store in cookie, redirect to GitHub authorization URL.

### `src/routes/auth/github/callback/+server.ts`

On GET: verify state, exchange code for token, fetch user profile from GitHub API, upsert into `users` table, create session cookie, create creature if none exists (call init generation), redirect to `/`.

### `src/routes/auth/google/+server.ts`

Same pattern as GitHub. Use Google's authorization URL.

### `src/routes/auth/google/callback/+server.ts`

Same pattern as GitHub callback. Fetch Google user profile via userinfo endpoint.

### `src/routes/auth/logout/+server.ts`

On POST: clear session cookie, redirect to `/`.

For all OAuth callbacks: when a new user is created, also create their creature and trigger initial frame generation immediately (do not wait for the backoff schedule).

---

## 10. LLM Frame Generation (`src/lib/server/generation.ts`)

This module generates ASCII art frames via the Claude API.

```ts
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
  // select a random existing frame as parent
  const { rows } = await sql`
    SELECT id, ascii FROM frames
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

  // derive weights from parent with random drift
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

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();
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
```

Do not change the prompts. Do not add prompt engineering beyond the system message. Do not use a different model without being asked.

---

## 11. Exponential Backoff Scheduler (`src/lib/server/scheduler.ts`)

```ts
import { sql } from './db';
import { generateEvolvedFrame } from './generation';

const BASE_INTERVAL_MS = 2 * 60 * 60 * 1000;  // 2 hours
const MAX_INTERVAL_MS = 64 * 60 * 60 * 1000;   // 64 hours cap

export async function updateGenerationSchedule(creatureId: string): Promise<void> {
  const { rows } = await sql`
    SELECT generation_count FROM creatures WHERE id = ${creatureId}
  `;

  if (rows.length === 0) return;

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
```

The schedule: 2h → 4h → 8h → 16h → 32h → 64h (cap). The creature generates rapidly when young and settles as it ages.

`processScheduledGenerations` is called by a Vercel cron job (see section 18).

---

## 12. Life Experience Engine (`src/lib/server/experience.ts`)

Server-side accumulation of attractor exposure.

```ts
import { sql } from './db';
import type { StateVector, AttractorState, CelestialState } from '$lib/engine/types';

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

interface ExperienceSummary {
  total_logs: number;
  avg_x: number;
  avg_y: number;
  avg_z: number;
  std_x: number;
  std_y: number;
  std_z: number;
}
```

### Client-side experience modulation (`src/lib/engine/experience.ts`)

```ts
import type { ExperienceSummary } from '$lib/server/experience';

export function modulateState(
  rawValue: number,
  attractorAxis: number,
  experience: ExperienceSummary | null
): number {
  if (!experience || experience.total_logs < 10) return rawValue;

  // creatures that have experienced a lot of high-attractor values
  // become slightly dampened in their response to those values.
  // creatures with wide variance remain sensitive.
  // this is aging, not learning.
  const sensitivity = Math.min(1, (experience.std_x + experience.std_y + experience.std_z) / 3);
  const damping = 1 - (1 - sensitivity) * 0.3;

  return rawValue * damping;
}
```

Do not make the experience engine more complex than this. The creature ages subtly. It does not learn dramatically.

---

## 13. Attractor Visualization (`src/lib/engine/visualization.ts`)

Compute trail points for rendering the Lorenz butterfly.

```ts
import type { AttractorState, CelestialState } from './types';
import { stepAttractor } from './attractor';

const TRAIL_LENGTH = 500;

export interface TrailPoint {
  x: number;
  y: number;
  z: number;
  age: number;  // 0 = newest, 1 = oldest
}

export function computeTrail(
  start: AttractorState,
  celestial: CelestialState,
  steps: number = TRAIL_LENGTH
): TrailPoint[] {
  const trail: TrailPoint[] = [];
  let current = { ...start };

  for (let i = 0; i < steps; i++) {
    current = stepAttractor(current, celestial, 0.005);
    trail.push({
      x: current.x,
      y: current.y,
      z: current.z,
      age: i / steps
    });
  }

  return trail;
}

// project 3D point to 2D for canvas rendering
// simple orthographic projection with slow rotation
export function project(
  point: TrailPoint,
  time: number,
  width: number,
  height: number
): { x: number; y: number; opacity: number } {
  const angle = time * 0.0005;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // rotate around y axis
  const rx = point.x * cos - point.z * sin;
  const rz = point.x * sin + point.z * cos;

  // scale and center
  const scale = 8;
  const x = width / 2 + rx * scale;
  const y = height / 2 - point.y * scale + rz * 2;
  const opacity = (1 - point.age) * 0.15;  // very subtle

  return { x, y, opacity };
}
```

---

## 14. Attractor Visualization Component (`src/lib/components/AttractorVisualization.svelte`)

Requirements:

- Full viewport `<canvas>` element, positioned absolutely behind the creature
- `z-index: 0`. Creature viewport is `z-index: 1`.
- Renders the Lorenz butterfly trail as dots on the canvas
- Color: `emerald-400` (`#34d399`) with very low opacity (0.03 to 0.15, fading with age)
- Dot size: 1px
- Trail recomputed each animation frame from current attractor state
- Slow rotation around the y-axis
- The visualization should be barely perceptible. It is atmospheric, not informational. If a user does not notice it, that is correct.

---

## 15. Generation Status Component (`src/lib/components/GenerationStatus.svelte`)

Requirements:

- Displays in the admin panel
- Shows: total frames generated, time since last generation, time until next generation (countdown)
- "Generate Now" button: `text-emerald-500`, `hover:text-emerald-400`. Calls `POST /api/generate`.
- After force-generate: resets the backoff schedule (next generation at current interval, not reset to 2h)
- Display generation history: list of generation timestamps, most recent first

---

## 16. Admin Page (`src/routes/admin/+page.svelte`)

Requirements:

- Accessible via a link in the admin panel (not the main nav -- there is no main nav)
- Requires authentication. Redirect to login if not authenticated.
- Shows:
  - Creature metadata: id (truncated), created date, total frames, generation count
  - Frame library: all frames with ASCII preview, weights, delete button
  - Generation status and force-generate button
  - "Reset Creature" button: deletes all frames and experience, regenerates init frame, resets backoff schedule. Requires confirmation (`confirm()` dialog).
  - "Delete Account" button: deletes user, creature, all frames, all experience. Requires confirmation. Redirects to `/` after deletion.
- Visual treatment: same dark terminal aesthetic as the main page. This is still a workbench.

---

## 17. API Routes

### `POST /api/generate` (`src/routes/api/generate/+server.ts`)

Force-generate a new frame for the authenticated user's creature. Requires valid session. Calls `generateEvolvedFrame`. Returns 200 on success, 401 if not authenticated, 429 if generated within the last 5 minutes (rate limit).

### `GET /api/creature` (`src/routes/api/creature/+server.ts`)

Returns the authenticated user's creature data: id, created_at, generation_count, next_generation_at, frame count.

### `GET /api/frames` (`src/routes/api/frames/+server.ts`)

Returns all frames for the authenticated user's creature. Each frame includes: id, ascii, weights, generation_index, created_at.

### `POST /api/admin/reset` (`src/routes/api/admin/reset/+server.ts`)

Deletes all frames and experience for the authenticated user's creature. Resets generation_count to 0. Triggers `generateInitFrame`. Returns 200.

### `POST /api/admin/delete` (`src/routes/api/admin/delete/+server.ts`)

Deletes the authenticated user's account, creature, frames, and experience (cascade). Clears session cookie. Returns 200.

All API routes must verify session. All mutations must use POST. Return JSON. No GET mutations.

---

## 18. Cron Job

Create `vercel.json` in the project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate",
      "schedule": "0 * * * *"
    }
  ]
}
```

Create `src/routes/api/cron/generate/+server.ts`:

```ts
import { processScheduledGenerations } from '$lib/server/scheduler';

export async function GET({ request }) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await processScheduledGenerations();
  return new Response('OK', { status: 200 });
}
```

Add `CRON_SECRET` to environment variables. The cron runs hourly and processes any creatures whose `next_generation_at` has passed.

Add to the file structure in section 5:

```
    api/
      cron/
        generate/
          +server.ts                     -- cron endpoint for scheduled generation
```

---

## 19. Updated Main Page (`src/routes/+page.svelte`)

Changes from Phase 0:

- Load creature and frames from the database via `+page.server.ts` instead of localStorage.
- If user is not authenticated, show `LoginPage` component.
- If user is authenticated but has no creature, this should not happen (creature is created on signup). Show an error.
- Attractor step rate: 10 steps per display frame. The attractor advances 10 iterations of `stepAttractor` per tick, then the display samples the final position. This gives the attractor time to move through state space between visible frames.
- Display frame rate: 1Hz (1000ms interval). Up from 2000ms in Phase 0.
- Log experience to the server every 60 seconds (not every tick -- that would be too many writes). Batch the current state and attractor position.
- Render `AttractorVisualization` behind the creature viewport.

---

## 20. Updated Layout (`src/routes/+layout.server.ts`)

```ts
import { verifySessionToken } from '$lib/server/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const token = cookies.get('izomaki-session');
  if (!token) return { user: null };

  const session = verifySessionToken(token);
  if (!session) return { user: null };

  return { user: { id: session.userId } };
};
```

---

## 21. Login Page (`src/lib/components/LoginPage.svelte`)

Requirements:

- Centered on the page, same dark aesthetic
- Two buttons: "Sign in with GitHub", "Sign in with Google"
- Buttons: `border border-neutral-700`, `hover:border-neutral-500`, `text-neutral-300`
- No logo. No tagline. No explanation of what the app is. If you are here, you already know.
- Below the buttons, in `text-neutral-600`, small: "izomaki"

---

## 22. Visual Specifications (Additions)

All Phase 0 visual specs remain. Add:

- Attractor visualization: `emerald-400` (#34d399) dots at 0.03-0.15 opacity
- Login buttons: outlined, not filled. `border-neutral-700`.
- Generation countdown: `text-neutral-500`, monospace
- Force generate button: `text-emerald-500`, no background, no border
- Admin page: same terminal aesthetic. No special styling.

---

## 23. What NOT to Build

Do not build any of the following:

- Real-time multiplayer / seeing other creatures live
- Chat or messaging between users
- Public creature profiles or galleries
- Creature naming (the creature does not have a name)
- Frame rating, voting, or curation
- Push notifications
- Email notifications
- Password-based auth
- Admin role / superuser distinction (every user is admin of their own creature)
- Mobile-responsive layouts
- Frame editing after generation (frames are immutable once created)
- Undo/redo
- Import/export

---

## 24. Code Style

All Phase 0 code style rules apply. Additionally:

- Server-side code goes in `src/lib/server/`. Never import server modules from client code.
- SQL queries use tagged template literals. No string concatenation for queries.
- API routes return `new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })`.
- Error responses include a `{ error: string }` body.
- No try/catch around database queries unless the error is specifically handled. Let errors propagate.
- Commit messages: lowercase, present tense, no period. Example: `add oauth callback`, `wire generation scheduler`

---

## 25. Completion Criteria

Phase 1 is complete when:

1. A user can sign in via GitHub OAuth.
2. A user can sign in via Google OAuth.
3. On first sign-in, a creature is created and an init frame is generated via Claude API.
4. The creature displays on the main page at 1Hz animation.
5. The Lorenz attractor advances 10 steps per display frame.
6. The attractor visualization renders as a subtle ghost behind the creature.
7. Frames are stored in and loaded from Vercel Postgres.
8. New frames auto-generate on an exponential backoff schedule (2h → 4h → 8h → ...).
9. The cron job processes scheduled generations hourly.
10. The force-generate button triggers immediate frame generation.
11. Life experience is logged every 60 seconds and stored in the database.
12. Experience modulates the creature's state response over time.
13. The admin page displays creature metadata, frame library, and generation status.
14. The admin page allows creature reset (delete all frames/experience, regenerate init).
15. The admin page allows account deletion (full cascade delete).
16. Frames can be deleted individually from the admin page.
17. Session persists across page reloads via signed cookies.
18. Signing out clears the session.
19. Unauthenticated users see only the login page.
20. `npm run build` succeeds with no errors.
21. Deploys to Vercel without errors.
22. The creature does not respond to any user input.

If all 22 conditions are met, stop. The creature has grown. That is enough.
