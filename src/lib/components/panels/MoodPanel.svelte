<script lang="ts">
  import { creatureState } from '$lib/stores/creature';
  import { PARAMETER_KEYS } from '$lib/engine/types';
  import type { StateVector } from '$lib/engine/types';

  interface DbFrame {
    id: string;
    ascii: string;
    weights: unknown;
    generation_index: number;
    created_at: string;
  }

  interface Props {
    isOwner?: boolean;
    frames?: DbFrame[];
  }

  let { isOwner = false, frames = [] }: Props = $props();

  let expanded = $state(false);
  let expandedFrameId = $state<string | null>(null);
  let editingFrameId = $state<string | null>(null);
  let editDraft = $state('');
  let saving = $state(false);
  let saveError = $state<string | null>(null);
  let localFrames = $state(frames);

  $effect(() => { localFrames = frames; });

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
      const pts = PARAMETER_KEYS.map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        return [cx + r * frac * Math.cos(angle), cy + r * frac * Math.sin(angle)];
      });
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
    });
  }

  function axisEnd(i: number, cx: number, cy: number, r: number): [number, number] {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  function framePreview(ascii: string): string {
    return ascii.split('\n').slice(0, 4).map(l => l.slice(0, 24)).join('\n');
  }

  function relativeAge(isoDate: string): string {
    const ms = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function startEdit(frame: DbFrame) {
    editingFrameId = frame.id;
    editDraft = frame.ascii;
  }

  function cancelEdit() {
    editingFrameId = null;
    editDraft = '';
  }

  async function saveEdit(frameId: string) {
    saving = true;
    saveError = null;
    try {
      const res = await fetch(`/api/creature/frame/${frameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ascii: editDraft })
      });
      if (res.ok) {
        localFrames = localFrames.map(f => f.id === frameId ? { ...f, ascii: editDraft } : f);
        editingFrameId = null;
        editDraft = '';
      } else {
        saveError = 'Save failed. Please try again.';
      }
    } catch {
      saveError = 'Save failed. Please try again.';
    } finally {
      saving = false;
    }
  }

  const sortedFrames = $derived([...localFrames].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ));

  const CX = 90;
  const CY = 90;
  const R = 75;
</script>

<div
  class="flex flex-col h-full bg-[var(--color-bg-elev)] border-l border-[var(--color-border)] overflow-hidden shrink-0"
  style="width: {expanded ? '18rem' : '2.5rem'}; transition: width 200ms ease;"
>
  {#if !expanded}
    <button
      class="flex flex-col items-center justify-start gap-3 h-full w-full px-1 py-4 text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors cursor-pointer"
      onclick={() => { expanded = true; }}
      aria-label="Expand mood panel"
    >
      <span class="font-mono text-xs" style="writing-mode: vertical-rl; transform: rotate(180deg);">
        {dominant($creatureState)}
      </span>
      <span class="text-[var(--color-fg-faint)] mt-auto font-mono text-xs" style="writing-mode: vertical-rl; transform: rotate(180deg);">mood</span>
    </button>
  {:else}
    <div class="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0">
      <span class="font-mono text-xs text-[var(--color-fg-dim)] uppercase tracking-widest">mood</span>
      <span class="font-mono text-xs text-[var(--color-accent)]">{dominant($creatureState)}</span>
      <button
        class="font-mono text-xs text-[var(--color-fg-faint)] hover:text-[var(--color-fg)] ml-2 cursor-pointer"
        onclick={() => { expanded = false; }}
        aria-label="Collapse mood panel"
      >‹</button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="flex justify-center px-4 pt-4">
        <svg viewBox="0 0 180 180" class="w-full max-w-[160px]" aria-label="mood radar">
          {#each hexGrid(CX, CY, R, 4) as d}
            <path {d} fill="none" stroke="var(--color-border)" stroke-width="0.5" />
          {/each}
          {#each PARAMETER_KEYS as _key, i}
            {@const [ex, ey] = axisEnd(i, CX, CY, R)}
            <line x1={CX} y1={CY} x2={ex} y2={ey} stroke="var(--color-fg-faint)" stroke-width="0.5" />
          {/each}
          <path
            d={hexPath($creatureState, CX, CY, R)}
            fill="var(--color-accent)"
            fill-opacity="0.15"
            stroke="var(--color-accent)"
            stroke-width="1"
          />
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
      </div>

      <div class="px-4 pb-4 space-y-1 font-mono text-xs">
        {#each PARAMETER_KEYS as key}
          <div class="flex items-center gap-2">
            <span class="w-16 shrink-0 text-[var(--color-fg-dim)]">{key}</span>
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
            <span class="w-8 text-right text-[var(--color-fg)]">{$creatureState[key].toFixed(2)}</span>
          </div>
        {/each}
      </div>

      <div class="border-t border-[var(--color-border)] mx-4"></div>

      <div class="px-4 py-3">
        <div class="flex items-center justify-between font-mono text-xs mb-2">
          <span class="text-[var(--color-fg-dim)] uppercase tracking-widest">frames</span>
          <span class="text-[var(--color-fg-faint)]">{localFrames.length}</span>
        </div>

        {#if localFrames.length === 0}
          <p class="font-mono text-xs text-[var(--color-fg-faint)]">no frames yet</p>
        {:else}
          <div class="space-y-2">
            {#each sortedFrames as frame (frame.id)}
              <div class="border border-[var(--color-border)] bg-[var(--color-bg)]">
                <button
                  class="w-full flex items-center justify-between px-2 py-1 font-mono text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] cursor-pointer"
                  onclick={() => {
                    expandedFrameId = expandedFrameId === frame.id ? null : frame.id;
                    if (editingFrameId === frame.id) cancelEdit();
                  }}
                >
                  <span>#{frame.generation_index}</span>
                  <span class="text-[var(--color-fg-faint)]">{relativeAge(frame.created_at)}</span>
                </button>

                {#if expandedFrameId === frame.id}
                  <div class="border-t border-[var(--color-border)] p-2">
                    {#if editingFrameId === frame.id}
                      <textarea
                        class="w-full font-mono text-xs text-[var(--color-accent)] bg-transparent resize-none outline-none leading-tight"
                        rows={12}
                        bind:value={editDraft}
                        spellcheck={false}
                      ></textarea>
                      <div class="flex gap-2 mt-1 items-center flex-wrap">
                        <button
                          class="font-mono text-xs text-[var(--color-accent)] hover:opacity-70 cursor-pointer disabled:opacity-40"
                          disabled={saving}
                          onclick={() => saveEdit(frame.id)}
                        >{saving ? 'saving...' : 'save'}</button>
                        <button
                          class="font-mono text-xs text-[var(--color-fg-faint)] hover:text-[var(--color-fg)] cursor-pointer"
                          onclick={cancelEdit}
                        >cancel</button>
                        {#if saveError}
                          <span class="font-mono text-xs text-[var(--color-danger)]">{saveError}</span>
                        {/if}
                      </div>
                    {:else}
                      <pre class="font-mono text-xs text-[var(--color-accent)] opacity-80 leading-tight overflow-x-auto whitespace-pre">{frame.ascii}</pre>
                      {#if isOwner}
                        <button
                          class="font-mono text-xs text-[var(--color-fg-faint)] hover:text-[var(--color-fg)] mt-1 cursor-pointer"
                          onclick={() => startEdit(frame)}
                        >edit</button>
                      {/if}
                    {/if}
                  </div>
                {:else}
                  <pre class="font-mono text-[10px] text-[var(--color-fg-faint)] px-2 pb-2 leading-tight overflow-hidden whitespace-pre">{framePreview(frame.ascii)}</pre>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
