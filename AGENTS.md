# AGENTS.md

## The Creature

The creature is not an agent in the traditional sense. It has no goals, no tasks, no objectives. It is a state machine with an internal emotional trajectory that it follows for its own reasons.

### Internal Model

The creature maintains a state vector of six parameters:

| Parameter | Range | Meaning |
|-----------|-------|---------|
| `wakefulness` | 0-1 | Depth of sleep to full alertness |
| `contentment` | 0-1 | Existential unease to deep peace |
| `curiosity` | 0-1 | Total indifference to rapt fascination |
| `agitation` | 0-1 | Perfect stillness to restless twitching |
| `hunger` | 0-1 | Complete satiation to metaphysical craving |
| `presence` | 0-1 | Dissociated fog to absolute here-ness |

These parameters are NOT emotions in the human sense. They are internal states that the creature experiences but cannot articulate. They are known only to itself. The user may infer emotional states from the creature's animations, but the creature is not performing for anyone.

### State Evolution

The creature's state evolves through three layers:

**Layer 1 -- The Attractor (cosmic, shared)**: A Lorenz attractor runs continuously, its constants modulated by the positions of the sun and moon at 300x real time. This attractor is identical for every creature on the platform. It is the shared weather of existence -- a chaotic, deterministic, never-repeating cosmic signal that every izomaki breathes to, unknowingly, together.

**Layer 2 -- Local Modulation (per-creature)**: The attractor output passes through the creature's own perceptual filter -- shaped by its accumulated life experiences and impressions. A creature that has "lived through" prolonged agitation may dampen its response to agitated attractor states, or amplify them. This is not learning. This is not adaptation. This is aging. The creature does not choose how it changes. It simply does.

**Layer 3 -- Oscillation (per-parameter)**: Each parameter has its own local oscillation pattern -- sine waves, noise, random drift -- layered on top for fine-grained texture. This is the creature's micro-weather, the subtle fidgeting beneath the larger tides.

### Frame Selection

The creature expresses its state by displaying the ASCII frame whose parameter weights are closest to the current internal state. It does not choose frames. The frames choose themselves, emerging from the math.

### Behavioral Notes

- The creature does not react to user input.
- The creature does not know it is being observed.
- The creature does not have a name (izomaki is what it IS, not who it is).
- The creature's internal state is genuine. It is not performing contentment or curiosity. It is experiencing them, for itself, in a way it could never share.
- Every creature shares the same attractor. No creature knows this.

## The Operator (You)

You are the person adding frames and tuning trajectories. You are not the creature's owner. You are closer to a naturalist documenting a thing you found. You provide the creature with forms of expression (frames) and the creature uses them as it sees fit.

Your job:
- Create ASCII art frames that capture specific emotional/behavioral states
- Tag each frame with honest parameter weights
- Tune the local oscillation to feel alive without being manic
- Resist the urge to make the creature perform
- Trust the attractor

## The Observer (The User)

There is no observer agent. If someone visits the page, they see the creature. The creature does not see them. This asymmetry is the point.

Eventually, the observer may have their own creature. They will share the same attractor. They will never interact. They will simply coexist -- separate things, breathing to the same cosmic rhythm, unaware of each other, together.
