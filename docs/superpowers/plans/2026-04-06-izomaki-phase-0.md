# Izomaki Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the minimum viable izomaki -- an ASCII creature that breathes via a Lorenz attractor modulated by accelerated celestial mechanics, animated by a frame selector driven by a six-parameter internal state engine.

**Architecture:** Pure engine functions in `src/lib/engine/` are composed in the main page tick loop and exposed to components via Svelte stores. The tick loop runs at 2s intervals via `setInterval`, advancing the attractor, evolving state, and selecting the closest frame. All state is local -- no backend, no API, no network calls.

**Tech Stack:** SvelteKit 2 (TypeScript strict), Tailwind CSS v4 (Vite plugin), adapter-vercel, localStorage for persistence.

> **Note on testing:** PROMPT.md section 14 explicitly excludes tests from Phase 0. TDD steps are replaced with browser verification steps. Tests will be added in a future phase.

---

## Design Direction

**Aesthetic: Void Terminal.** The page looks broken. That is correct. Pure black void (`#0a0a0a`). Single emerald creature (`text-emerald-400/90`) centered in absolute silence. No chrome. No branding. No affordances visible until you find the `⚙` ghost in the bottom-right corner. The admin panel is an instrument panel -- dense, functional, deliberately undesigned. The creature is the only designed thing on the page, and it was designed by math.

**The unforgettable detail:** Opening the page and seeing nothing at all until the creature appears.

---

## File Map

All paths are relative to the SvelteKit project root (`izomaki/`).

| File | Status | Responsibility |
|------|--------|---------------|
| `src/lib/engine/types.ts` | Create | All shared types and constants |
| `src/lib/engine/celestial.ts` | Create | Sun/moon positions at 300x real time |
| `src/lib/engine/attractor.ts` | Create | Lorenz system, step function, normalization |
| `src/lib/engine/trajectory.ts` | Create | Per-parameter oscillation |
| `src/lib/engine/state.ts` | Create | State evolution combining attractor + oscillation |
| `src/lib/engine/selector.ts` | Create | Euclidean-distance frame selection |
| `src/lib/stores/frames.ts` | Create | Frame library with localStorage persistence |
| `src/lib/stores/creature.ts` | Create | Runtime state: creature state, attractor, trajectories |
| `src/lib/stores/attractor.ts` | Create | Celestial state store |
| `src/lib/components/Creature.svelte` | Create | ASCII viewport, full screen, no interaction |
| `src/lib/components/StateInspector.svelte` | Create | Debug readout of state vector |
| `src/lib/components/AttractorInspector.svelte` | Create | Debug readout of attractor + celestial |
| `src/lib/components/FrameEditor.svelte` | Create | Add new frames with parameter weights |
| `src/lib/components/FrameLibrary.svelte` | Create | List, preview, delete frames |
| `src/lib/components/TrajectoryConfig.svelte` | Create | Per-parameter oscillation sliders + localStorage |
| `src/lib/components/AdminPanel.svelte` | Create | Collapsible right panel wrapping all inspector/editor components |
| `src/routes/+layout.svelte` | Create | Root layout with global CSS |
| `src/routes/+page.svelte` | Create | Tick loop, store wiring, top-level layout |
| `src/app.css` | Modify | Add `@import 'tailwindcss'` |
| `svelte.config.js` | Modify | Switch to adapter-vercel |
| `vite.config.ts` | Modify | Add Tailwind Vite plugin |

---

## Task 1: Project Bootstrap

**Files:**
- Modify: `svelte.config.js`
- Modify: `vite.config.ts`
- Modify: `src/app.css`
- Modify: `src/app.html`

- [ ] **Step 1: Scaffold the project**

```bash
npx sv create izomaki --template minimal --types ts
cd izomaki
npm install
npm install -D @sveltejs/adapter-vercel
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Replace svelte.config.js**

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

- [ ] **Step 3: Replace vite.config.ts**

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 4: Replace src/app.css**

```css
@import 'tailwindcss';
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:5173`. No build errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "scaffold sveltekit project with vercel adapter and tailwind"
```

