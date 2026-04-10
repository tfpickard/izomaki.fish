<script lang="ts">
  import { creatureState } from '$lib/stores/creature';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import type { StateVector } from '$lib/engine/types';

  interface Props {
    isOwner?: boolean;
  }

  let { isOwner = false }: Props = $props();

  const LABELS: Record<keyof StateVector, string> = {
    wakefulness: 'wake',
    contentment: 'content',
    curiosity: 'curious',
    agitation: 'agitated',
    hunger: 'hunger',
    presence: 'present'
  };

  function dominant(state: StateVector): string {
    let max = -1;
    let key: keyof StateVector = 'wakefulness';
    for (const k of PARAMETER_KEYS) {
      if (state[k] > max) {
        max = state[k];
        key = k;
      }
    }
    return LABELS[key];
  }

  // Hexagonal radar chart: 6 evenly-spaced axes
  function hexPath(state: StateVector, cx: number, cy: number, r: number): string {
    const points = PARAMETER_KEYS.map((k, i) => {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const v = state[k];
      return [cx + r * v * Math.cos(angle), cy + r * v * Math.sin(angle)];
    });
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
  }

  function hexGrid(cx: number, cy: number, r: number, steps: number): string[] {
    return Array.from({ length: steps }, (_, step) => {
      const frac = (step + 1) / steps;
      const points = PARAMETER_KEYS.map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return [cx + r * frac * Math.cos(angle), cy + r * frac * Math.sin(angle)];
      });
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
    });
  }

  function axisEnd(i: number, cx: number, cy: number, r: number): [number, number] {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const CX = 90;
  const CY = 90;
  const R = 75;
</script>

<div class="flex flex-col h-full bg-[var(--color-bg-elev)] border border-[var(--color-border)]">
  <div class="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
    <span class="font-mono text-xs text-[var(--color-fg-dim)] uppercase tracking-widest">mood</span>
    <span class="font-mono text-xs text-[var(--color-accent)]">{dominant($creatureState)}</span>
  </div>

  <div class="flex flex-col flex-1 items-center justify-center gap-4 px-4 py-4">
    <svg viewBox="0 0 180 180" class="w-full max-w-[180px]" aria-label="mood radar">
      <!-- Grid rings -->
      {#each hexGrid(CX, CY, R, 4) as d}
        <path {d} fill="none" stroke="var(--color-border)" stroke-width="0.5" />
      {/each}
      <!-- Axes -->
      {#each PARAMETER_KEYS as _key, i}
        {@const [ex, ey] = axisEnd(i, CX, CY, R)}
        <line x1={CX} y1={CY} x2={ex} y2={ey} stroke="var(--color-fg-faint)" stroke-width="0.5" />
      {/each}
      <!-- State fill -->
      <path
        d={hexPath($creatureState, CX, CY, R)}
        fill="var(--color-accent)"
        fill-opacity="0.15"
        stroke="var(--color-accent)"
        stroke-width="1"
      />
      <!-- Labels -->
      {#each PARAMETER_KEYS as key, i}
        {@const [ex, ey] = axisEnd(i, CX, CY, R + 12)}
        <text
          x={ex}
          y={ey}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="var(--color-fg-dim)"
          font-size="7"
          font-family="monospace"
        >{LABELS[key]}</text>
      {/each}
    </svg>

    <div class="w-full space-y-1 font-mono text-xs">
      {#each PARAMETER_KEYS as key}
        <div class="flex items-center gap-2">
          <span class="w-20 shrink-0 text-[var(--color-fg-dim)]">{key}</span>
          {#if isOwner}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={$creatureState[key]}
              class="flex-1 accent-[var(--color-accent)]"
              aria-label={key}
              oninput={(e) => {
                creatureState.update(s => ({ ...s, [key]: parseFloat((e.target as HTMLInputElement).value) }));
              }}
            />
          {:else}
            <div class="flex-1 bg-[var(--color-border)] h-1">
              <div
                class="bg-[var(--color-accent)]/40 h-1"
                style="width: {($creatureState[key] * 100).toFixed(1)}%"
              ></div>
            </div>
          {/if}
          <span class="w-10 text-right text-[var(--color-fg)]">{$creatureState[key].toFixed(2)}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
