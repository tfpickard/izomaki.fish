<script lang="ts">
  import Creature from '$lib/components/Creature.svelte';
  import NeighborCreature from '$lib/components/NeighborCreature.svelte';
  import PlatformPulse from '$lib/components/PlatformPulse.svelte';

  import type { NeighborCreature as NeighborCreatureData } from '$lib/types';

  interface CreatureData {
    id: string;
    last_generated_at: string | null;
    frames: { id: string; ascii: string; weights: unknown }[];
    display_order: number;
    created_at: string;
    generation_count: number;
  }

  interface Props {
    neighbors: NeighborCreatureData[];
    active: number;
    total: number;
    allCreatures: CreatureData[];
  }

  let { neighbors, active, total, allCreatures }: Props = $props();

  const secondaryPositions = [
    { x: '30%', y: '75%' },
    { x: '70%', y: '25%' }
  ];

  const neighborPositions = [
    { x: '15%', y: '70%' },
    { x: '80%', y: '20%' },
    { x: '75%', y: '75%' }
  ];
</script>

<div class="relative w-full h-full flex items-center justify-center">
  <Creature />
  {#each allCreatures.slice(1) as secondary, i (secondary.id)}
    <NeighborCreature
      frames={secondary.frames}
      experience={null}
      creatureId={secondary.id}
      position={secondaryPositions[i % 2]}
      createdAt={secondary.created_at}
      generationCount={secondary.generation_count}
    />
  {/each}
  {#each neighbors.slice(0, 3) as neighbor, i (neighbor.creatureId)}
    <NeighborCreature
      frames={neighbor.frames}
      experience={neighbor.experience}
      creatureId={neighbor.creatureId}
      position={neighborPositions[i]}
      createdAt={neighbor.createdAt}
    />
  {/each}
  <PlatformPulse {active} {total} />
</div>
