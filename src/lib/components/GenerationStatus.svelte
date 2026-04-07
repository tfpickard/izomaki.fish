<script lang="ts">
  interface Props {
    lastGeneratedAt: string | null;
    nextGenerationAt: string | null;
    frames: { created_at: string }[];
  }

  let { lastGeneratedAt, nextGenerationAt, frames }: Props = $props();

  let now = $state(Date.now());
  let generating = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    const interval = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(interval);
  });

  function formatDuration(ms: number): string {
    if (ms < 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function timeSince(): string {
    if (!lastGeneratedAt) return '—';
    return formatDuration(now - new Date(lastGeneratedAt).getTime());
  }

  function timeUntil(): string {
    if (!nextGenerationAt) return '—';
    return formatDuration(new Date(nextGenerationAt).getTime() - now);
  }

  async function forceGenerate() {
    generating = true;
    error = null;
    const res = await fetch('/api/generate', { method: 'POST' });
    generating = false;
    if (!res.ok) {
      const body = await res.json();
      error = body.error ?? 'Failed';
    }
  }

  const sortedFrames = $derived([...frames].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ));
</script>

<div class="font-mono text-xs text-neutral-500 flex flex-col gap-2">
  <div class="flex gap-4">
    <span>frames: {frames.length}</span>
    <span>last: {timeSince()} ago</span>
    <span>next: {timeUntil()}</span>
  </div>

  <button
    onclick={forceGenerate}
    disabled={generating}
    class="text-emerald-500 hover:text-emerald-400 disabled:opacity-40 text-left"
  >
    {generating ? 'generating…' : 'Generate Now'}
  </button>

  {#if error}
    <span class="text-red-500">{error}</span>
  {/if}

  {#if sortedFrames.length > 0}
    <div class="flex flex-col gap-1 mt-1">
      {#each sortedFrames as frame}
        <span class="text-neutral-600">{new Date(frame.created_at).toISOString().replace('T', ' ').slice(0, 19)}</span>
      {/each}
    </div>
  {/if}
</div>
