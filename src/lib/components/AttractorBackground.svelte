<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { computeTrail, project } from '$lib/engine/visualization';
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  let canvas: HTMLCanvasElement;
  let rafId: number;

  const startTime = Date.now();
  const TRAIL_UPDATE_INTERVAL = 1000;

  onMount(() => {
    let trail = computeTrail(get(attractorState), get(celestialState), 5000);
    let lastTrailUpdate = 0;
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    resize();

    function readAccentColor(): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent').trim() || '#34d399';
    }

    let accentColor = readAccentColor();

    const mo = new MutationObserver(() => { accentColor = readAccentColor(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function draw() {
      const now = Date.now();
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (now - lastTrailUpdate >= TRAIL_UPDATE_INTERVAL) {
        trail = computeTrail(get(attractorState), get(celestialState), 5000);
        lastTrailUpdate = now;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const time = now - startTime;

      for (const point of trail) {
        const { x, y, opacity } = project(point, time, width, height);
        ctx.globalAlpha = opacity * 0.3;
        ctx.fillStyle = accentColor;
        ctx.fillRect(x, y, 1, 1);
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      mo.disconnect();
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 w-full h-full pointer-events-none"
  style="z-index: 0; image-rendering: pixelated;"
></canvas>
