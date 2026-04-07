<script lang="ts">
  import type { StateVector } from '$lib/engine/types';

  interface DbFrame {
    id: string;
    ascii: string;
    weights: StateVector;
    generation_index: number;
    created_at: string;
  }

  interface Creature {
    id: string;
    created_at: string;
    generation_count: number;
    last_generated_at: string | null;
    next_generation_at: string | null;
  }

  interface Props {
    creature: Creature;
    frames: DbFrame[];
  }

  let { creature, frames: initialFrames }: Props = $props();

  let frames = $state<DbFrame[]>([...initialFrames]);
  let generating = $state(false);
  let now = $state(Date.now());

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

  async function deleteFrame(id: string) {
    await fetch(`/api/frames/${id}`, { method: 'DELETE' });
    frames = frames.filter(f => f.id !== id);
  }

  async function forceGenerate() {
    generating = true;
    const res = await fetch('/api/generate', { method: 'POST' });
    generating = false;
    if (res.ok) {
      const framesRes = await fetch('/api/frames');
      if (framesRes.ok) {
        frames = await framesRes.json();
      }
    }
  }

  async function resetCreature() {
    if (!confirm('Delete all frames and experience, and regenerate from scratch?')) return;
    await fetch('/api/admin/reset', { method: 'POST' });
    window.location.reload();
  }

  async function deleteAccount() {
    if (!confirm('Delete your account, creature, all frames, and all experience? This cannot be undone.')) return;
    await fetch('/api/admin/delete', { method: 'POST' });
    window.location.href = '/';
  }
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-300 font-mono p-8 flex flex-col gap-8">
  <div class="flex items-center justify-between">
    <a href="/" class="text-neutral-600 hover:text-neutral-400 text-sm">← back</a>
    <form method="POST" action="/auth/logout">
      <button type="submit" class="text-neutral-600 hover:text-neutral-400 text-sm">sign out</button>
    </form>
  </div>

  <section class="flex flex-col gap-2">
    <h2 class="text-neutral-600 text-xs uppercase tracking-widest">creature</h2>
    <div class="flex flex-col gap-1 text-xs text-neutral-500">
      <span>id: {creature.id.slice(0, 8)}</span>
      <span>born: {new Date(creature.created_at).toISOString().split('T')[0]}</span>
      <span>frames: {frames.length}</span>
      <span>generations: {creature.generation_count}</span>
      <span>last generation: {creature.last_generated_at ? formatDuration(now - new Date(creature.last_generated_at).getTime()) + ' ago' : '—'}</span>
      <span>next generation: {creature.next_generation_at ? formatDuration(new Date(creature.next_generation_at).getTime() - now) : '—'}</span>
    </div>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-neutral-600 text-xs uppercase tracking-widest">generation</h2>
    <button
      onclick={forceGenerate}
      disabled={generating}
      class="text-emerald-500 hover:text-emerald-400 disabled:opacity-40 text-sm text-left w-fit"
    >
      {generating ? 'generating…' : 'Generate Now'}
    </button>
  </section>

  <section class="flex flex-col gap-2">
    <h2 class="text-neutral-600 text-xs uppercase tracking-widest">frames ({frames.length})</h2>
    {#if frames.length === 0}
      <span class="text-neutral-700 text-xs">no frames</span>
    {:else}
      <div class="flex flex-col gap-4">
        {#each frames as frame (frame.id)}
          <div class="border border-neutral-800 p-3 flex flex-col gap-2">
            <div class="flex items-start justify-between gap-4">
              <pre class="text-emerald-400 text-xs leading-tight opacity-80 max-h-32 overflow-hidden">{frame.ascii.split('\n').slice(0, 6).join('\n')}</pre>
              <button
                onclick={() => deleteFrame(frame.id)}
                class="text-neutral-700 hover:text-red-500 text-xs shrink-0"
              >×</button>
            </div>
            <div class="text-neutral-700 text-xs flex gap-3 flex-wrap">
              {#each Object.entries(frame.weights) as [k, v]}
                <span>{k.slice(0, 3)}: {(v as number).toFixed(2)}</span>
              {/each}
            </div>
            <span class="text-neutral-700 text-xs">{new Date(frame.created_at).toISOString().replace('T', ' ').slice(0, 19)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="flex flex-col gap-3 border-t border-neutral-800 pt-8">
    <h2 class="text-neutral-600 text-xs uppercase tracking-widest">danger</h2>
    <button
      onclick={resetCreature}
      class="text-neutral-500 hover:text-neutral-300 text-sm text-left w-fit border border-neutral-800 hover:border-neutral-600 px-3 py-1 transition-colors"
    >
      Reset Creature
    </button>
    <button
      onclick={deleteAccount}
      class="text-red-900 hover:text-red-600 text-sm text-left w-fit border border-red-900 hover:border-red-700 px-3 py-1 transition-colors"
    >
      Delete Account
    </button>
  </section>
</div>
