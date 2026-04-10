<script lang="ts">
  interface Props {
    id: string;
    createdAt: string;
    generationCount: number;
    frameCount: number;
  }

  let { id, createdAt, generationCount, frameCount }: Props = $props();
</script>

<div class="font-mono text-xs text-[var(--color-fg-dim)] flex flex-col gap-1">
  <span>id: {id.slice(0, 8)}</span>
  <span>born: {new Date(createdAt).toISOString().split('T')[0]}</span>
  <span>frames: {frameCount}</span>
  <span>generations: {generationCount}</span>
</div>
