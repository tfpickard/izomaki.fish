<script lang="ts">
  import { trajectories } from '$lib/stores/creature';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'izomaki-trajectories';

  onMount(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        trajectories.set(JSON.parse(raw));
      } catch {
        // malformed storage -- leave defaults
      }
    }
  });
</script>

<div class="space-y-4 font-mono text-xs">
  {#each PARAMETER_KEYS as param}
    <div class="space-y-1">
      <div class="text-[var(--color-fg)]">{param}</div>
      {#each [
        { field: 'frequency' as const, label: 'freq', min: 0, max: 0.5, step: 0.001 },
        { field: 'amplitude' as const, label: 'amp',  min: 0, max: 1,   step: 0.01  },
        { field: 'phase'     as const, label: 'phase', min: 0, max: Math.PI * 2, step: 0.01 },
        { field: 'noise'     as const, label: 'noise', min: 0, max: 0.2, step: 0.001 }
      ] as cfg}
        <div class="flex items-center gap-2">
          <span class="w-12 text-[var(--color-fg-dim)] shrink-0">{cfg.label}</span>
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={$trajectories[param][cfg.field]}
            oninput={(e) => {
              trajectories.update(t => {
                const next = { ...t, [param]: { ...t[param], [cfg.field]: parseFloat((e.target as HTMLInputElement).value) } };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                return next;
              });
            }}
            class="flex-1 accent-[var(--color-accent)]"
          />
          <span class="w-12 text-right text-[var(--color-fg)]">{$trajectories[param][cfg.field].toFixed(3)}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
