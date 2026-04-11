<script lang="ts">
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';
  import { getSprottBParams } from '$lib/engine/attractor';
  import { derived } from 'svelte/store';

  const params = derived(
    [attractorState, celestialState],
    ([_attractor, $celestial]) => getSprottBParams($celestial)
  );
</script>

<div class="font-mono text-xs text-[var(--color-fg-dim)] space-y-1">
  <div class="flex gap-4">
    <span>x <span class="text-[var(--color-fg)]">{$attractorState.x.toFixed(4)}</span></span>
    <span>y <span class="text-[var(--color-fg)]">{$attractorState.y.toFixed(4)}</span></span>
    <span>z <span class="text-[var(--color-fg)]">{$attractorState.z.toFixed(4)}</span></span>
  </div>
  <div class="flex gap-4">
    <span>sun <span class="text-[var(--color-fg)]">{$celestialState.sun.toFixed(4)}</span></span>
    <span>moon <span class="text-[var(--color-fg)]">{$celestialState.moon.toFixed(4)}</span></span>
  </div>
  <div class="flex gap-4">
    <span>a <span class="text-[var(--color-fg)]">{$params.a.toFixed(4)}</span></span>
    <span>b <span class="text-[var(--color-fg)]">{$params.b.toFixed(4)}</span></span>
    <span>c <span class="text-[var(--color-fg)]">{$params.c.toFixed(4)}</span></span>
  </div>
</div>
