<script lang="ts">
  import { onMount } from 'svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor, INITIAL_ATTRACTOR } from '$lib/engine/attractor';
  import { evolveState, INITIAL_STATE } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';
  import { mutateFrame, shouldMutate } from '$lib/engine/procedural';
  import { DEFAULT_TRAJECTORIES } from '$lib/engine/types';
  import { idToSeed } from '$lib/engine/noise';

  import type { AttractorState, Frame, ParameterTrajectories, StateVector } from '$lib/engine/types';
  import type { LandingCreatureData } from '$lib/types';

  interface Props {
    data: LandingCreatureData;
    visible: boolean;
  }

  let { data, visible }: Props = $props();

  let currentAscii: string | null = $state(null);

  const mountTime = Date.now();
  let attractorState: AttractorState = { ...INITIAL_ATTRACTOR };

  function buildOffsetTrajectories(seed: number): ParameterTrajectories {
    const offset = (seed % 1000) / 1000 * Math.PI * 2;
    const result = {} as ParameterTrajectories;
    for (const key of Object.keys(DEFAULT_TRAJECTORIES) as (keyof ParameterTrajectories)[]) {
      result[key] = { ...DEFAULT_TRAJECTORIES[key], phase: DEFAULT_TRAJECTORIES[key].phase + offset };
    }
    return result;
  }

  const seed = idToSeed(data.creatureId);
  const trajectories = buildOffsetTrajectories(seed);

  const mappedFrames: Frame[] = data.frames.map(f => ({
    id: f.id,
    ascii: f.ascii,
    weights: f.weights as StateVector,
    createdAt: 0
  }));

  onMount(() => {
    if (mappedFrames.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const time = (now - mountTime) / 1000;

      const celestial = getCelestialState(now);

      for (let i = 0; i < 10; i++) {
        attractorState = stepAttractor(attractorState, celestial);
      }

      const normalized = normalizeAttractor(attractorState);
      const state: StateVector = evolveState(INITIAL_STATE, trajectories, normalized, time);
      const frame = selectFrame(mappedFrames, state);
      const ascii = frame?.ascii ?? null;

      currentAscii = (ascii && shouldMutate(state))
        ? mutateFrame(ascii, state, Math.floor(time), data.creatureId)
        : ascii;
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

{#if currentAscii}
  <pre
    class="font-mono text-emerald-400 leading-tight select-none pointer-events-none"
    style="opacity: {visible ? 0.7 : 0}; transition: opacity 1s ease;"
  >{currentAscii}</pre>
{/if}
