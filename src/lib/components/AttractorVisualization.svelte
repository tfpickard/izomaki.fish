<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { computeTrail, project, type TrailPoint } from '$lib/engine/visualization';
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const startTime = Date.now();

    // Trail is recomputed at 2Hz, not every animation frame.
    let trail: TrailPoint[] = [];
    let lastTrailUpdate = 0;
    const TRAIL_UPDATE_INTERVAL = 500;

    function draw() {
      const now = Date.now();
      const width = canvas.width;
      const height = canvas.height;

      if (now - lastTrailUpdate >= TRAIL_UPDATE_INTERVAL) {
        const attractor = get(attractorState);
        const celestial = get(celestialState);
        trail = computeTrail(attractor, celestial);
        lastTrailUpdate = now;
      }

      ctx!.clearRect(0, 0, width, height);
      const time = now - startTime;

      for (const point of trail) {
        const { x, y, opacity } = project(point, time, width, height);
        ctx!.globalAlpha = opacity;
        ctx!.fillStyle = '#34d399';
        ctx!.fillRect(x, y, 1, 1);
      }

      rafId = requestAnimationFrame(draw);
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0"
  style="z-index: 0;"
></canvas>
