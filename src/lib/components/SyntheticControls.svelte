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

<section class="flex flex-col gap-4 border-t border-neutral-800 pt-8">
  <h2 class="text-neutral-600 text-xs uppercase tracking-widest">synthetic population</h2>

  <div class="text-xs text-neutral-500 flex gap-4">
    <span>users: {syntheticUsers}</span>
    <span>creatures: {syntheticCreatures}</span>
  </div>

  <div class="flex items-center gap-2">
    <input
      type="number"
      min="1"
      max="50"
      bind:value={spawnCount}
      class="w-16 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs px-2 py-1 font-mono"
    />
    <button
      onclick={spawn}
      disabled={spawning}
      class="text-emerald-600 hover:text-emerald-400 disabled:opacity-40 text-sm"
    >
      {spawning ? 'spawning…' : 'spawn'}
    </button>
  </div>

  <div class="flex flex-col gap-3">
    <label class="flex flex-col gap-1 text-xs text-neutral-600">
      max creatures per user
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max="10"
          bind:value={maxCreatures}
          class="w-16 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs px-2 py-1 font-mono"
        />
        <button
          onclick={() => saveSetting('max_creatures_per_user', maxCreatures)}
          class="text-neutral-500 hover:text-neutral-300 text-xs"
        >save</button>
      </div>
    </label>
    <label class="flex flex-col gap-1 text-xs text-neutral-600">
      min creature floor
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="1"
          bind:value={minFloor}
          class="w-16 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs px-2 py-1 font-mono"
        />
        <button
          onclick={() => saveSetting('min_creature_floor', minFloor)}
          class="text-neutral-500 hover:text-neutral-300 text-xs"
        >save</button>
      </div>
    </label>
  </div>

  <button
    onclick={purge}
    disabled={purging}
    class="text-red-400 hover:text-red-300 disabled:opacity-40 text-sm text-left w-fit"
  >
    {purging ? 'purging…' : 'purge all synthetic'}
  </button>
</section>
