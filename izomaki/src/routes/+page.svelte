<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  import Creature from '$lib/components/Creature.svelte';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import LoginPage from '$lib/components/LoginPage.svelte';
  import AttractorVisualization from '$lib/components/AttractorVisualization.svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor } from '$lib/engine/attractor';
  import { evolveState } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';

  import { frameStore } from '$lib/stores/frames';
  import { creatureState, attractorState, trajectories, selectedFrameId } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  import type { Frame } from '$lib/engine/types';

  interface Props {
    data: {
      user: { id: string } | null;
      creature: { id: string } | null;
      frames: { id: string; ascii: string; weights: unknown; generation_index: number; created_at: string }[];
    };
  }

  let { data }: Props = $props();

  const startTime = Date.now();
  let lastExperienceLog = Date.now();

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

    return () => clearInterval(interval);
  });
</script>

{#if !data.user}
  <LoginPage />
{:else}
  <div class="relative w-screen h-screen overflow-hidden">
    <AttractorVisualization />
    <div class="relative w-full h-full" style="z-index: 1;">
      <Creature />
      <AdminPanel />
    </div>
  </div>
{/if}
