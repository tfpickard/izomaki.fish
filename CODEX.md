# CODEX.md

## Project: Izomaki

ASCII art creature web app. The creature exists for its own sake -- no interaction, no utility, no response to user input. Izomaki means "a thing that exists for itself alone, its own purpose known only to itself, untranslatable even to itself."

## Setup

```bash
npx sv create izomaki
# Select: SvelteKit minimal, TypeScript, Tailwind CSS
cd izomaki
npm install
npm install -D @sveltejs/adapter-vercel
```

Update `svelte.config.js` to use `adapter-vercel`.

## Rules

- SvelteKit / TypeScript strict / Tailwind CSS / Vercel
- No backend in Phase 0. localStorage only.
- No `any` types. No implicit returns in non-trivial functions.
- Double dashes (--) not em dashes in all text and comments.
- No external animation libraries. Use setInterval/requestAnimationFrame + math.
- Every dependency is a concession. Justify it or remove it.

## Code Style

Write code the way a careful, unhurried person would. Clean, minimal, no clever tricks. The codebase should feel considered -- like every line was placed deliberately and nothing is there by accident.

- Comments are sparse and precise. If the code is clear, the comment is unnecessary.
- Variable and function names are exact. Not abbreviated, not verbose. The right word.
- No humor in the code. No joke variable names, no witty comments, no ASCII art in comments. Clarity is the aesthetic.
- Whitespace is intentional. Negative space in code matters the same way it matters in design.
- Prefer pure functions. Side effects are isolated and explicit.

## Commit Style

- Lowercase, present tense, no period: `add frame selector`, `adjust attractor constants`, `remove unused import`
- No emoji. No exclamation marks. No "fix dumb bug" or "finally works."
- Terse. The diff says what changed. The message says why, if it is not obvious.

## Architecture

The app has three layers:

1. **Engine** (`src/lib/engine/`): pure TypeScript functions, no Svelte dependency.
   - `types.ts`: Frame, StateVector (6 floats), TrajectoryConfig, AttractorState
   - `attractor.ts`: Lorenz attractor system, step function, normalization
   - `celestial.ts`: sun/moon position from timestamp, 300x time acceleration
   - `state.ts`: evolve the internal state vector each tick (attractor + local oscillation)
   - `trajectory.ts`: sine oscillation, noise, random walk per parameter
   - `selector.ts`: pick best-matching frame via cosine similarity or Euclidean distance

2. **Stores** (`src/lib/stores/`): Svelte writable/derived stores.
   - `creature.ts`: current state vector, selected frame
   - `frames.ts`: frame library, localStorage sync
   - `attractor.ts`: current attractor position, celestial values

3. **Components** (`src/lib/components/`): Svelte components.
   - `Creature.svelte`: renders the selected ASCII frame in a centered monospace viewport
   - `AdminPanel.svelte`: collapsible panel for frame management
   - `FrameEditor.svelte`: textarea + 6 sliders (0-1) for parameter weights
   - `FrameLibrary.svelte`: list all frames, preview, delete
   - `StateInspector.svelte`: debug view of current state vector + selected frame
   - `AttractorInspector.svelte`: debug view of Lorenz state + celestial values
   - `TrajectoryConfig.svelte`: per-parameter oscillation controls

The file structure reflects the conceptual architecture. Engine logic is separated from presentation the way roots are separated from branches. Nothing is where it is by accident.

## Parameters

Six floats, each 0.0-1.0:
- `wakefulness`: asleep to alert
- `contentment`: distressed to at peace
- `curiosity`: indifferent to intensely interested
- `agitation`: still to restless
- `hunger`: sated to ravenous (metaphysical)
- `presence`: dissociated to fully here

## The Attractor

Lorenz system: dx/dt = σ(y-x), dy/dt = x(ρ-z)-y, dz/dt = xy-βz

σ, ρ, β are modulated by:
- Sun position (0-1): Earth orbital angle, 300x accelerated (1 year = 1 day real time)
- Moon position (0-1): lunar orbital angle, 300x accelerated (~12 cycles/day)

The attractor is deterministic given a timestamp. All clients compute the same state. The Lorenz system is beautiful because it is simple. Do not add complexity to the math.

## Key Behavior

- State engine ticks independently (~2s default).
- Each tick: step attractor, evolve state, select closest frame, render.
- Frame selection: compute distance between state vector and each frame's weight vector.
- The creature never responds to the user. It does not know the user exists.
- The attractor is the shared cosmic heartbeat. All creatures feel it.

## Do Not

- Add user-creature interaction
- Add backend/database (Phase 0)
- Add image-to-ASCII conversion
- Add mobile layouts
- Add loading/onboarding UI
- Add emoji to commits or comments
- Add clever or humorous code comments
- Explain the creature to the user
- Over-engineer the attractor math
- Use the words "whimsical," "quirky," "delightful," or "fun" anywhere in the codebase
