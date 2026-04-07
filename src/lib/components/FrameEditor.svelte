<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import type { StateVector } from '$lib/engine/types';

  let ascii = $state('');
  let weights = $state<StateVector>({
    wakefulness: 0.5,
    contentment: 0.5,
    curiosity: 0.5,
    agitation: 0.5,
    hunger: 0.5,
    presence: 0.5
  });

  function save() {
    frameStore.add({
      id: crypto.randomUUID(),
      ascii,
      weights: { ...weights },
      createdAt: Date.now()
    });
    ascii = '';
    weights = {
      wakefulness: 0.5,
      contentment: 0.5,
      curiosity: 0.5,
      agitation: 0.5,
      hunger: 0.5,
      presence: 0.5
    };
  }
</script>

<div class="space-y-3">
  <textarea
    bind:value={ascii}
    class="w-full font-mono text-xs bg-neutral-800 text-neutral-300 border border-neutral-700 p-2 resize-y min-h-[200px] focus:outline-none focus:border-neutral-600"
    placeholder=""
    spellcheck="false"
  ></textarea>

  <div class="space-y-2">
    {#each PARAMETER_KEYS as key}
      <div class="flex items-center gap-2 text-xs font-mono">
        <span class="w-24 text-neutral-500 shrink-0">{key}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          bind:value={weights[key]}
          class="flex-1 accent-emerald-500"
        />
        <span class="w-10 text-right text-neutral-400">{weights[key].toFixed(2)}</span>
      </div>
    {/each}
  </div>

  <button
    onclick={save}
    class="w-full text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-1.5 rounded border border-neutral-700 hover:border-neutral-600"
  >
    save frame
  </button>
</div>
