<script lang="ts">
  import { onMount } from 'svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor, INITIAL_ATTRACTOR } from '$lib/engine/attractor';
  import { evolveState, INITIAL_STATE } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';
  import { DEFAULT_TRAJECTORIES } from '$lib/engine/types';

  import type { AttractorState, Frame, ParameterTrajectories, StateVector } from '$lib/engine/types';

  interface Props {
    frames: { id: string; ascii: string; weights: unknown }[];
    experience: unknown;
    creatureId: string;
    position: { x: string; y: string };
  }

  let { frames, creatureId, position }: Props = $props();

  let currentAscii: string | null = $state(null);

  const mountTime = Date.now();
  let attractorState: AttractorState = { ...INITIAL_ATTRACTOR };

  function hashToPhaseOffset(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 1000) / 1000 * Math.PI * 2;
  }

  function buildOffsetTrajectories(offset: number): ParameterTrajectories {
    const result = {} as ParameterTrajectories;
    for (const key of Object.keys(DEFAULT_TRAJECTORIES) as (keyof ParameterTrajectories)[]) {
      result[key] = { ...DEFAULT_TRAJECTORIES[key], phase: DEFAULT_TRAJECTORIES[key].phase + offset };
    }
    return result;
  }

  const phaseOffset = hashToPhaseOffset(creatureId);
  const trajectories = buildOffsetTrajectories(phaseOffset);

  const mappedFrames: Frame[] = frames.map(f => ({
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
      const state = evolveState(INITIAL_STATE, trajectories, normalized, time);
      const frame = selectFrame(mappedFrames, state);
      currentAscii = frame?.ascii ?? null;
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

{#if currentAscii}
  <pre
    class="absolute font-mono text-emerald-400 opacity-60 leading-tight select-none pointer-events-none"
    style="left: {position.x}; top: {position.y}; transform: translate(-50%, -50%) scale(0.6); transform-origin: center;"
  >{currentAscii}</pre>
{/if}
