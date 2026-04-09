<script lang="ts">
  import Creature from '$lib/components/Creature.svelte';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import AttractorVisualization from '$lib/components/AttractorVisualization.svelte';
  import NeighborCreature from '$lib/components/NeighborCreature.svelte';
  import PlatformPulse from '$lib/components/PlatformPulse.svelte';
  import UserMenu from '$lib/components/UserMenu.svelte';

  import type { NeighborCreature as NeighborCreatureData, UserProfile } from '$lib/types';

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
    profile: UserProfile;
    creatureLastGeneratedAt: string | null;
    allCreatures: CreatureData[];
    maxCreatures: number;
  }

  let { neighbors, active, total, profile, creatureLastGeneratedAt, allCreatures, maxCreatures }: Props = $props();

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

<div class="relative w-screen h-screen overflow-hidden bg-neutral-950">
  <AttractorVisualization />
  <div class="relative w-full h-full" style="z-index: 1;">
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
    <UserMenu {profile} {creatureLastGeneratedAt} />
    <AdminPanel {allCreatures} {maxCreatures} />
    <PlatformPulse {active} {total} />
  </div>
</div>
