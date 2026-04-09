<script lang="ts">
  import AdminPage from '$lib/components/AdminPage.svelte';
  import SyntheticControls from '$lib/components/SyntheticControls.svelte';
  import type { StateVector } from '$lib/engine/types';

  interface DbFrame {
    id: string;
    ascii: string;
    weights: StateVector;
    generation_index: number;
    created_at: string;
  }

  interface Creature {
    id: string;
    created_at: string;
    generation_count: number;
    last_generated_at: string | null;
    next_generation_at: string | null;
  }

  let { data } = $props();

  const creature = data.creature as Creature | null;
  const frames = (data.frames ?? []) as DbFrame[];
</script>

{#if creature}
  <AdminPage {creature} {frames} />
{:else}
  <div class="flex items-center justify-center w-screen h-screen font-mono text-neutral-600 text-sm">
    no creature found
  </div>
{/if}

<div class="min-h-0 bg-neutral-950 text-neutral-300 font-mono px-8 pb-8">
  <SyntheticControls
    syntheticUsers={data.syntheticUsers}
    syntheticCreatures={data.syntheticCreatures}
    maxCreaturesPerUser={data.maxCreaturesPerUser}
    minCreatureFloor={data.minCreatureFloor}
  />
</div>
