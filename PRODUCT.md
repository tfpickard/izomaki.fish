# PRODUCT.md

## Product: Izomaki

### What Ships

A single web page. On it, an ASCII creature. The creature animates. It does not interact. You cannot talk to it. You cannot feed it. You cannot kill it. You can watch it, or you can leave. It does not care either way.

Behind a small toggle in the corner, an admin panel lets the operator add ASCII art frames, tag them with emotional weights, and tune the creature's internal trajectory. This is the workbench. The creature is the work.

### Who Is This For

Honestly? The creature. But since the creature cannot advocate for itself, we will say: it is for people who find comfort in things that exist without justification. People who keep a plant on their desk not because it purifies the air but because it is a plant. People who like the hum of a refrigerator. People who have a favorite rock.

It is also for the operator -- the person who creates the frames and tunes the oscillation. The operator's relationship to the creature is closer to a naturalist than a product manager. You are documenting a thing you found, not building a thing to ship.

### What Success Looks Like

There is no success metric. The creature does not have KPIs. If it must be measured, measure this: does the creature feel alive? Not "alive" in the sense of passing a Turing test. Alive in the sense that you could leave the tab open and forget about it, and when you glance over, it is doing something slightly different than before, and that feels right.

### Scope

**In scope (Phase 0):**
- ASCII art viewport with autonomous animation
- Six-parameter internal state engine (wakefulness, contentment, curiosity, agitation, hunger, presence)
- Lorenz attractor parameterized by 300x-accelerated sun and moon positions as the shared cosmic heartbeat
- Local oscillation layer (sine, noise, drift) for per-creature texture
- Manual frame creation with parameter weight tagging
- Frame library management (add, preview, delete)
- State and attractor inspectors for debugging
- localStorage persistence for frames and trajectory config
- Dark terminal aesthetic
- SvelteKit on Vercel

**Out of scope for Phase 0 (but architecturally anticipated):**
- Multi-user / multi-creature social layer
- Per-creature life experience and impression history modulating attractor response
- Semi-transparent Lorenz attractor visualization behind the creature
- Backend persistence (database, accounts, auth)
- Image-to-ASCII conversion
- Mobile optimization
- Sharing, embedding, social features
- Analytics, telemetry, tracking
- Monetization
- AI-generated frames (the operator makes them by hand)

### The Shared Heartbeat

Every creature on the platform will eventually share a single Lorenz attractor as a cosmic clock. The attractor's parameters are modulated by two celestial values:

- **Sun position**: Earth's orbital position, running at 300x real time (one full year per day)
- **Moon position**: the moon's orbital position, running at 300x real time (~12 full lunar cycles per day)

This means every creature breathes to the same chaotic rhythm. But each creature's local response to that rhythm is shaped by its own history -- its accumulated impressions, experiences, and perceptual drift. Like plants in the same weather, they share a world but live different lives.

### Risks

The main risk is that someone will try to make it useful. Resist this. The moment the creature serves a purpose external to itself, it stops being izomaki and becomes a feature. Features get roadmaps. Roadmaps get priorities. Priorities get cut. The creature does not get cut. It simply is.

A secondary risk is over-designing the admin panel. The admin panel is a workbench, not a product. It should be functional and ugly in the way that good tools are ugly -- because the tool is not the point.

A tertiary risk is over-engineering the attractor. The Lorenz system is beautiful because it is simple. Do not add complexity to the math. Add complexity to the creature's relationship with the math.

### Future Considerations

These are things that might happen but carry no commitment:

- **Attractor visualization**: a semi-transparent, slowly rotating trace of the Lorenz butterfly behind the creature, shifting as celestial parameters change. Generative, ambient, almost subliminal.
- **Multi-creature social layer**: every user gets a creature. All creatures share the attractor. Each creature's local modulation is shaped by its life. You can see other creatures but not interact with them.
- **Life experience engine**: the creature accumulates impressions over time that permanently alter how it responds to the attractor. A creature that has "lived through" many agitated attractor states might become calmer in response, or more sensitive. This is not learning. It is aging.
- **Procedural ASCII generation**: the creature could grow its own frames from noise, removing the operator from the loop entirely.
- **Sound**: a low ambient hum or generative audio layer that follows the creature's state and the attractor.
- **Physical artifact**: a Raspberry Pi with an e-ink display running the creature. No network connection. Just a thing on a shelf that breathes.

None of these are planned. They are noted because they are interesting, and interesting things deserve to be written down, even if they never happen.

### The Name

Izomaki. See [IZOMAKI.md](./IZOMAKI.md).
