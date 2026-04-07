<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { selectedFrameId } from '$lib/stores/creature';
  import { derived } from 'svelte/store';

  const currentFrame = derived(
    [frameStore, selectedFrameId],
    ([$frames, $id]) => $frames.find(f => f.id === $id) ?? null
  );
</script>

<div class="flex items-center justify-center w-full h-full">
  {#if $currentFrame}
    <pre class="font-mono text-emerald-400 opacity-90 leading-tight select-none">{$currentFrame.ascii}</pre>
  {/if}
</div>
