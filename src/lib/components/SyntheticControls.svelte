<script lang="ts">
  interface Props {
    syntheticUsers: number;
    syntheticCreatures: number;
    maxCreaturesPerUser: number;
    minCreatureFloor: number;
  }

  let {
    syntheticUsers: initialSynUsers,
    syntheticCreatures: initialSynCreatures,
    maxCreaturesPerUser: initialMax,
    minCreatureFloor: initialFloor
  }: Props = $props();

  let syntheticUsers = $state(initialSynUsers);
  let syntheticCreatures = $state(initialSynCreatures);
  let spawnCount = $state(10);
  let spawning = $state(false);
  let purging = $state(false);
  let maxCreatures = $state(String(initialMax));
  let minFloor = $state(String(initialFloor));

  async function spawn() {
    spawning = true;
    const res = await fetch('/api/admin/synthetic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'spawn', count: spawnCount })
    });
    spawning = false;
    if (res.ok) {
      const body = await res.json() as { syntheticUsers: number; syntheticCreatures: number };
      syntheticUsers = body.syntheticUsers;
      syntheticCreatures = body.syntheticCreatures;
    }
  }

  async function purge() {
    if (!confirm('Delete all synthetic users and their creatures?')) return;
    purging = true;
    const res = await fetch('/api/admin/synthetic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'purge' })
    });
    purging = false;
    if (res.ok) {
      const body = await res.json() as { syntheticUsers: number; syntheticCreatures: number };
      syntheticUsers = body.syntheticUsers;
      syntheticCreatures = body.syntheticCreatures;
    }
  }

  async function saveSetting(key: string, value: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (!res.ok) {
      alert(`Failed to save ${key}`);
    }
  }
</script>

<section class="flex flex-col gap-4 pt-4">
  <h2 class="text-[var(--color-fg-dim)] text-xs uppercase tracking-widest">synthetic population</h2>

  <div class="text-xs text-[var(--color-fg-dim)] flex gap-4">
    <span>users: {syntheticUsers}</span>
    <span>creatures: {syntheticCreatures}</span>
  </div>

  <div class="flex items-center gap-2">
    <input
      type="number"
      min="1"
      max="50"
      bind:value={spawnCount}
      class="w-16 bg-[var(--color-bg-elev)] border border-[var(--color-border)] text-[var(--color-fg)] text-xs px-2 py-1 font-mono"
    />
    <button
      onclick={spawn}
      disabled={spawning}
      class="text-[var(--color-accent-dim)] hover:text-[var(--color-accent)] disabled:opacity-40 text-sm"
    >
      {spawning ? 'spawning...' : 'spawn'}
    </button>
  </div>

  <div class="flex flex-col gap-3">
    <label class="flex flex-col gap-1 text-xs text-[var(--color-fg-dim)]">
      max creatures per user
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="10"
          bind:value={maxCreatures}
          class="w-16 bg-[var(--color-bg-elev)] border border-[var(--color-border)] text-[var(--color-fg)] text-xs px-2 py-1 font-mono"
        />
        <button
          onclick={() => saveSetting('max_creatures_per_user', maxCreatures)}
          class="text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] text-xs"
        >save</button>
      </div>
    </label>
    <label class="flex flex-col gap-1 text-xs text-[var(--color-fg-dim)]">
      min creature floor
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="1"
          bind:value={minFloor}
          class="w-16 bg-[var(--color-bg-elev)] border border-[var(--color-border)] text-[var(--color-fg)] text-xs px-2 py-1 font-mono"
        />
        <button
          onclick={() => saveSetting('min_creature_floor', minFloor)}
          class="text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] text-xs"
        >save</button>
      </div>
    </label>
  </div>

  <button
    onclick={purge}
    disabled={purging}
    class="text-[var(--color-danger)] hover:opacity-80 disabled:opacity-40 text-sm text-left w-fit"
  >
    {purging ? 'purging...' : 'purge all synthetic'}
  </button>
</section>
