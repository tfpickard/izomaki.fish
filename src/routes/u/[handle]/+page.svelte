<script lang="ts">
  import { onMount } from 'svelte';
  import { getLandingAttractorByName, createSprottB } from '$lib/engine/attractors/index';
  import { evolveState, INITIAL_STATE } from '$lib/engine/state';
  import { selectFrame } from '$lib/engine/selector';
  import { mutateFrame, shouldMutate } from '$lib/engine/procedural';
  import { DEFAULT_TRAJECTORIES } from '$lib/engine/types';
  import { idToSeed } from '$lib/engine/noise';
  import type { AttractorState, Frame, ParameterTrajectories, StateVector } from '$lib/engine/types';

  interface CreatureData {
    id: string;
    created_at: string;
    generation_count: number;
    attractor_type: string;
  }

  interface FrameData {
    id: string;
    ascii: string;
    weights: unknown;
  }

  interface FilledAnswer {
    id: string;
    question: string;
    answer: string;
  }

  interface Props {
    data: {
      handle: string;
      bio: string | null;
      links: { website?: string; mastodon?: string; github?: string };
      filledAnswers: FilledAnswer[];
      creature: CreatureData | null;
      frames: FrameData[];
    };
  }

  let { data }: Props = $props();

  let currentAscii: string | null = $state(null);

  onMount(() => {
    if (!data.creature || data.frames.length === 0) return;

    const attractor = getLandingAttractorByName(data.creature.attractor_type) ?? createSprottB();
    let attractorState: AttractorState = { ...attractor.config.initialState };

    const seed = idToSeed(data.creature.id);
    const offset = (seed % 1000) / 1000 * Math.PI * 2;
    const trajectories: ParameterTrajectories = {} as ParameterTrajectories;
    for (const key of Object.keys(DEFAULT_TRAJECTORIES) as (keyof ParameterTrajectories)[]) {
      trajectories[key] = { ...DEFAULT_TRAJECTORIES[key], phase: DEFAULT_TRAJECTORIES[key].phase + offset };
    }

    const mappedFrames: Frame[] = data.frames.map(f => ({
      id: f.id,
      ascii: f.ascii,
      weights: f.weights as StateVector,
      createdAt: 0
    }));

    const mountTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const time = (now - mountTime) / 1000;

      for (let i = 0; i < 10; i++) {
        attractorState = attractor.step(attractorState);
      }
      const { nx, ny, nz } = attractor.normalize(attractorState);
      const state = evolveState(INITIAL_STATE, trajectories, { nx, ny, nz }, time);
      const frame = selectFrame(mappedFrames, state);
      const ascii = frame?.ascii ?? null;
      currentAscii = (ascii && shouldMutate(state))
        ? mutateFrame(ascii, state, Math.floor(time), data.creature!.id)
        : ascii;
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>@{data.handle} -- izomaki</title>
  <meta name="description" content={data.bio ?? `@${data.handle} on izomaki`} />
  <meta property="og:title" content="@{data.handle} -- izomaki" />
  <meta property="og:description" content={data.bio ?? `@${data.handle} on izomaki`} />
  <meta property="og:type" content="profile" />
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] font-mono">
  <div class="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-12">

    <!-- Identity -->
    <section class="flex flex-col gap-4">
      <div class="flex items-start gap-8">
        {#if currentAscii}
          <pre class="text-[var(--color-accent)] text-xs leading-tight select-none opacity-80 shrink-0">{currentAscii.split('\n').slice(0, 8).join('\n')}</pre>
        {/if}
        <div class="flex flex-col gap-2">
          <h1 class="text-[var(--color-fg)] text-sm">@{data.handle}</h1>
          {#if data.bio}
            <p class="text-[var(--color-fg-dim)] text-xs leading-relaxed max-w-sm">{data.bio}</p>
          {/if}
          <div class="flex gap-3 text-xs text-[var(--color-fg-dim)]">
            {#if data.links.website}
              <a href={data.links.website} target="_blank" rel="noopener noreferrer" class="hover:text-[var(--color-fg)]">{data.links.website}</a>
            {/if}
            {#if data.links.mastodon}
              <span>{data.links.mastodon}</span>
            {/if}
            {#if data.links.github}
              <a href="https://github.com/{data.links.github}" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--color-fg)]">github/{data.links.github}</a>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- Ten questions -->
    {#if data.filledAnswers.length > 0}
      <section class="flex flex-col gap-6">
        <h2 class="text-[var(--color-fg-dim)] text-xs uppercase tracking-widest">ten questions</h2>
        {#each data.filledAnswers as qa}
          <div class="flex flex-col gap-1">
            <p class="text-[var(--color-fg-dim)] text-xs leading-relaxed">{qa.question}</p>
            <p class="text-[var(--color-fg)] text-xs leading-relaxed pl-3 border-l border-[var(--color-border)]">{qa.answer}</p>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Footer -->
    <footer class="text-[var(--color-fg-faint)] text-xs">
      <a href="/" class="hover:text-[var(--color-fg-dim)]">izomaki</a>
    </footer>
  </div>
</div>
