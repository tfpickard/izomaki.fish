<script lang="ts">
  interface CreatureData {
    id: string;
    created_at: string;
    generation_count: number;
    display_order: number;
    frames: { id: string }[];
  }

  interface Props {
    allCreatures: CreatureData[];
    maxCreatures: number;
  }

  let { allCreatures, maxCreatures }: Props = $props();

  let hatching = $state(false);

  function age(createdAt: string): string {
    const ms = Date.now() - new Date(createdAt).getTime();
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    if (d > 0) return `${d}d ${h}h`;
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  async function hatch() {
    hatching = true;
    const res = await fetch('/api/creature/create', { method: 'POST' });
    hatching = false;
    if (res.ok) window.location.reload();
  }

  async function setPrimary(id: string) {
    const res = await fetch('/api/creature/set-primary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatureId: id })
    });
    if (res.ok) window.location.reload();
  }

  async function deleteCreature(id: string) {
    if (!confirm('Delete this creature? This cannot be undone.')) return;
    const res = await fetch(`/api/creature/${id}`, { method: 'DELETE' });
    if (res.ok) window.location.reload();
  }
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <span class="text-neutral-600 text-xs">{allCreatures.length} / {maxCreatures}</span>
    <button
      onclick={hatch}
      disabled={hatching || allCreatures.length >= maxCreatures}
      class="text-emerald-600 hover:text-emerald-400 disabled:opacity-30 text-xs"
    >
      {hatching ? 'hatching…' : 'Hatch New Creature'}
    </button>
  </div>
  {#each allCreatures as c (c.id)}
    <div class="flex items-start gap-2 text-xs">
      <input
        type="radio"
        name="primary"
        checked={c.display_order === 0}
        onchange={() => setPrimary(c.id)}
        class="mt-0.5 accent-emerald-600"
      />
      <div class="flex flex-col gap-0.5 flex-1 min-w-0">
        <span class="text-neutral-400 font-mono">{c.id.slice(0, 8)}</span>
        <span class="text-neutral-600">{age(c.created_at)} · {c.frames.length} frames</span>
      </div>
      {#if c.display_order !== 0}
        <button
          onclick={() => deleteCreature(c.id)}
          class="text-neutral-700 hover:text-red-500 shrink-0"
        >×</button>
      {/if}
    </div>
  {/each}
</div>
