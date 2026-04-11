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

  const VISIBLE = 6;

  let order: number[] = $state([]);
  let cursor = $state(0);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function shuffle(n: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function reshuffle() {
    order = shuffle(creatures.length);
    cursor = 0;
  }

  function advance() {
    cursor += VISIBLE;
    if (cursor >= order.length) reshuffle();
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/landing');
      if (!res.ok) return;
      const body = await res.json();
      creatures = body.creatures ?? [];
      stats = body.stats ?? stats;
      reshuffle();
    } catch {
      // silent -- landing is purely decorative
    }
  }

  onMount(() => {
    fetchData();
    intervalId = setInterval(() => {
      advance();
      if (cursor === 0) fetchData();
    }, 10000);
  });

  onDestroy(() => {
    if (intervalId !== null) clearInterval(intervalId);
  });

  const positions = [
    { left: '12%', top: '60%' },
    { left: '28%', top: '30%' },
    { left: '55%', top: '70%' },
    { left: '70%', top: '25%' },
    { left: '85%', top: '55%' },
    { left: '42%', top: '45%' }
  ];

  function visibleCreatures(): LandingCreatureData[] {
    if (creatures.length === 0) return [];
    const visible: LandingCreatureData[] = [];
    const slice = order.slice(cursor, cursor + VISIBLE);
    for (const idx of slice) {
      if (creatures[idx]) visible.push(creatures[idx]);
    }
    return visible;
  }
</script>

<div class="relative w-screen h-screen overflow-hidden">
  {#each visibleCreatures() as creature, slot (creature.creatureId)}
    <div
      class="absolute"
      style="left: {positions[slot % positions.length].left}; top: {positions[slot % positions.length].top}; transform: translate(-50%, -50%) scale(0.6); transform-origin: center;"
    >
      <LandingCreature
        data={creature}
        visible={true}
      />
    </div>
  {/each}

  <div class="flex flex-col items-center justify-center w-full h-full gap-4">
    <a
      href="/auth/github"
      class="border border-[var(--color-border)] hover:border-[var(--color-fg-dim)] text-[var(--color-fg)] font-mono text-sm px-6 py-2 transition-colors"
    >
      Sign in with GitHub
    </a>
    <a
      href="/auth/google"
      class="border border-[var(--color-border)] hover:border-[var(--color-fg-dim)] text-[var(--color-fg)] font-mono text-sm px-6 py-2 transition-colors"
    >
      Sign in with Google
    </a>
    <span class="text-[var(--color-fg-faint)] font-mono text-xs mt-4">izomaki</span>
  </div>

  <div class="absolute bottom-16 left-0 right-0 flex justify-center">
    <PlatformStats {stats} />
  </div>
</div>
