<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { computeTrail, project, type TrailPoint } from '$lib/engine/visualization';
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  let canvas: HTMLCanvasElement;
  let rafId: number;

  const startTime = Date.now();
  let trail: TrailPoint[] = [];
  let lastTrailUpdate = 0;
  const TRAIL_UPDATE_INTERVAL = 500;

  let liveX = $state(0);
  let liveY = $state(0);
  let liveZ = $state(0);

  onMount(() => {
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const displayW = canvas.offsetWidth;
      const displayH = canvas.offsetHeight;
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    function accentColor(): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent').trim() || '#34d399';
    }

    function draw() {
      const now = Date.now();
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      if (now - lastTrailUpdate >= TRAIL_UPDATE_INTERVAL) {
        const attractor = get(attractorState);
        const celestial = get(celestialState);
        liveX = attractor.x;
        liveY = attractor.y;
        liveZ = attractor.z;
        trail = computeTrail(attractor, celestial);
        lastTrailUpdate = now;
      }

      ctx.clearRect(0, 0, width * dpr, height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const time = now - startTime;
      const color = accentColor();

      for (const point of trail) {
        const { x, y, opacity } = project(point, time, width, height);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  });
</script>

<div class="flex flex-col h-full bg-[var(--color-bg-elev)] border border-[var(--color-border)]">
  <div class="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
    <span class="font-mono text-xs text-[var(--color-fg-dim)] uppercase tracking-widest">attractor</span>
    <span class="font-mono text-xs text-[var(--color-fg-dim)]">sprott-b</span>
  </div>

  <div class="flex-1 relative min-h-0">
    <canvas
      bind:this={canvas}
      class="absolute inset-0 w-full h-full"
      style="image-rendering: pixelated;"
    ></canvas>
  </div>

  <div class="px-4 py-3 border-t border-[var(--color-border)] flex gap-6 font-mono text-xs">
    <span class="text-[var(--color-fg-dim)]">x <span class="text-[var(--color-accent)]">{liveX.toFixed(4)}</span></span>
    <span class="text-[var(--color-fg-dim)]">y <span class="text-[var(--color-accent)]">{liveY.toFixed(4)}</span></span>
    <span class="text-[var(--color-fg-dim)]">z <span class="text-[var(--color-accent)]">{liveZ.toFixed(4)}</span></span>
    <span class="text-[var(--color-fg-faint)] ml-auto">2Hz</span>
  </div>
</div>
