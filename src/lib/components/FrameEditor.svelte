<script lang="ts">
  import { frameStore } from '$lib/stores/frames';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import type { StateVector, Frame } from '$lib/engine/types';

  interface Props {
    editingFrame: Frame | null;
    onClear: () => void;
  }

  let { editingFrame, onClear }: Props = $props();

  let ascii = $state('');
  let weights = $state<StateVector>({
    wakefulness: 0.5,
    contentment: 0.5,
    curiosity: 0.5,
    agitation: 0.5,
    hunger: 0.5,
    presence: 0.5
  });

  $effect(() => {
    if (editingFrame) {
      ascii = editingFrame.ascii;
      weights = { ...editingFrame.weights };
    }
  });

  function save() {
    if (editingFrame) {
      frameStore.update(editingFrame.id, { ascii, weights: { ...weights } });
      clear();
    } else {
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
  }

  function clear() {
    onClear();
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
  {#if editingFrame}
    <div class="flex items-center justify-between text-[10px] font-mono text-[var(--color-fg-dim)]">
      <span>editing frame</span>
      <button onclick={clear} class="hover:text-[var(--color-fg)]">new frame</button>
    </div>
  {/if}

  <textarea
    bind:value={ascii}
    class="w-full font-mono text-xs bg-[var(--color-border)] text-[var(--color-fg)] border border-[var(--color-border)] p-2 resize-y min-h-[200px] focus:outline-none focus:border-[var(--color-fg-dim)]"
    placeholder=""
    spellcheck="false"
  ></textarea>

  <div class="space-y-2">
    {#each PARAMETER_KEYS as key}
      <div class="flex items-center gap-2 text-xs font-mono">
        <span class="w-24 text-[var(--color-fg-dim)] shrink-0">{key}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          bind:value={weights[key]}
          class="flex-1 accent-[var(--color-accent)]"
        />
        <span class="w-10 text-right text-[var(--color-fg)]">{weights[key].toFixed(2)}</span>
      </div>
    {/each}
  </div>

  <button
    onclick={save}
    class="w-full text-xs font-mono bg-[var(--color-bg-elev)] hover:bg-[var(--color-border)] text-[var(--color-fg)] py-1.5 border border-[var(--color-border)] hover:border-[var(--color-fg-faint)]"
  >
    {editingFrame ? 'update frame' : 'save frame'}
  </button>
</div>
