<script lang="ts">
  import { creatureState, selectedFrameId } from '$lib/stores/creature';
  import { PARAMETER_KEYS } from '$lib/engine/types';
</script>

<div class="font-mono text-xs text-[var(--color-fg-dim)] space-y-1">
  {#each PARAMETER_KEYS as key}
    <div class="flex items-center gap-2">
      <span class="w-24 shrink-0">{key}</span>
      <div class="flex-1 bg-[var(--color-border)] h-1">
        <div class="bg-[var(--color-accent)]/30 h-1 transition-none" style="width: {($creatureState[key] * 100).toFixed(1)}%"></div>
      </div>
      <span class="w-10 text-right">{$creatureState[key].toFixed(3)}</span>
    </div>
  {/each}
  <div class="pt-1 text-[var(--color-fg-faint)]">
    frame: {$selectedFrameId ? $selectedFrameId.slice(0, 8) : 'none'}
  </div>
</div>
