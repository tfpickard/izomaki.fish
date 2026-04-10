<script lang="ts">
  interface Props {
    createdAt: string;
    generationCount: number;
    frameCount: number;
    nextGenerationAt: string | null;
  }

  let { createdAt, generationCount, frameCount, nextGenerationAt }: Props = $props();

  let now = $state(Date.now());

  $effect(() => {
    const id = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(id);
  });

  function ageDays(): number {
    return Math.floor((now - new Date(createdAt).getTime()) / 86400000);
  }

  function countdown(): string {
    if (!nextGenerationAt) return '--';
    const ms = new Date(nextGenerationAt).getTime() - now;
    if (ms <= 0) return 'soon';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }
</script>

<div class="flex items-center gap-6 px-4 py-2 border-t border-[var(--color-border)] font-mono text-xs text-[var(--color-fg-dim)]">
  <span>age {ageDays()}d</span>
  <span>gen {generationCount}</span>
  <span>frames {frameCount}</span>
  <span>next frame in {countdown()}</span>
</div>
