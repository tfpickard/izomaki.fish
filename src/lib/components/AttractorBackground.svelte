<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { stepAttractor } from '$lib/engine/attractor';
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  const GRID_W = 240;
  const GRID_H = 160;
  const STEPS = 50000;
  const HEATMAP_INTERVAL = 20000;

  // Fixed 30-degree rotation for stable attractor portrait
  const COS = Math.cos(Math.PI / 6);
  const SIN = Math.sin(Math.PI / 6);

  // Sprott-B coordinate ranges for projection
  const X_MIN = -2, X_MAX = 2;
  const Y_MIN = -2, Y_MAX = 2;
  const Z_MIN = -1, Z_MAX = 2;

  function projectPoint(x: number, y: number, z: number): { px: number; py: number } {
    const rx = x * COS - z * SIN;
    const rz = x * SIN + z * COS;
    const px = Math.floor(((rx - X_MIN) / (X_MAX - X_MIN)) * (GRID_W - 1));
    const py = Math.floor(((Y_MAX - (y + rz * 0.25)) / (Y_MAX - Y_MIN + (Z_MAX - Z_MIN) * 0.25)) * (GRID_H - 1));
    return { px, py };
  }

  function buildHeatmap(): Float32Array {
    const grid = new Float32Array(GRID_W * GRID_H);
    let state = { ...get(attractorState) };
    const celestial = get(celestialState);

    for (let i = 0; i < STEPS; i++) {
      state = stepAttractor(state, celestial);
      const { px, py } = projectPoint(state.x, state.y, state.z);
      if (px >= 0 && px < GRID_W && py >= 0 && py < GRID_H) {
        grid[py * GRID_W + px] += 1;
      }
    }

    return grid;
  }

  function renderToOffscreen(
    grid: Float32Array,
    offscreen: OffscreenCanvas,
    r: number,
    g: number,
    b: number
  ) {
    const ctx = offscreen.getContext('2d')!;
    const imgData = ctx.createImageData(GRID_W, GRID_H);
    const data = imgData.data;

    let max = 0;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] > max) max = grid[i];
    }
    if (max === 0) return;

    const logMax = Math.log(1 + max);
    for (let i = 0; i < grid.length; i++) {
      const density = grid[i] > 0 ? Math.log(1 + grid[i]) / logMax : 0;
      const idx = i * 4;
      data[idx]     = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = Math.round(density * 38); // max ~15% opacity
    }

    ctx.putImageData(imgData, 0, 0);
  }

  function parseAccentRgb(color: string): [number, number, number] {
    const m = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    return [52, 211, 153]; // fallback: #34d399
  }

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;
    let rafId: number;

    const offscreen = new OffscreenCanvas(GRID_W, GRID_H);
    let grid = buildHeatmap();

    function readAccentColor(): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent').trim() || '#34d399';
    }

    let [r, g, b] = parseAccentRgb(readAccentColor());
    renderToOffscreen(grid, offscreen, r, g, b);

    const mo = new MutationObserver(() => {
      [r, g, b] = parseAccentRgb(readAccentColor());
      renderToOffscreen(grid, offscreen, r, g, b);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    resize();

    let lastHeatmap = Date.now();

    function draw() {
      const now = Date.now();
      if (now - lastHeatmap >= HEATMAP_INTERVAL) {
        grid = buildHeatmap();
        renderToOffscreen(grid, offscreen, r, g, b);
        lastHeatmap = now;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreen, 0, 0, width, height);

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
  style="z-index: 0;"
></canvas>
