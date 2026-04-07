# Izomaki -- Implementation Spec

You are building a single-page web application called Izomaki. Read this entire document before writing any code. Follow it exactly. Do not improvise. Do not add features. Do not skip steps. Do not refactor the file structure. Do not rename files. Do not substitute libraries. If something is ambiguous, choose the simpler interpretation.

---

## 1. Project Setup

Run these commands exactly:

```bash
npx sv create izomaki --template minimal --types ts
cd izomaki
npm install
npm install -D @sveltejs/adapter-vercel
npm install -D tailwindcss @tailwindcss/vite
```

In `svelte.config.js`, replace the adapter:

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};
```

In `vite.config.ts`, add the Tailwind plugin:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

In `src/app.css`, add:

```css
@import 'tailwindcss';
```

Do not install any other dependencies. Do not add prettier, eslint, or testing libraries unless explicitly asked.

---

## 2. File Structure

Create exactly these files. Do not add files. Do not rename files. Do not reorganize.

```
src/
  lib/
    engine/
      types.ts
      attractor.ts
      celestial.ts
      trajectory.ts
      state.ts
      selector.ts
    stores/
      creature.ts
      frames.ts
      attractor.ts
    components/
      Creature.svelte
      AdminPanel.svelte
      FrameEditor.svelte
      FrameLibrary.svelte
      StateInspector.svelte
      AttractorInspector.svelte
      TrajectoryConfig.svelte
  routes/
    +page.svelte
    +layout.svelte
  app.css
  app.html
```

---

## 3. Types (`src/lib/engine/types.ts`)

Define exactly these types:

```ts
export interface StateVector {
  wakefulness: number;   // 0-1. 0 = asleep, 1 = fully alert
  contentment: number;   // 0-1. 0 = distressed, 1 = deeply at peace
  curiosity: number;     // 0-1. 0 = indifferent, 1 = intensely interested
  agitation: number;     // 0-1. 0 = still, 1 = restless
  hunger: number;        // 0-1. 0 = sated, 1 = ravenous (metaphysical)
  presence: number;      // 0-1. 0 = dissociated, 1 = fully here
}

export interface Frame {
  id: string;            // crypto.randomUUID()
  ascii: string;         // the ASCII art content
  weights: StateVector;  // parameter weights for this frame
  createdAt: number;     // Date.now()
}

export interface TrajectoryConfig {
  frequency: number;     // oscillation speed. default 0.1
  amplitude: number;     // oscillation range. default 0.3
  phase: number;         // phase offset in radians. default 0
  noise: number;         // random perturbation amount. default 0.05
}

export interface ParameterTrajectories {
  wakefulness: TrajectoryConfig;
  contentment: TrajectoryConfig;
  curiosity: TrajectoryConfig;
  agitation: TrajectoryConfig;
  hunger: TrajectoryConfig;
  presence: TrajectoryConfig;
}

export interface AttractorState {
  x: number;
  y: number;
  z: number;
}

export interface CelestialState {
  sun: number;           // 0-1. angular position in orbit
  moon: number;          // 0-1. angular position in orbit
}

export const PARAMETER_KEYS: (keyof StateVector)[] = [
  'wakefulness', 'contentment', 'curiosity',
  'agitation', 'hunger', 'presence'
];

export const DEFAULT_TRAJECTORIES: ParameterTrajectories = {
  wakefulness:  { frequency: 0.03, amplitude: 0.4,  phase: 0,          noise: 0.02 },
  contentment:  { frequency: 0.05, amplitude: 0.3,  phase: Math.PI/4,  noise: 0.03 },
  curiosity:    { frequency: 0.08, amplitude: 0.35, phase: Math.PI/2,  noise: 0.04 },
  agitation:    { frequency: 0.12, amplitude: 0.25, phase: Math.PI,    noise: 0.06 },
  hunger:       { frequency: 0.04, amplitude: 0.3,  phase: Math.PI/3,  noise: 0.03 },
  presence:     { frequency: 0.06, amplitude: 0.35, phase: Math.PI/6,  noise: 0.02 }
};
```

Do not add fields. Do not rename fields. Do not change defaults without being asked.

---

## 4. Celestial Engine (`src/lib/engine/celestial.ts`)

This module computes the position of the sun and moon at any given timestamp, accelerated 300x.

```ts
const TIME_ACCELERATION = 300;
const SOLAR_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const LUNAR_MONTH_MS = 29.53059 * 24 * 60 * 60 * 1000;

// epoch: Jan 1 2025 00:00 UTC. arbitrary but fixed.
const EPOCH = new Date('2025-01-01T00:00:00Z').getTime();

