<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { stepAttractor } from '$lib/engine/attractor';
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  const GRID_W = 40;
  const GRID_H = 25;
  const STEPS_PER_FRAME = 300;
  // Per-frame decay: half-life ~23s at 60fps
  const DECAY = 0.9995;
  // EMA smoothing for throb: half-life ~6s at 60fps
  const THROB_SMOOTH = 0.998;
  // Cells fully fade 30s after last visit
  const MAX_AGE_MS = 30_000;
  // Peak cell opacity (out of 255)
  const ALPHA_SCALE = 200;
  // Muted target for high-density cells (cool grey, slight blue)
  const MUTED_R = 80;
  const MUTED_G = 80;
  const MUTED_B = 90;

  const COS = Math.cos(Math.PI / 6);
  const SIN = Math.sin(Math.PI / 6);
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

  function parseAccentRgb(color: string): [number, number, number] {
    const m = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    return [52, 211, 153];
  }

  function makeOffscreen(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;
    let rafId: number;

    const offscreen = makeOffscreen(GRID_W, GRID_H);
    const offCtx = offscreen.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
    if (!offCtx) return;

    // Per-cell state: last visit timestamp (0 = never) and decaying visit counter
    const lastVisit = new Float32Array(GRID_W * GRID_H);
    const visitCount = new Float32Array(GRID_W * GRID_H);
    let maxVisitCount = 1;
    let attractorPos = { ...get(attractorState) };
    const imgData = offCtx.createImageData(GRID_W, GRID_H);

    function readAccentColor(): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent').trim() || '#34d399';
    }

    let [ar, ag, ab] = parseAccentRgb(readAccentColor());

    const mo = new MutationObserver(() => { [ar, ag, ab] = parseAccentRgb(readAccentColor()); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Preserve chunky grid when upscaling; must be reapplied after setTransform
      ctx.imageSmoothingEnabled = false;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    resize();

    let throbEma = 0.5;
    let lastTime = performance.now();

    function draw(now: number) {
      if (!offCtx) return;
      const dt = Math.min((now - lastTime) / (1000 / 60), 4);
      lastTime = now;

      const celestial = get(celestialState);
      const steps = Math.round(STEPS_PER_FRAME * dt);

      // Step the attractor, recording last-visit time and incrementing density
      for (let i = 0; i < steps; i++) {
        attractorPos = stepAttractor(attractorPos, celestial);
        const { px, py } = projectPoint(attractorPos.x, attractorPos.y, attractorPos.z);
        if (px >= 0 && px < GRID_W && py >= 0 && py < GRID_H) {
          const idx = py * GRID_W + px;
          lastVisit[idx] = now;
          visitCount[idx] += 1;
        }
      }

      // Decay density and track running max for normalization
      const decay = Math.pow(DECAY, dt);
      let newMax = 0;
      for (let i = 0; i < visitCount.length; i++) {
        visitCount[i] *= decay;
        if (visitCount[i] > newMax) newMax = visitCount[i];
      }
      maxVisitCount = Math.max(newMax, 1);
      const logMax = Math.log(1 + maxVisitCount);

      // Render each cell: brightness bell-curve on recency, hue lerp on density (inverted)
      const data = imgData.data;
      for (let i = 0; i < lastVisit.length; i++) {
        const idx = i * 4;
        const visited = lastVisit[i];
        if (visited === 0) {
          data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0;
          continue;
        }
        const age = now - visited;
        if (age >= MAX_AGE_MS) {
          data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0;
          continue;
        }
        const t = age / MAX_AGE_MS;
        const brightness = 4 * t * (1 - t); // 0 at t=0, peak 1 at t=0.5, 0 at t=1
        const density = visitCount[i] > 0 ? Math.log(1 + visitCount[i]) / logMax : 0;

        // Inverted hue: low density = accent, high density = muted grey
        const cr = ar + (MUTED_R - ar) * density;
        const cg = ag + (MUTED_G - ag) * density;
        const cb = ab + (MUTED_B - ab) * density;

        data[idx]     = Math.round(cr * brightness);
        data[idx + 1] = Math.round(cg * brightness);
        data[idx + 2] = Math.round(cb * brightness);
        data[idx + 3] = Math.round(brightness * ALPHA_SCALE);
      }

      offCtx.putImageData(imgData, 0, 0);

      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      // Throb via ctx.globalAlpha -- avoids DOM style recalculation
      const throbAlpha = Math.pow(THROB_SMOOTH, dt);
      const zNorm = Math.max(0, Math.min(1, (attractorPos.z - Z_MIN) / (Z_MAX - Z_MIN)));
      throbEma = throbEma * throbAlpha + zNorm * (1 - throbAlpha);
      ctx.globalAlpha = 0.65 + 0.35 * throbEma;
      ctx.drawImage(offscreen, 0, 0, width, height);
      ctx.globalAlpha = 1;

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
