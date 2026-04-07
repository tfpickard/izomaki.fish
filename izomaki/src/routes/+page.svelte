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