export function getCelestialState(now: number): CelestialState {
  const elapsed = (now - EPOCH) * TIME_ACCELERATION;
  const sun = (elapsed % SOLAR_YEAR_MS) / SOLAR_YEAR_MS;
  const moon = (elapsed % LUNAR_MONTH_MS) / LUNAR_MONTH_MS;
  return { sun, moon };
}
```

Import `CelestialState` from `types.ts`. Do not add additional celestial bodies. Do not use an astronomy library.

---

## 5. Lorenz Attractor (`src/lib/engine/attractor.ts`)

This module implements the Lorenz system. The constants σ, ρ, β are modulated by the sun and moon positions.

```ts
import type { AttractorState, CelestialState } from './types';

// base lorenz constants
const SIGMA_BASE = 10;
const RHO_BASE = 28;
const BETA_BASE = 8 / 3;

// modulation ranges
const SIGMA_RANGE = 2;    // σ varies ±2 around base
const RHO_RANGE = 4;      // ρ varies ±4 around base
const BETA_RANGE = 0.5;   // β varies ±0.5 around base

export function getModulatedConstants(celestial: CelestialState) {
  const sunAngle = celestial.sun * Math.PI * 2;
  const moonAngle = celestial.moon * Math.PI * 2;
  return {
    sigma: SIGMA_BASE + Math.sin(sunAngle) * SIGMA_RANGE,
    rho: RHO_BASE + Math.sin(moonAngle) * RHO_RANGE,
    beta: BETA_BASE + Math.sin(sunAngle + moonAngle) * BETA_RANGE
  };
}

export function stepAttractor(
  state: AttractorState,
  celestial: CelestialState,
  dt: number = 0.005
): AttractorState {
  const { sigma, rho, beta } = getModulatedConstants(celestial);
  const dx = sigma * (state.y - state.x) * dt;
  const dy = (state.x * (rho - state.z) - state.y) * dt;
  const dz = (state.x * state.y - beta * state.z) * dt;
  return {
    x: state.x + dx,
    y: state.y + dy,
    z: state.z + dz
  };
}

