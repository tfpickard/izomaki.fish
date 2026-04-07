<script lang="ts">
  interface Props {
    active: number;
    total: number;
  }

  let { active, total }: Props = $props();
</script>

{#if total > 1}
  <div class="absolute bottom-4 left-4" style="z-index: 2;">
    <span class="font-mono text-xs text-neutral-700 select-none">{active} / {total}</span>
  </div>
{/if}