---

## Task 2: Types

**Files:**
- Create: `src/lib/engine/types.ts`

- [ ] **Step 1: Create `src/lib/engine/types.ts`**

```ts
export interface StateVector {
  wakefulness: number;
  contentment: number;
  curiosity: number;
  agitation: number;
  hunger: number;
  presence: number;
}

export interface Frame {
  id: string;
  ascii: string;
  weights: StateVector;
  createdAt: number;
}

export interface TrajectoryConfig {
  frequency: number;
  amplitude: number;
  phase: number;
  noise: number;
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
  sun: number;
  moon: number;
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/types.ts
git commit -m "add engine types"
```

---

## Task 3: Celestial Engine

**Files:**
- Create: `src/lib/engine/celestial.ts`

- [ ] **Step 1: Create `src/lib/engine/celestial.ts`**

```ts
import type { CelestialState } from './types';

const TIME_ACCELERATION = 300;
const SOLAR_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const LUNAR_MONTH_MS = 29.53059 * 24 * 60 * 60 * 1000;
const EPOCH = new Date('2025-01-01T00:00:00Z').getTime();

export function getCelestialState(now: number): CelestialState {
  const elapsed = (now - EPOCH) * TIME_ACCELERATION;
  const sun = (elapsed % SOLAR_YEAR_MS) / SOLAR_YEAR_MS;
  const moon = (elapsed % LUNAR_MONTH_MS) / LUNAR_MONTH_MS;
  return { sun, moon };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/celestial.ts
git commit -m "add celestial engine"
```

---

## Task 4: Lorenz Attractor

**Files:**
- Create: `src/lib/engine/attractor.ts`

- [ ] **Step 1: Create `src/lib/engine/attractor.ts`**

```ts
import type { AttractorState, CelestialState } from './types';

const SIGMA_BASE = 10;
const RHO_BASE = 28;
const BETA_BASE = 8 / 3;

const SIGMA_RANGE = 2;
const RHO_RANGE = 4;
const BETA_RANGE = 0.5;

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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/attractor.ts
git commit -m "add lorenz attractor"
```

---

## Task 5: Trajectory Oscillation

**Files:**
- Create: `src/lib/engine/trajectory.ts`

- [ ] **Step 1: Create `src/lib/engine/trajectory.ts`**

```ts
import type { TrajectoryConfig } from './types';

export function oscillate(config: TrajectoryConfig, time: number): number {
  const base = Math.sin(time * config.frequency * Math.PI * 2 + config.phase) * config.amplitude;
  const noise = (Math.random() - 0.5) * 2 * config.noise;
  return base + noise;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/trajectory.ts
git commit -m "add trajectory oscillation"
```

---

## Task 6: State Evolution

**Files:**
- Create: `src/lib/engine/state.ts`

- [ ] **Step 1: Create `src/lib/engine/state.ts`**

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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/state.ts
git commit -m "add state evolution engine"
```

---

## Task 7: Frame Selector

**Files:**
- Create: `src/lib/engine/selector.ts`

- [ ] **Step 1: Create `src/lib/engine/selector.ts`**

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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/engine/selector.ts
git commit -m "add frame selector"
```

---

## Task 8: Stores

**Files:**
- Create: `src/lib/stores/frames.ts`
- Create: `src/lib/stores/creature.ts`
- Create: `src/lib/stores/attractor.ts`

- [ ] **Step 1: Create `src/lib/stores/frames.ts`**

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

- [ ] **Step 2: Create `src/lib/stores/creature.ts`**

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

- [ ] **Step 3: Create `src/lib/stores/attractor.ts`**

```ts
import { writable } from 'svelte/store';
import type { CelestialState } from '$lib/engine/types';

export const celestialState = writable<CelestialState>({ sun: 0, moon: 0 });
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/
git commit -m "add stores"
```