// normalize attractor xyz to 0-1 range for use as modulation signal
// lorenz attractor typical ranges: x[-20,20], y[-30,30], z[0,50]
export function normalizeAttractor(state: AttractorState): { nx: number; ny: number; nz: number } {
  return {
    nx: clamp((state.x + 20) / 40, 0, 1),
    ny: clamp((state.y + 30) / 60, 0, 1),
    nz: clamp(state.z / 50, 0, 1)
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const INITIAL_ATTRACTOR: AttractorState = { x: 1, y: 1, z: 1 };
```

Do not change the Lorenz equations. Do not add a fourth dimension. Do not use a different attractor.

---

## 6. Trajectory / Oscillation (`src/lib/engine/trajectory.ts`)

This module generates per-parameter oscillation values layered on top of the attractor.

```ts
import type { TrajectoryConfig } from './types';

export function oscillate(config: TrajectoryConfig, time: number): number {
  const base = Math.sin(time * config.frequency * Math.PI * 2 + config.phase) * config.amplitude;
  const noise = (Math.random() - 0.5) * 2 * config.noise;
  return base + noise;
}
```

That is the entire file. Do not add perlin noise, simplex noise, or any noise library. `Math.random()` is sufficient for Phase 0.

---

## 7. State Engine (`src/lib/engine/state.ts`)

This module evolves the creature's internal state each tick.

```ts
import type { StateVector, ParameterTrajectories } from './types';
import { PARAMETER_KEYS } from './types';
import { oscillate } from './trajectory';

export function evolveState(
  current: StateVector,
  trajectories: ParameterTrajectories,
  attractorModulation: { nx: number; ny: number; nz: number },
  time: number
): StateVector {
  // map attractor axes to parameter pairs
  // nx modulates wakefulness + contentment
  // ny modulates curiosity + agitation
  // nz modulates hunger + presence
  const attractorMap: Record<keyof StateVector, number> = {
    wakefulness: attractorModulation.nx,
    contentment: attractorModulation.nx,
    curiosity: attractorModulation.ny,
    agitation: attractorModulation.ny,
    hunger: attractorModulation.nz,
    presence: attractorModulation.nz
  };

  const next: Partial<StateVector> = {};

  for (const key of PARAMETER_KEYS) {
    const attractorBase = attractorMap[key];
    const localOscillation = oscillate(trajectories[key], time);
    const raw = attractorBase + localOscillation;
    next[key] = clamp(raw, 0, 1);
  }

  return next as StateVector;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const INITIAL_STATE: StateVector = {
  wakefulness: 0.5,
  contentment: 0.5,
  curiosity: 0.5,
  agitation: 0.2,
  hunger: 0.3,
  presence: 0.7
};
```

Do not add smoothing, interpolation, or easing unless explicitly asked. The raw output is correct for Phase 0.

---

## 8. Frame Selector (`src/lib/engine/selector.ts`)

This module selects the frame whose weights are closest to the current state.

```ts
import type { Frame, StateVector } from './types';
import { PARAMETER_KEYS } from './types';

export function selectFrame(frames: Frame[], state: StateVector): Frame | null {
  if (frames.length === 0) return null;

  let bestFrame = frames[0];
  let bestDistance = Infinity;

  for (const frame of frames) {
    const distance = euclideanDistance(frame.weights, state);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestFrame = frame;
    }
  }

  return bestFrame;
}

function euclideanDistance(a: StateVector, b: StateVector): number {
  let sum = 0;
  for (const key of PARAMETER_KEYS) {
    const diff = a[key] - b[key];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
```

Use Euclidean distance. Do not use cosine similarity. Do not add weighted distance. Do not add randomness to tie-breaking -- first match wins.

---

## 9. Svelte Stores (`src/lib/stores/`)

### `src/lib/stores/frames.ts`

```ts
import { writable } from 'svelte/store';
import type { Frame } from '$lib/engine/types';

const STORAGE_KEY = 'izomaki-frames';

function loadFrames(): Frame[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function createFrameStore() {
  const { subscribe, set, update } = writable<Frame[]>(loadFrames());

  return {
    subscribe,
    add(frame: Frame) {
      update(frames => {
        const next = [...frames, frame];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    remove(id: string) {
      update(frames => {
        const next = frames.filter(f => f.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      set([]);
    }
  };
}

export const frameStore = createFrameStore();
```

### `src/lib/stores/creature.ts`

```ts
import { writable } from 'svelte/store';
import type { StateVector, AttractorState, ParameterTrajectories } from '$lib/engine/types';
import { DEFAULT_TRAJECTORIES } from '$lib/engine/types';
import { INITIAL_STATE } from '$lib/engine/state';
import { INITIAL_ATTRACTOR } from '$lib/engine/attractor';

export const creatureState = writable<StateVector>(INITIAL_STATE);
export const attractorState = writable<AttractorState>(INITIAL_ATTRACTOR);
export const trajectories = writable<ParameterTrajectories>(DEFAULT_TRAJECTORIES);
export const selectedFrameId = writable<string | null>(null);
```

### `src/lib/stores/attractor.ts`

```ts
import { writable } from 'svelte/store';
import type { CelestialState } from '$lib/engine/types';

export const celestialState = writable<CelestialState>({ sun: 0, moon: 0 });
```

Do not combine stores into a single file. Do not use derived stores unless explicitly asked.

---

## 10. Components

### `src/lib/components/Creature.svelte`

The creature viewport. Renders the currently selected ASCII frame centered on screen.

Requirements:
- Full viewport width and height minus any admin panel
- Dark background: `bg-neutral-950`
- Monospace font: use `font-mono`
- Text color: `text-emerald-400` with `opacity-90`
- ASCII art rendered inside a `<pre>` tag
- Centered horizontally and vertically using flexbox
- If no frames exist, display nothing. Not a message. Not a placeholder. Nothing.
- The creature does not respond to clicks, hovers, or any input

### `src/lib/components/AdminPanel.svelte`

A collapsible side panel toggled by a small button in the bottom-right corner.

Requirements:
- Toggle button: a small `⚙` character, `text-neutral-600`, `hover:text-neutral-400`
- Panel slides in from the right, width `w-96`, background `bg-neutral-900`, `border-l border-neutral-800`
- Contains: FrameEditor, FrameLibrary, StateInspector, AttractorInspector, TrajectoryConfig
- Each section collapsible with a header toggle
- Panel does not overlay the creature -- the creature viewport shrinks to accommodate

### `src/lib/components/FrameEditor.svelte`

For adding new frames.

Requirements:
- `<textarea>` for ASCII art input. Monospace font. Dark background. Min height 200px.
- Six range sliders, one per parameter (0 to 1, step 0.01). Label each with the parameter name and current value.
- Slider styling: `accent-emerald-500`
- "Save Frame" button. On click: create a `Frame` object with `crypto.randomUUID()` as id, add to `frameStore`, clear the textarea, reset sliders to 0.5.
- Do not validate ASCII art content. Any string is valid.

### `src/lib/components/FrameLibrary.svelte`

Lists all saved frames.

Requirements:
- Each frame shown as a row: truncated ASCII preview (first 40 chars of first line), parameter weights as small numbers, delete button.
- On hover: show full ASCII art in a tooltip or expanded preview.
- Delete button: `text-red-400`, `hover:text-red-300`. Removes from `frameStore`. No confirmation dialog.
- If no frames, show: "no frames" in `text-neutral-600`.

### `src/lib/components/StateInspector.svelte`

Debug readout of the creature's current state.

Requirements:
- Display each parameter name and its current value as a horizontal bar (0-1).
- Bar fill color: `bg-emerald-500/30`
- Display the currently selected frame's id (truncated to 8 chars).
- Updates reactively from `creatureState` store.
- This is a debug tool. It should look like a debug tool.

### `src/lib/components/AttractorInspector.svelte`

Debug readout of the Lorenz attractor and celestial state.

Requirements:
- Display attractor x, y, z values (raw, not normalized).
- Display sun position and moon position (0-1).
- Display current modulated σ, ρ, β values.
- Updates reactively from `attractorState` and `celestialState` stores.

### `src/lib/components/TrajectoryConfig.svelte`

Controls for per-parameter oscillation.

Requirements:
- For each of the six parameters, display four sliders: frequency (0-0.5), amplitude (0-1), phase (0 to 2π), noise (0-0.2).
- Label each slider with name and current value.
- Updates write to the `trajectories` store.
- Save to localStorage under key `izomaki-trajectories`. Load on init.

---

## 11. Main Page (`src/routes/+page.svelte`)

This is where the engine runs.

Requirements:
- On mount, start a `setInterval` loop at 2000ms (2 seconds per tick).
- Each tick:
  1. Get current timestamp: `Date.now()`
  2. Compute celestial state: `getCelestialState(now)`
  3. Step the attractor: `stepAttractor(currentAttractor, celestialState)`
  4. Normalize the attractor: `normalizeAttractor(newAttractor)`
  5. Evolve creature state: `evolveState(currentState, trajectories, normalized, time)`
  6. Select frame: `selectFrame(allFrames, newState)`
  7. Update all stores
- Track elapsed time as a monotonically increasing float (seconds since page load), passed to `evolveState` for oscillation.
- On unmount, clear the interval.
- Render `<Creature />` as the main viewport and `<AdminPanel />` as the overlay.

---

## 12. Layout (`src/routes/+layout.svelte`)

```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300">
  {@render children()}
</div>
```

---

## 13. Visual Specifications

- Background: `bg-neutral-950` (#0a0a0a)
- Primary text: `text-neutral-300`
- Creature text: `text-emerald-400` with `opacity-90`
- Accent: `emerald-500`
- Admin panel background: `bg-neutral-900`
- Admin panel border: `border-neutral-800`
- Font: system monospace (`font-mono`). Do not import custom fonts.
- No gradients. No shadows. No border-radius except on buttons (`rounded`).
- No animations on UI elements. The only animation is the creature's frame changes.

---

## 14. What NOT to Build

Do not build any of the following. If you find yourself building any of these, stop.

- User interaction with the creature (clicks, hover effects, input)
- A backend, API, or database
- Image-to-ASCII conversion
- Mobile-responsive layouts
- Loading screens, splash screens, or onboarding
- Analytics, telemetry, or tracking
- Share buttons, embed codes, or social features
- Sound or audio
- Attractor visualization (planned for later, not now)
- Tests (not yet)
- CI/CD configuration
- Docker configuration
- README (will be written separately)
- Any file not listed in the file structure above

---

## 15. Code Style

- TypeScript strict mode. No `any`. No `@ts-ignore`.
- Comments: sparse, precise. If the code is clear, do not comment it.
- Variable names: exact. Not abbreviated, not verbose.
- No humor in code. No joke names. No ASCII art in comments.
- Pure functions wherever possible. Side effects isolated in stores and the main page tick loop.
- Commit messages: lowercase, present tense, no period. Example: `add frame selector`
- Do not use the words "whimsical," "quirky," "delightful," or "fun" anywhere.

---

## 16. Completion Criteria

The project is complete when:

1. The page loads with a dark viewport.
2. The admin panel can be toggled open and closed.
3. A frame can be added via the editor (ASCII art + 6 parameter sliders).
4. Added frames appear in the frame library.
5. Frames can be deleted from the library.
6. The state engine ticks every 2 seconds.
7. The Lorenz attractor advances each tick, modulated by accelerated sun/moon positions.
8. The creature's state vector evolves each tick using attractor + oscillation.
9. The closest-matching frame is displayed in the viewport.
10. The state inspector shows current parameter values.
11. The attractor inspector shows current attractor and celestial values.
12. Trajectory config sliders adjust oscillation behavior and persist to localStorage.
13. Frames persist to localStorage across page reloads.
14. The creature does not respond to any user input.
15. `npm run build` succeeds with no errors.
16. `npx vercel` deploys without errors.

If all 16 conditions are met, stop. The creature exists. That is enough.
