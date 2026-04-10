<script lang="ts">
  import { onMount } from 'svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor, INITIAL_ATTRACTOR, stepDadras, normalizeDadras, getDadrasParams, INITIAL_DADRAS } from '$lib/engine/attractor';
  import type { CreatureExperience } from '$lib/engine/attractor';
  import { evolveState, INITIAL_STATE } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';
  import { DEFAULT_TRAJECTORIES } from '$lib/engine/types';

  import type { AttractorState, Frame, ParameterTrajectories, StateVector } from '$lib/engine/types';
  import { mutateFrame, shouldMutate } from '$lib/engine/procedural';

  interface Props {
    frames: { id: string; ascii: string; weights: unknown }[];
    experience: unknown;
    creatureId: string;
    position: { x: string; y: string };
    createdAt?: string;
    generationCount?: number;
  }

  let { frames, creatureId, position, createdAt, generationCount }: Props = $props();

  let currentAscii: string | null = $state(null);

  const mountTime = Date.now();
  let attractorState: AttractorState = { ...INITIAL_ATTRACTOR };
  let dadrasState = { ...INITIAL_DADRAS };

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

  function buildExperience(): CreatureExperience {
    const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : 0;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return {
      avgX: 0,
      avgY: 0,
      avgZ: 0,
      ageNormalized: Math.min(ageDays / 30, 1),
      generationNormalized: Math.min((generationCount ?? 0) / 50, 1)
    };
  }

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

      // Tier 2: Dadras modulated by Sprott B + experience
      const exp = buildExperience();
      const dadrasParams = getDadrasParams(normalized, exp);
      for (let i = 0; i < 5; i++) {
        dadrasState = stepDadras(dadrasState, dadrasParams);
      }
      const dadrasNorm = normalizeDadras(dadrasState);
      const state = evolveState(INITIAL_STATE, trajectories, dadrasNorm, time);
      const frame = selectFrame(mappedFrames, state);
      const ascii = frame?.ascii ?? null;
      currentAscii = (ascii && shouldMutate(state))
        ? mutateFrame(ascii, state, Math.floor(time), creatureId)
        : ascii;
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

{#if currentAscii}
  <pre
    class="absolute font-mono text-[var(--color-accent)] opacity-60 leading-tight select-none pointer-events-none"
    style="left: {position.x}; top: {position.y}; transform: translate(-50%, -50%) scale(0.6); transform-origin: center;"
  >{currentAscii}</pre>
{/if}
