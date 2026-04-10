import type { AttractorState, CelestialState } from './types';
import { stepAttractor } from './attractor';

const TRAIL_LENGTH = 500;

export interface TrailPoint {
  x: number;
  y: number;
  z: number;
  age: number;
}

export function computeTrail(
  start: AttractorState,
  celestial: CelestialState,
  steps: number = TRAIL_LENGTH
): TrailPoint[] {
  const trail: TrailPoint[] = [];
  let current = { ...start };

  for (let i = 0; i < steps; i++) {
    current = stepAttractor(current, celestial);
    trail.push({
      x: current.x,
      y: current.y,
      z: current.z,
      age: i / steps
    });
  }

  return trail;
}

export function project(
  point: TrailPoint,
  time: number,
  width: number,
  height: number
): { x: number; y: number; opacity: number } {
  const angle = time * 0.0005;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const rx = point.x * cos - point.z * sin;
  const rz = point.x * sin + point.z * cos;

  const scale = 8;
  const x = width / 2 + rx * scale;
  const y = height / 2 - point.y * scale + rz * 2;
  const opacity = (1 - point.age) * 0.15;

  return { x, y, opacity };
}
