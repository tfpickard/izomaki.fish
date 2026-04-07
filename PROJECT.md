# PROJECT.md

## Izomaki

A web-based ASCII art creature that exists for its own sake.

---

## Abstract

Izomaki is a single-page web application that displays an ASCII art creature animated by an internal emotional state engine. The creature does not respond to user input. It does not serve a function. It is not a toy, a pet, a chatbot, or a screensaver. It is a thing that exists for itself alone, its own purpose known only to itself, untranslatable even to itself.

The project explores what it means to build software that has no user-facing utility -- not as a joke, not as a statement, but as a genuine artifact. For the philosophical foundation and definition of the term "izomaki," see [IZOMAKI.md](./IZOMAKI.md).

---

## Documents

| Document | Purpose |
|----------|---------|
| [IZOMAKI.md](./IZOMAKI.md) | Definition, philosophy, and usage of the word "izomaki" |
| [PRODUCT.md](./PRODUCT.md) | Product framing, scope, and what ships |
| [PROMPT.md](./PROMPT.md) | Full implementation spec for code generation agents |
| [CLAUDE.md](./CLAUDE.md) | Instruction file for Claude Code |
| [CODEX.md](./CODEX.md) | Instruction file for ChatGPT Codex |
| [AGENTS.md](./AGENTS.md) | Conceptual agents: the creature, the operator, the observer |

---

## How It Works

The creature has an internal state -- a vector of six parameters (wakefulness, contentment, curiosity, agitation, hunger, presence), each ranging from 0 to 1. These parameters evolve over time via a layered system:

1. **The Lorenz Attractor**: a shared chaotic system parameterized by the positions of the sun and moon, running at 300x real time. Every creature on the platform breathes to this same cosmic heartbeat. One full solar orbit per day, roughly 12 lunar cycles per day.

2. **Local Modulation**: each creature filters the attractor signal through its own accumulated experiences, so two creatures in the same attractor state will respond differently.

3. **Oscillation Layer**: fine-grained sine waves, noise, and random drift layered on top for texture.

The operator (you) creates ASCII art frames and tags each one with parameter weights describing the state it represents. At each animation tick, the engine selects the frame whose weights are closest to the creature's current internal state.

The creature animates. It shifts. It drifts. It does not know you are watching.

For the full technical spec, see [PROMPT.md](./PROMPT.md). For the agent model, see [AGENTS.md](./AGENTS.md).

---

## What This Project Is

- A web page with an ASCII creature that animates autonomously
- An admin panel for adding frames and tuning the creature's emotional trajectory
- A state engine driven by a Lorenz attractor modulated by celestial mechanics
- A thing that is what it is

## What This Project Is Not

- A chatbot, pet, game, or interactive experience
- A backend service, API, or platform (yet)
- A mobile app
- A product with users, metrics, or growth targets
- A joke (though it is allowed to be funny)

---

## Vision

Izomaki begins as a single creature on a single page. But the architecture anticipates a future where many creatures exist -- each belonging to a different person, each modulated by the same shared attractor, each responding differently based on its own history. A social platform where the social element is not interaction between users but a shared cosmic rhythm that every creature breathes to, unknowingly, together.

Think: what if Furby had been connected to the Internet, except beautiful.

---

## Current Phase

**Phase 0: The Core Interaction**

Build the minimum thing that breathes:

1. A viewport that renders ASCII art frames
2. A Lorenz attractor parameterized by accelerated sun/moon positions
3. An engine that evolves an internal state vector over time using the attractor + local oscillation
4. A frame selector that picks the closest match
5. An admin panel to manually add frames with parameter weights
6. A trajectory config to tune the oscillation

No image-to-ASCII conversion. No networking. No auth. No exponential backoff. No polish. Just a creature that exists.

---

## Tech Stack

- SvelteKit with TypeScript
- Tailwind CSS
- Vercel (adapter-vercel)
- localStorage for persistence (Phase 0)

---

## Creator

Izomaki is a project by **Haruki Tomisaka** (富坂 春樹), an independent software artist and intermittent essayist based in Kamakura. He has worked in interaction design, left, returned, and left again. He has published infrequently on topics including generative systems, ambient interfaces, and the ethics of purposelessness. He does not maintain a social media presence. He prefers trains.

See [IZOMAKI.md](./IZOMAKI.md) for the definition of the word.
