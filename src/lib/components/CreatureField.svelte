<script lang="ts">
  import Creature from '$lib/components/Creature.svelte';
  import AdminPanel from '$lib/components/AdminPanel.svelte';
  import AttractorVisualization from '$lib/components/AttractorVisualization.svelte';
  import NeighborCreature from '$lib/components/NeighborCreature.svelte';
  import PlatformPulse from '$lib/components/PlatformPulse.svelte';
  import UserMenu from '$lib/components/UserMenu.svelte';

  import type { NeighborCreature as NeighborCreatureData, UserProfile } from '$lib/types';

  interface Props {
    neighbors: NeighborCreatureData[];
    active: number;
    total: number;
    profile: UserProfile;
    creatureLastGeneratedAt: string | null;
  }

  let { neighbors, active, total, profile, creatureLastGeneratedAt }: Props = $props();

  const positions = [
    { x: '15%', y: '70%' },
    { x: '80%', y: '20%' },
    { x: '75%', y: '75%' }
  ];
</script>

<div class="relative w-screen h-screen overflow-hidden bg-neutral-950">
  <AttractorVisualization />
  <div class="relative w-full h-full" style="z-index: 1;">
    <Creature />
    {#each neighbors.slice(0, 3) as neighbor, i (neighbor.creatureId)}
      <NeighborCreature
        frames={neighbor.frames}
        experience={neighbor.experience}
        creatureId={neighbor.creatureId}
        position={positions[i]}
      />
    {/each}
    <UserMenu {profile} {creatureLastGeneratedAt} />
    <AdminPanel />
    <PlatformPulse {active} {total} />
  </div>
</div>
