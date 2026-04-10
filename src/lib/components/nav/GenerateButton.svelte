<script lang="ts">
  interface Props {
    lastGeneratedAt: string | null;
  }

  let { lastGeneratedAt }: Props = $props();

  const COOLDOWN_MS = 5 * 60 * 1000;

  let now = $state(Date.now());
  let generating = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    const id = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(id);
  });

  function elapsed(): number {
    if (!lastGeneratedAt) return COOLDOWN_MS;
    return now - new Date(lastGeneratedAt).getTime();
  }

  function canGenerate(): boolean {
    return !generating && elapsed() >= COOLDOWN_MS;
  }

  function progress(): number {
    return Math.min(elapsed() / COOLDOWN_MS, 1);
  }

  function remaining(): string {
    const ms = COOLDOWN_MS - elapsed();
    if (ms <= 0) return '';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function generate() {
    if (!canGenerate()) return;
    generating = true;
    error = null;
    const res = await fetch('/api/creature/generate', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      error = body.error ?? 'failed';
    } else {
      lastGeneratedAt = new Date().toISOString();
    }
    generating = false;
  }

  const SIZE = 20;
  const RADIUS = 8;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
</script>

<button
  onclick={generate}
  disabled={!canGenerate()}
  class="relative flex items-center gap-2 font-mono text-xs disabled:opacity-50"
  aria-label="generate frame"
>
  <svg width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}" class="shrink-0">
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke="var(--color-border)"
      stroke-width="1.5"
    />
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke="var(--color-accent)"
      stroke-width="1.5"
      stroke-dasharray={CIRCUMFERENCE}
      stroke-dashoffset={CIRCUMFERENCE * (1 - progress())}
      stroke-linecap="round"
      transform="rotate(-90 {SIZE / 2} {SIZE / 2})"
      style="transition: stroke-dashoffset 1s linear;"
    />
  </svg>
  {#if generating}
    <span class="text-[var(--color-fg-dim)]">generating...</span>
  {:else if canGenerate()}
    <span class="text-[var(--color-fg-dim)]">generate</span>
  {:else}
    <span class="text-[var(--color-fg-faint)]">{remaining()}</span>
  {/if}
  {#if error}
    <span class="text-[var(--color-danger)]">{error}</span>
  {/if}
</button>
