<script lang="ts">
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';
  import { getModulatedConstants } from '$lib/engine/attractor';
  import { derived } from 'svelte/store';

  const constants = derived(
    [attractorState, celestialState],
    ([_attractor, $celestial]) => getModulatedConstants($celestial)
  );
</script>

<div class="font-mono text-xs text-neutral-500 space-y-1">
  <div class="flex gap-4">
    <span>x <span class="text-neutral-400">{$attractorState.x.toFixed(4)}</span></span>
    <span>y <span class="text-neutral-400">{$attractorState.y.toFixed(4)}</span></span>
    <span>z <span class="text-neutral-400">{$attractorState.z.toFixed(4)}</span></span>
  </div>
  <div class="flex gap-4">
    <span>sun <span class="text-neutral-400">{$celestialState.sun.toFixed(4)}</span></span>
    <span>moon <span class="text-neutral-400">{$celestialState.moon.toFixed(4)}</span></span>
  </div>
  <div class="flex gap-4">
    <span>σ <span class="text-neutral-400">{$constants.sigma.toFixed(4)}</span></span>
    <span>ρ <span class="text-neutral-400">{$constants.rho.toFixed(4)}</span></span>
    <span>β <span class="text-neutral-400">{$constants.beta.toFixed(4)}</span></span>
  </div>
</div>
