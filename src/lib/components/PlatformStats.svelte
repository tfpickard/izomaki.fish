<script lang="ts">
  import type { PlatformStats } from '$lib/types';

  interface Props {
    stats: PlatformStats;
  }

  let { stats }: Props = $props();
</script>

{#if stats.totalCreatures > 0}
  <div class="flex gap-6 font-mono text-xs text-[var(--color-fg-dim)]">
    <span>{stats.totalCreatures} creatures</span>
    <span>{stats.totalFrames} frames</span>
    <span>{stats.activeCreatures} breathing now</span>
    <span>{stats.oldestCreatureAge}h oldest</span>
    <span>{stats.avgFramesPerCreature} avg frames</span>
  </div>
{/if}
