<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import { SoundEngine } from '$lib/engine/sound';
  import { attractorState, creatureState } from '$lib/stores/creature';

  const engine = new SoundEngine();
  let enabled = $state(false);

  const soundInput = derived([attractorState, creatureState], ([$a, $s]) => ({ a: $a, s: $s }));
  let unsub = () => {};

  onMount(() => {
    enabled = localStorage.getItem('izomaki-sound') === 'true';
    if (enabled) {
      try {
        engine.start();
      } catch {
        enabled = false;
        localStorage.setItem('izomaki-sound', 'false');
      }
    }

    unsub = soundInput.subscribe(({ a, s }) => {
      if (engine.isRunning) engine.update(s, a.z);
    });
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
      try {
        engine.start();
        enabled = true;
      } catch {
        enabled = false;
      }
    }
    localStorage.setItem('izomaki-sound', String(enabled));
  }
</script>

<button
  onclick={toggle}
  class="text-neutral-600 hover:text-neutral-400 font-mono text-sm cursor-pointer px-2 py-1"
  aria-label="toggle sound"
>{enabled ? '♫' : '♪'}</button>