---

## Task 9: Layout

**Files:**
- Modify: `src/routes/+layout.svelte`

- [ ] **Step 1: Replace `src/routes/+layout.svelte`**

```svelte
<script>
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300">
  {@render children()}
</div>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected: Page background is `#0a0a0a`. No visible content yet (placeholder route).

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "add root layout"
```

---

## Task 10: Creature Component

**Files:**
- Create: `src/lib/components/Creature.svelte`

- [ ] **Step 1: Create `src/lib/components/Creature.svelte`**

```svelte
<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { selectedFrameId } from '$lib/stores/creature';
  import { derived } from 'svelte/store';

  const currentFrame = derived(
    [frameStore, selectedFrameId],
    ([$frames, $id]) => $frames.find(f => f.id === $id) ?? null
  );
</script>

<div class="flex items-center justify-center w-full h-full">
  {#if $currentFrame}
    <pre class="font-mono text-emerald-400 opacity-90 leading-tight select-none">{$currentFrame.ascii}</pre>
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/Creature.svelte
git commit -m "add creature component"
```

---

## Task 11: State Inspector

**Files:**
- Create: `src/lib/components/StateInspector.svelte`

- [ ] **Step 1: Create `src/lib/components/StateInspector.svelte`**

```svelte
<script lang="ts">
  import { creatureState, selectedFrameId } from '$lib/stores/creature';
  import { PARAMETER_KEYS } from '$lib/engine/types';
</script>

<div class="font-mono text-xs text-neutral-500 space-y-1">
  {#each PARAMETER_KEYS as key}
    <div class="flex items-center gap-2">
      <span class="w-24 shrink-0">{key}</span>
      <div class="flex-1 bg-neutral-800 h-1">
        <div class="bg-emerald-500/30 h-1 transition-none" style="width: {($creatureState[key] * 100).toFixed(1)}%"></div>
      </div>
      <span class="w-10 text-right">{$creatureState[key].toFixed(3)}</span>
    </div>
  {/each}
  <div class="pt-1 text-neutral-600">
    frame: {$selectedFrameId ? $selectedFrameId.slice(0, 8) : 'none'}
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/StateInspector.svelte
git commit -m "add state inspector"
```

---

## Task 12: Attractor Inspector

**Files:**
- Create: `src/lib/components/AttractorInspector.svelte`

- [ ] **Step 1: Create `src/lib/components/AttractorInspector.svelte`**

```svelte
<script lang="ts">
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';
  import { getModulatedConstants } from '$lib/engine/attractor';
  import { derived } from 'svelte/store';

  const constants = derived(
    [attractorState, celestialState],
    ([$attractor, $celestial]) => getModulatedConstants($celestial)
  );
</script>

<div class="font-mono text-xs text-neutral-500 space-y-1">
  <div class="flex gap-4">
    <span>x <span class="text-neutral-400">{$attractorState.x.toFixed(4)}</span></span>
    <span>y <span class="text-neutral-400">{$attractorState.y.toFixed(4)}</span></span>
    <span>z <span class="text-neutral-400">{$attractorState.z.toFixed(4)}</span></span>
  </div>
  <div class="flex gap-4">
    <span>sun <span class="text-neutral-400">{$celestialState.sun.toFixed(4)}</span></span>
    <span>moon <span class="text-neutral-400">{$celestialState.moon.toFixed(4)}</span></span>
  </div>
  <div class="flex gap-4">
    <span>σ <span class="text-neutral-400">{$constants.sigma.toFixed(4)}</span></span>
    <span>ρ <span class="text-neutral-400">{$constants.rho.toFixed(4)}</span></span>
    <span>β <span class="text-neutral-400">{$constants.beta.toFixed(4)}</span></span>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/AttractorInspector.svelte
git commit -m "add attractor inspector"
```

---

## Task 13: Frame Editor

**Files:**
- Create: `src/lib/components/FrameEditor.svelte`

- [ ] **Step 1: Create `src/lib/components/FrameEditor.svelte`**

```svelte
<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import type { StateVector } from '$lib/engine/types';

  let ascii = $state('');
  let weights = $state<StateVector>({
    wakefulness: 0.5,
    contentment: 0.5,
    curiosity: 0.5,
    agitation: 0.5,
    hunger: 0.5,
    presence: 0.5
  });

  function save() {
    frameStore.add({
      id: crypto.randomUUID(),
      ascii,
      weights: { ...weights },
      createdAt: Date.now()
    });
    ascii = '';
    weights = {
      wakefulness: 0.5,
      contentment: 0.5,
      curiosity: 0.5,
      agitation: 0.5,
      hunger: 0.5,
      presence: 0.5
    };
  }
</script>

<div class="space-y-3">
  <textarea
    bind:value={ascii}
    class="w-full font-mono text-xs bg-neutral-800 text-neutral-300 border border-neutral-700 p-2 resize-y min-h-[200px] focus:outline-none focus:border-neutral-600"
    placeholder=""
    spellcheck="false"
  ></textarea>

  <div class="space-y-2">
    {#each PARAMETER_KEYS as key}
      <div class="flex items-center gap-2 text-xs font-mono">
        <span class="w-24 text-neutral-500 shrink-0">{key}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          bind:value={weights[key]}
          class="flex-1 accent-emerald-500"
        />
        <span class="w-10 text-right text-neutral-400">{weights[key].toFixed(2)}</span>
      </div>
    {/each}
  </div>

  <button
    onclick={save}
    class="w-full text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1.5 rounded border border-neutral-700 hover:border-neutral-600"
  >
    save frame
  </button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/FrameEditor.svelte
git commit -m "add frame editor"
```

---

## Task 14: Frame Library

**Files:**
- Create: `src/lib/components/FrameLibrary.svelte`

- [ ] **Step 1: Create `src/lib/components/FrameLibrary.svelte`**

```svelte
<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { PARAMETER_KEYS } from '$lib/engine/types';

  let hoveredId = $state<string | null>(null);
</script>

<div class="space-y-1 font-mono text-xs">
  {#if $frameStore.length === 0}
    <span class="text-neutral-600">no frames</span>
  {:else}
    {#each $frameStore as frame (frame.id)}
      <div
        class="group relative flex items-start gap-2 py-1 border-b border-neutral-800"
        onmouseenter={() => hoveredId = frame.id}
        onmouseleave={() => hoveredId = null}
        role="listitem"
      >
        <span class="flex-1 text-neutral-500 truncate">
          {frame.ascii.split('\n')[0].slice(0, 40)}
        </span>
        <span class="text-neutral-700 shrink-0 text-[10px]">
          {PARAMETER_KEYS.map(k => frame.weights[k].toFixed(1)).join(' ')}
        </span>
        <button
          onclick={() => frameStore.remove(frame.id)}
          class="text-red-400 hover:text-red-300 shrink-0 px-1"
        >
          ×
        </button>

        {#if hoveredId === frame.id}
          <div class="absolute left-0 top-full z-10 bg-neutral-900 border border-neutral-700 p-2 whitespace-pre text-neutral-400 text-[10px] leading-tight max-w-64 overflow-hidden">
            {frame.ascii}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/FrameLibrary.svelte
git commit -m "add frame library"
```

---

## Task 15: Trajectory Config

**Files:**
- Create: `src/lib/components/TrajectoryConfig.svelte`

- [ ] **Step 1: Create `src/lib/components/TrajectoryConfig.svelte`**

```svelte
<script lang="ts">
  import { trajectories } from '$lib/stores/creature';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'izomaki-trajectories';

  onMount(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        trajectories.set(JSON.parse(raw));
      } catch {
        // malformed storage -- leave defaults
      }
    }
  });

  function persist() {
    trajectories.subscribe(value => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    })();
  }
</script>

<div class="space-y-4 font-mono text-xs">
  {#each PARAMETER_KEYS as param}
    <div class="space-y-1">
      <div class="text-neutral-400">{param}</div>
      {#each [
        { field: 'frequency' as const, label: 'freq', min: 0, max: 0.5, step: 0.001 },
        { field: 'amplitude' as const, label: 'amp',  min: 0, max: 1,   step: 0.01  },
        { field: 'phase'     as const, label: 'phase', min: 0, max: Math.PI * 2, step: 0.01 },
        { field: 'noise'     as const, label: 'noise', min: 0, max: 0.2, step: 0.001 }
      ] as cfg}
        <div class="flex items-center gap-2">
          <span class="w-12 text-neutral-600 shrink-0">{cfg.label}</span>
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={$trajectories[param][cfg.field]}
            oninput={(e) => {
              trajectories.update(t => {
                const next = { ...t, [param]: { ...t[param], [cfg.field]: parseFloat((e.target as HTMLInputElement).value) } };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                return next;
              });
            }}
            class="flex-1 accent-emerald-500"
          />
          <span class="w-12 text-right text-neutral-400">{$trajectories[param][cfg.field].toFixed(3)}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/TrajectoryConfig.svelte
git commit -m "add trajectory config"
```

---

## Task 16: Admin Panel

**Files:**
- Create: `src/lib/components/AdminPanel.svelte`

- [ ] **Step 1: Create `src/lib/components/AdminPanel.svelte`**

```svelte
<script lang="ts">
  import FrameEditor from './FrameEditor.svelte';
  import FrameLibrary from './FrameLibrary.svelte';
  import StateInspector from './StateInspector.svelte';
  import AttractorInspector from './AttractorInspector.svelte';
  import TrajectoryConfig from './TrajectoryConfig.svelte';

  let open = $state(false);

  type Section = 'editor' | 'library' | 'state' | 'attractor' | 'trajectory';
  let collapsed = $state<Record<Section, boolean>>({
    editor: false,
    library: false,
    state: true,
    attractor: true,
    trajectory: true
  });

  function toggle(section: Section) {
    collapsed[section] = !collapsed[section];
  }
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-0">
  {#if open}
    <div class="w-96 bg-neutral-900 border-l border-neutral-800 overflow-y-auto max-h-screen pb-10 flex flex-col">
      {#each [
        { key: 'editor'    as Section, label: 'frame editor' },
        { key: 'library'   as Section, label: 'frame library' },
        { key: 'state'     as Section, label: 'state' },
        { key: 'attractor' as Section, label: 'attractor' },
        { key: 'trajectory'as Section, label: 'trajectory' }
      ] as section}
        <div class="border-b border-neutral-800">
          <button
            onclick={() => toggle(section.key)}
            class="w-full text-left px-3 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-400 flex justify-between items-center"
          >
            <span>{section.label}</span>
            <span>{collapsed[section.key] ? '+' : '−'}</span>
          </button>
          {#if !collapsed[section.key]}
            <div class="px-3 pb-3">
              {#if section.key === 'editor'}
                <FrameEditor />
              {:else if section.key === 'library'}
                <FrameLibrary />
              {:else if section.key === 'state'}
                <StateInspector />
              {:else if section.key === 'attractor'}
                <AttractorInspector />
              {:else if section.key === 'trajectory'}
                <TrajectoryConfig />
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <button
    onclick={() => open = !open}
    class="text-neutral-600 hover:text-neutral-400 font-mono text-sm px-2 py-1"
    aria-label="toggle admin panel"
  >
    ⚙
  </button>
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AdminPanel.svelte
git commit -m "add admin panel"
```

---

## Task 17: Main Page -- Tick Loop

**Files:**
- Modify: `src/routes/+page.svelte`

This is where all the engine modules are wired together. The tick loop runs every 2000ms.

- [ ] **Step 1: Replace `src/routes/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  import Creature from '$lib/components/Creature.svelte';
  import AdminPanel from '$lib/components/AdminPanel.svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor } from '$lib/engine/attractor';
  import { evolveState } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';

  import { frameStore } from '$lib/stores/frames';
  import { creatureState, attractorState, trajectories, selectedFrameId } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  const startTime = Date.now();

  onMount(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const time = (now - startTime) / 1000;

      const celestial = getCelestialState(now);
      celestialState.set(celestial);

      const currentAttractor = get(attractorState);
      const newAttractor = stepAttractor(currentAttractor, celestial);
      attractorState.set(newAttractor);

      const normalized = normalizeAttractor(newAttractor);

      const currentState = get(creatureState);
      const currentTrajectories = get(trajectories);
      const newState = evolveState(currentState, currentTrajectories, normalized, time);
      creatureState.set(newState);

      const frames = get(frameStore);
      const frame = selectFrame(frames, newState);
      selectedFrameId.set(frame?.id ?? null);
    }, 2000);

    return () => clearInterval(interval);
  });
</script>

<div class="flex w-screen h-screen overflow-hidden">
  <Creature />
  <AdminPanel />
</div>
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Expected:
- Page loads dark (`#0a0a0a`), no content visible
- `⚙` appears in bottom-right, barely visible against the background
- Clicking `⚙` opens the admin panel from the right
- Panel has collapsible sections: frame editor, frame library, state, attractor, trajectory
- Attractor inspector shows changing values every ~2s (open the section, watch x/y/z update)
- Sun and moon positions change each tick

- [ ] **Step 3: Verify admin panel functionality**

- Add a frame via frame editor (paste ASCII art into textarea, set weights, click "save frame")
- Verify frame appears in frame library
- Verify creature viewport shows the frame
- Verify state inspector shows parameter bars updating
- Verify frame persists after page reload (localStorage)
- Delete the frame -- verify viewport goes blank

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "add main page tick loop"
```

---

## Task 18: Build Verification

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors, no Svelte warnings, no missing imports.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

Expected: Production build loads correctly. Admin panel functions. localStorage persists across reloads.

- [ ] **Step 3: Commit if any fixes were required**

```bash
git add -A
git commit -m "fix build errors"
```

Only commit if there were actual changes. If the build passed clean, skip this step.

---

## Task 19: Deployment

- [ ] **Step 1: Deploy to Vercel**

```bash
npx vercel
```

Follow prompts. Link to existing project or create new. Framework: SvelteKit (auto-detected).

- [ ] **Step 2: Verify deployed URL**

Open the deployed URL. Verify:
- Dark page loads correctly
- `⚙` is visible in bottom-right
- Admin panel opens and functions
- localStorage persistence works in production

---

## Completion Criteria Checklist

Cross-reference PROMPT.md section 16:

- [ ] 1. Page loads with dark viewport
- [ ] 2. Admin panel toggles open and closed
- [ ] 3. Frame added via editor (ASCII art + 6 sliders)
- [ ] 4. Added frames appear in frame library
- [ ] 5. Frames can be deleted from library
- [ ] 6. State engine ticks every 2 seconds
- [ ] 7. Lorenz attractor advances each tick, modulated by sun/moon
- [ ] 8. Creature state vector evolves each tick
- [ ] 9. Closest-matching frame displayed in viewport
- [ ] 10. State inspector shows current parameter values
- [ ] 11. Attractor inspector shows attractor and celestial values
- [ ] 12. Trajectory config adjusts oscillation and persists to localStorage
- [ ] 13. Frames persist to localStorage across page reloads
- [ ] 14. Creature does not respond to any user input
- [ ] 15. `npm run build` succeeds with no errors
- [ ] 16. `npx vercel` deploys without errors

If all 16 are met, stop. The creature exists. That is enough.
