<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  import CreatureField from '$lib/components/CreatureField.svelte';
  import LoginPage from '$lib/components/LoginPage.svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor } from '$lib/engine/attractor';
  import { evolveState } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';

  import { frameStore } from '$lib/stores/frames';
  import { creatureState, attractorState, trajectories, selectedFrameId } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  import type { Frame } from '$lib/engine/types';
  import type { NeighborCreature } from '$lib/types';

  interface Props {
    data: {
      user: { id: string } | null;
      creature: { id: string } | null;
      frames: { id: string; ascii: string; weights: unknown; generation_index: number; created_at: string }[];
      neighbors: NeighborCreature[];
    };
  }

  let { data }: Props = $props();

  const startTime = Date.now();
  let lastExperienceLog = Date.now();

  let neighbors: NeighborCreature[] = $state(data.neighbors ?? []);
  let active = $state(0);
  let total = $state(0);

  $effect(() => {
    if (data.frames.length > 0) {
      const mapped: Frame[] = data.frames.map(f => ({
        id: f.id,
        ascii: f.ascii,
        weights: f.weights as Frame['weights'],
        createdAt: new Date(f.created_at).getTime()
      }));
      frameStore.reset();
      for (const frame of mapped) {
        frameStore.add(frame);
      }
    }
  });

  onMount(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const time = (now - startTime) / 1000;

      const celestial = getCelestialState(now);
      celestialState.set(celestial);

      let currentAttractor = get(attractorState);
      for (let i = 0; i < 10; i++) {
        currentAttractor = stepAttractor(currentAttractor, celestial);
      }
      attractorState.set(currentAttractor);

      const normalized = normalizeAttractor(currentAttractor);

      const currentState = get(creatureState);
      const currentTrajectories = get(trajectories);
      const newState = evolveState(currentState, currentTrajectories, normalized, time);
      creatureState.set(newState);

      const frames = get(frameStore);
      const frame = selectFrame(frames, newState);
      selectedFrameId.set(frame?.id ?? null);

      if (data.user && now - lastExperienceLog >= 60000) {
        lastExperienceLog = now;
        fetch('/api/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attractor: currentAttractor,
            celestial,
            state: newState
          })
        });
      }
    }, 1000);

    // Presence heartbeat
    const refreshPresence = () => {
      fetch('/api/presence', { method: 'POST' })
        .then(r => { if (r.ok) return r.json(); })
        .then((body?: { active: number; total: number }) => {
          if (body) { active = body.active; total = body.total; }
        })
        .catch(() => {});
    };
    refreshPresence();
    const presenceInterval = setInterval(refreshPresence, 60000);

    // Neighbor refresh every 30 minutes
    const neighborInterval = setInterval(() => {
      fetch('/api/neighbors')
        .then(r => r.json())
        .then((body: { neighbors: NeighborCreature[] }) => {
          neighbors = body.neighbors;
        })
        .catch(() => {});
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(presenceInterval);
      clearInterval(neighborInterval);
    };
  });
</script>

{#if !data.user}
  <LoginPage />
{:else}
  <CreatureField {neighbors} {active} {total} />
{/if}
