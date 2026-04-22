<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { stepAttractor } from '$lib/engine/attractor';
  import { attractorState } from '$lib/stores/creature';
  import { celestialState } from '$lib/stores/attractor';

  const GRID_W = 120;
  const GRID_H = 80;
  const STEPS_PER_FRAME = 300;
  // Per-frame decay: half-life ~23s at 60fps
  const DECAY = 0.9995;
  // EMA smoothing for throb: half-life ~6s at 60fps
  const THROB_SMOOTH = 0.998;

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

    // Persistent accumulation buffer -- evolves continuously
    const buffer = new Float32Array(GRID_W * GRID_H);
    let bufferMax = 1;
    let attractorPos = { ...get(attractorState) };
    // Pre-allocated once; reused every frame to avoid GC churn
    const imgData = offCtx.createImageData(GRID_W, GRID_H);

    function readAccentColor(): string {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-accent').trim() || '#34d399';
    }

    let [r, g, b] = parseAccentRgb(readAccentColor());

    const mo = new MutationObserver(() => { [r, g, b] = parseAccentRgb(readAccentColor()); });
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

    let throbEma = 0.5;
    let lastTime = performance.now();

    // RAF passes a DOMHighResTimeStamp; we use it for frame-rate-independent scaling
    function draw(now: number) {
      if (!offCtx) return;
      // dt is a frame multiplier (1.0 = 60fps), capped to avoid large jumps after tab wake
      const dt = Math.min((now - lastTime) / (1000 / 60), 4);
      lastTime = now;

      const celestial = get(celestialState);
      const steps = Math.round(STEPS_PER_FRAME * dt);

      for (let i = 0; i < steps; i++) {
        attractorPos = stepAttractor(attractorPos, celestial);
        const { px, py } = projectPoint(attractorPos.x, attractorPos.y, attractorPos.z);
        if (px >= 0 && px < GRID_W && py >= 0 && py < GRID_H) {
          buffer[py * GRID_W + px] += 1;
        }
      }

      // Decay scaled to elapsed time so half-life is display-rate independent
      const decay = Math.pow(DECAY, dt);
      let newMax = 0;
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] *= decay;
        if (buffer[i] > newMax) newMax = buffer[i];
      }
      if (newMax > 0) bufferMax = newMax;

      // Render density to pre-allocated ImageData with heatmap color gradient
      const data = imgData.data;
      const logMax = Math.log(1 + bufferMax);

      for (let i = 0; i < buffer.length; i++) {
        const idx = i * 4;
        const density = buffer[i] > 0 ? Math.log(1 + buffer[i]) / logMax : 0;
        if (density < 0.04) {
          // Zero out stale pixels from previous frames
          data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0;
          continue;
        }
        if (density < 0.5) {
          // Transparent dark → full accent color
          const t = (density - 0.04) / 0.46;
          data[idx]     = Math.round(r * t);
          data[idx + 1] = Math.round(g * t);
          data[idx + 2] = Math.round(b * t);
          data[idx + 3] = Math.round(t * 130);
        } else {
          // Accent color → bright near-white (hot core)
          const t = (density - 0.5) / 0.5;
          data[idx]     = Math.round(r + (255 - r) * t * 0.7);
          data[idx + 1] = Math.round(g + (255 - g) * t * 0.7);
          data[idx + 2] = Math.round(b + (255 - b) * t * 0.7);
          data[idx + 3] = Math.round(130 + t * 125);
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      // Draw offscreen → main canvas (blur applied via CSS filter on element)
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      // Throb via ctx.globalAlpha -- avoids DOM style recalculation each frame
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
  style="z-index: 0; filter: blur(20px);"
></canvas>
