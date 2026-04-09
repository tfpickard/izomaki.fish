export interface AttractorState {
  x: number;
  y: number;
  z: number;
}

export interface AttractorConfig {
  name: string;
  params: Record<string, number>;
  dt: number;
  initialState: AttractorState;
  xRange: [number, number];
  yRange: [number, number];
  zRange: [number, number];
}

export interface Attractor {
  config: AttractorConfig;
  step(state: AttractorState, params?: Record<string, number>): AttractorState;
  normalize(state: AttractorState): { nx: number; ny: number; nz: number };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
