<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import type { Frame } from '$lib/engine/types';

  interface Props {
    onEdit: (frame: Frame) => void;
    editingId: string | null;
  }

  let { onEdit, editingId }: Props = $props();

  let hoveredId = $state<string | null>(null);
</script>

<div class="space-y-1 font-mono text-xs">
  {#if $frameStore.length === 0}
    <span class="text-[var(--color-fg-dim)]">no frames</span>
  {:else}
    {#each $frameStore as frame (frame.id)}
      <div
        class="group relative flex items-start gap-2 py-1 border-b border-[var(--color-border)]"
        onmouseenter={() => hoveredId = frame.id}
        onmouseleave={() => hoveredId = null}
        role="listitem"
      >
        <button
          class="flex-1 flex items-start gap-2 text-left min-w-0"
          onclick={() => onEdit(frame)}
        >
          <span class="flex-1 truncate {frame.id === editingId ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-dim)]'}">
            {frame.ascii.split('\n')[0].slice(0, 40)}
          </span>
          <span class="text-[var(--color-fg-faint)] shrink-0 text-[10px]">
            {PARAMETER_KEYS.map(k => frame.weights[k].toFixed(1)).join(' ')}
          </span>
        </button>
        <button
          onclick={() => frameStore.remove(frame.id)}
          aria-label="delete frame"
          class="text-[var(--color-danger)] hover:opacity-80 shrink-0 px-1"
        >
          ×
        </button>

        {#if hoveredId === frame.id}
          <div class="absolute left-0 top-full z-10 bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2 whitespace-pre text-[var(--color-fg)] text-[10px] leading-tight max-w-64 overflow-hidden">
            {frame.ascii}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
