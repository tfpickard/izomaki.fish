<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { PARAMETER_KEYS } from '$lib/engine/types';

  let hoveredId = $state<string | null>(null);
</script>

<div class="space-y-1 font-mono text-xs">
  {#if $frameStore.length === 0}
    <span class="text-neutral-600">no frames</span>
  {:else}
    {#each $frameStore as frame (frame.id)}
      <div
        class="group relative flex items-start gap-2 py-1 border-b border-neutral-800"
        onmouseenter={() => hoveredId = frame.id}
        onmouseleave={() => hoveredId = null}
        role="listitem"
      >
        <span class="flex-1 text-neutral-500 truncate">
          {frame.ascii.split('\n')[0].slice(0, 40)}
        </span>
        <span class="text-neutral-700 shrink-0 text-[10px]">
          {PARAMETER_KEYS.map(k => frame.weights[k].toFixed(1)).join(' ')}
        </span>
        <button
          onclick={() => frameStore.remove(frame.id)}
          class="text-red-400 hover:text-red-300 shrink-0 px-1"
        >
          ×
        </button>

        {#if hoveredId === frame.id}
          <div class="absolute left-0 top-full z-10 bg-neutral-900 border border-neutral-700 p-2 whitespace-pre text-neutral-400 text-[10px] leading-tight max-w-64 overflow-hidden">
            {frame.ascii}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
