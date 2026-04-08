export function idToSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): number {
  const s = Math.sin(seed) * 43758.5453123;
  return s - Math.floor(s);
}

export function valueNoise1D(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = seededRandom(i + seed * 127.1);
  const b = seededRandom(i + 1 + seed * 127.1);
  return a + (b - a) * u;
}

export function valueNoise2D(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = seededRandom(ix     + iy     * 157.0 + seed * 127.1);
  const b = seededRandom(ix + 1 + iy     * 157.0 + seed * 127.1);
  const c = seededRandom(ix     + (iy+1) * 157.0 + seed * 127.1);
  const d = seededRandom(ix + 1 + (iy+1) * 157.0 + seed * 127.1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
