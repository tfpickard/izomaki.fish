<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import { SoundEngine } from '$lib/engine/sound';
  import { attractorState, creatureState } from '$lib/stores/creature';

  const engine = new SoundEngine();
  let enabled = $state(false);

  const soundInput = derived([attractorState, creatureState], ([$a, $s]) => ({ a: $a, s: $s }));
  const unsub = soundInput.subscribe(({ a, s }) => {
    if (engine.isRunning) engine.update(s, a.z);
  });

  onMount(() => {
    enabled = localStorage.getItem('izomaki-sound') === 'true';
    if (enabled) engine.start();
  });

  onDestroy(() => {
    unsub();
    engine.stop();
  });

  function toggle() {
    if (enabled) {
      engine.stop();
      enabled = false;
    } else {
      engine.start();
      enabled = true;
    }
    localStorage.setItem('izomaki-sound', String(enabled));
  }
</script>

<button
  onclick={toggle}
  class="text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] font-mono text-sm cursor-pointer px-2 py-1"
  aria-label="toggle sound"
>{enabled ? '♫' : '♪'}</button>
