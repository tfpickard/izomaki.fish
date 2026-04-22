<script lang="ts">
  import { displayAscii } from '$lib/stores/creature';
</script>

<div class="flex items-center justify-center w-full h-full overflow-hidden">
  {#if $displayAscii}
    <pre class="font-mono text-[var(--color-accent)] opacity-90 leading-tight select-none max-w-full max-h-full overflow-hidden">{$displayAscii}</pre>
  {/if}
</div>
