<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import LandingCreature from './LandingCreature.svelte';
  import PlatformStats from './PlatformStats.svelte';

  import type { LandingCreatureData, PlatformStats as PlatformStatsType } from '$lib/types';

  let creatures: LandingCreatureData[] = $state([]);
  let stats: PlatformStatsType = $state({
    totalCreatures: 0,
    totalFrames: 0,
    activeCreatures: 0,
    oldestCreatureAge: 0,
    avgFramesPerCreature: 0
  });

  let displayIndex = $state(0);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function fetchData() {
    try {
      const res = await fetch('/api/landing');
      if (!res.ok) return;
      const body = await res.json();
      creatures = body.creatures ?? [];
      stats = body.stats ?? stats;
    } catch {
      // silent -- landing is purely decorative
    }
  }

  onMount(() => {
    fetchData();

    intervalId = setInterval(() => {
      displayIndex = (displayIndex + 2) % Math.max(creatures.length, 1);
      if (displayIndex === 0) fetchData();
    }, 10000);
  });

  onDestroy(() => {
    if (intervalId !== null) clearInterval(intervalId);
  });

  const positions = [
    { left: '20%', top: '65%' },
    { left: '72%', top: '28%' }
  ];
</script>

<div class="relative w-screen h-screen overflow-hidden">
  {#each [0, 1] as slot}
    {@const idx = (displayIndex + slot) % Math.max(creatures.length, 1)}
    {#if creatures[idx]}
      <div
        class="absolute"
        style="left: {positions[slot].left}; top: {positions[slot].top}; transform: translate(-50%, -50%) scale(0.6); transform-origin: center;"
      >
        {#key creatures[idx].creatureId}
          <LandingCreature
            data={creatures[idx]}
            visible={true}
          />
        {/key}
      </div>
    {/if}
  {/each}

  <div class="flex flex-col items-center justify-center w-full h-full gap-4">
    <a
      href="/auth/github"
      class="border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-mono text-sm px-6 py-2 transition-colors"
    >
      Sign in with GitHub
    </a>
    <a
      href="/auth/google"
      class="border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-mono text-sm px-6 py-2 transition-colors"
    >
      Sign in with Google
    </a>
    <span class="text-neutral-600 font-mono text-xs mt-4">izomaki</span>
  </div>

  <div class="absolute bottom-16 left-0 right-0 flex justify-center">
    <PlatformStats {stats} />
  </div>
</div>
