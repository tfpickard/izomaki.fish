<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  import CreatureField from '$lib/components/CreatureField.svelte';
  import LandingPage from '$lib/components/LandingPage.svelte';
  import NavBar from '$lib/components/nav/NavBar.svelte';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import AttractorBackground from '$lib/components/AttractorBackground.svelte';
  import MoodPanel from '$lib/components/panels/MoodPanel.svelte';
  import StatusBar from '$lib/components/panels/StatusBar.svelte';

  import { getCelestialState } from '$lib/engine/celestial';
  import { stepAttractor, normalizeAttractor, stepDadras, normalizeDadras, getDadrasParams, INITIAL_DADRAS } from '$lib/engine/attractor';
  import type { CreatureExperience } from '$lib/engine/attractor';
  import { evolveState } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';
  import { mutateFrame, shouldMutate } from '$lib/engine/procedural';

  import { frameStore } from '$lib/stores/frames';
  import { creatureState, attractorState, trajectories, selectedFrameId, displayAscii } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  import type { Frame, AttractorState } from '$lib/engine/types';
  import type { NeighborCreature, UserProfile } from '$lib/types';

  interface CreatureData {
    id: string;
    last_generated_at: string | null;
    next_generation_at: string | null;
    created_at: string;
    generation_count: number;
    display_order: number;
    frames: { id: string; ascii: string; weights: unknown; generation_index: number; created_at: string }[];
  }

  interface Props {
    data: {
      user: { id: string } | null;
      creature: CreatureData | null;
      allCreatures: CreatureData[];
      frames: { id: string; ascii: string; weights: unknown; generation_index: number; created_at: string }[];
      neighbors: NeighborCreature[];
      profile: UserProfile | null;
      maxCreatures: number;
    };
  }

  let { data }: Props = $props();

  const startTime = Date.now();
  let lastExperienceLog = Date.now();

  let neighbors: NeighborCreature[] = $state(data.neighbors ?? []);
  let active = $state(0);
  let total = $state(0);

  const dadrasStates = new Map<string, AttractorState>();

  function getDadrasState(id: string): AttractorState {
    if (!dadrasStates.has(id)) {
      dadrasStates.set(id, { ...INITIAL_DADRAS });
    }
    return dadrasStates.get(id)!;
  }

  function buildExperience(creature: CreatureData): CreatureExperience {
    const ageMs = Date.now() - new Date(creature.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return {
      avgX: 0,
      avgY: 0,
      avgZ: 0,
      ageNormalized: Math.min(ageDays / 30, 1),
      generationNormalized: Math.min((creature.generation_count ?? 0) / 50, 1)
    };
  }

  $effect(() => {
    if (data.frames.length === 0) return;
    const incoming = new Map(data.frames.map(f => [f.id, {
      id: f.id,
      ascii: f.ascii,
      weights: f.weights as Frame['weights'],
      createdAt: new Date(f.created_at).getTime()
    }]));
    const current = get(frameStore);
    const currentIds = new Set(current.map(f => f.id));
    for (const id of currentIds) {
      if (!incoming.has(id)) frameStore.remove(id);
    }
    for (const frame of incoming.values()) {
      frameStore.upsert(frame);
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
      const sprottNorm = normalizeAttractor(currentAttractor);

      if (!data.creature) return;

      const exp = buildExperience(data.creature);
      const dadrasParams = getDadrasParams(sprottNorm, exp);
      let dadrasState = getDadrasState(data.creature.id);
      for (let i = 0; i < 5; i++) {
        dadrasState = stepDadras(dadrasState, dadrasParams);
      }
      dadrasStates.set(data.creature.id, dadrasState);
      const dadrasNorm = normalizeDadras(dadrasState);

      const currentState = get(creatureState);
      const currentTrajectories = get(trajectories);
      const newState = evolveState(currentState, currentTrajectories, dadrasNorm, time);
      creatureState.set(newState);

      const frames = get(frameStore);
      const frame = selectFrame(frames, newState);
      selectedFrameId.set(frame?.id ?? null);

      const ascii = frame?.ascii ?? null;
      displayAscii.set(
        ascii && shouldMutate(newState)
          ? mutateFrame(ascii, newState, Math.floor(time), data.creature.id)
          : ascii
      );

      if (now - lastExperienceLog >= 60000) {
        lastExperienceLog = now;
        fetch('/api/experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attractor: currentAttractor, celestial, state: newState })
        });
      }
    }, 1000);

    const refreshPresence = () => {
      fetch('/api/presence', { method: 'POST' })
        .then(r => r.ok ? r.json() : undefined)
        .then((body?: { active: number; total: number }) => {
          if (body) { active = body.active; total = body.total; }
        })
        .catch(() => {});
    };
    refreshPresence();
    const presenceInterval = setInterval(refreshPresence, 60000);

    const neighborInterval = setInterval(() => {
      fetch('/api/neighbors')
        .then(r => r.json())
        .then((body: { neighbors: NeighborCreature[] }) => { neighbors = body.neighbors; })
        .catch(() => {});
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(presenceInterval);
      clearInterval(neighborInterval);
    };
  });

  const profile = $derived(data.profile ?? { handle: null, bio: null, links: {}, bioAnswers: {} });
</script>

{#if !data.user}
  <LandingPage />
{:else}
  <AttractorBackground />
  <div class="flex flex-col h-screen overflow-hidden relative" style="z-index: 1;">
    <NavBar
      {profile}
      creatureLastGeneratedAt={data.creature?.last_generated_at ?? null}
    />

    <div class="flex-1 min-h-0 grid lg:grid-cols-[1fr_auto] grid-cols-1 overflow-hidden">
      <!-- Creature column -->
      <div class="relative overflow-hidden border-r border-[var(--color-border)]">
        <CreatureField
          {neighbors}
          {active}
          {total}
          allCreatures={data.allCreatures}
        />
      </div>

      <!-- Mood column (collapsible) -->
      <MoodPanel isOwner={!!data.user} frames={data.frames} />
    </div>

    {#if data.creature}
      <StatusBar
        createdAt={data.creature.created_at}
        generationCount={data.creature.generation_count}
        frameCount={data.frames.length}
        nextGenerationAt={data.creature.next_generation_at}
      />
    {/if}
  </div>

  <AdminPanel allCreatures={data.allCreatures} maxCreatures={data.maxCreatures} />
{/if}
