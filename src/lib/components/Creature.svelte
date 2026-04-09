<script lang="ts">
  import { displayAscii } from '$lib/stores/creature';
</script>

<div class="flex items-center justify-center w-full h-full">
  {#if $displayAscii}
    <pre class="font-mono text-emerald-400 opacity-90 leading-tight select-none">{$displayAscii}</pre>
  {/if}
</div>
