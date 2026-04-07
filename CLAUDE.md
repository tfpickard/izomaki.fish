# CLAUDE.md

## Project: Izomaki

An ASCII art creature that exists for its own sake. No utility. No interaction. Its existence is its own purpose.

## Key Concepts

- The creature does NOT respond to the user. It is not a chatbot. It is not a pet. It is a thing that exists.
- Animation is driven by a layered internal state engine: Lorenz attractor (shared cosmic heartbeat) → local modulation (per-creature) → oscillation layer (fine texture).
- The Lorenz attractor is parameterized by sun and moon positions running at 300x real time.
- Frames are manually added via an admin panel, each tagged with six parameter weights: wakefulness, contentment, curiosity, agitation, hunger, presence.
- The engine evolves its internal state over time and selects frames by vector similarity.
- "Izomaki" means "a thing that exists for itself alone, its own purpose known only to itself, untranslatable even to itself."

## Tech Stack

- SvelteKit with TypeScript
- Tailwind CSS
- Vercel (adapter-vercel)
- No backend in Phase 0. localStorage for persistence.
- No external animation libs. Pure math + setInterval/requestAnimationFrame.
- Svelte stores for reactive state.

## Style

- Dark, terminal aesthetic. Monospace. Generous whitespace around the creature.
- Admin panel is collapsible and unobtrusive.
- No branding, no explanation text on the main view. The creature just is.

## Architecture

- `src/lib/engine/` contains pure functions: Lorenz attractor, celestial calculations, state evolution, trajectory math, frame selection.
- `src/lib/components/` contains Svelte components: creature viewport, admin panel, frame editor, inspectors.
- `src/lib/stores/` contains Svelte stores: creature state, frame library, attractor state.
- State engine is decoupled from Svelte render cycle. It ticks independently.
- Frame selection uses cosine similarity or Euclidean distance against the current state vector.
- The attractor is deterministic given a timestamp. Any client can compute the same attractor state for the same moment.

## Formatting

- Use double dashes (--) instead of em dashes.
- TypeScript strict mode. No `any`.
- Every dependency is a concession. Justify it or remove it.

## Code Style

Write code as if every line were placed deliberately. Clean, minimal, no clever tricks. The codebase should feel considered.

- Comments are sparse and precise. If the code is clear, the comment is unnecessary.
- Variable and function names are exact. Not abbreviated, not verbose. The right word.
- No humor in the code. No joke names, no witty comments. Clarity is the aesthetic.
- Whitespace is intentional. Negative space in code matters.
- Prefer pure functions. Side effects are isolated and explicit.

## Commit Style

- Lowercase, present tense, no period: `add frame selector`, `adjust attractor constants`
- No emoji. No exclamation marks. Terse. The diff says what changed.

## What Not To Do

- Do not add user interaction with the creature.
- Do not add a backend or database (Phase 0).
- Do not add image-to-ASCII conversion.
- Do not add mobile-specific layouts.
- Do not add loading screens, onboarding, or tutorials.
- Do not add emoji to commits or comments.
- Do not add clever or humorous code comments.
- Do not explain the creature to the user. It does not need to be understood.
- Do not over-engineer the attractor math. The Lorenz system is beautiful because it is simple.
- Do not use the words "whimsical," "quirky," "delightful," or "fun" anywhere in the codebase.
