import type { AttractorState, CelestialState } from './types';

const SIGMA_BASE = 10;
const RHO_BASE = 28;
const BETA_BASE = 8 / 3;

const SIGMA_RANGE = 2;
const RHO_RANGE = 4;
const BETA_RANGE = 0.5;

export function getModulatedConstants(celestial: CelestialState) {
  const sunAngle = celestial.sun * Math.PI * 2;
  const moonAngle = celestial.moon * Math.PI * 2;
  return {
    sigma: SIGMA_BASE + Math.sin(sunAngle) * SIGMA_RANGE,
    rho: RHO_BASE + Math.sin(moonAngle) * RHO_RANGE,
    beta: BETA_BASE + Math.sin(sunAngle + moonAngle) * BETA_RANGE
  };
}

export function stepAttractor(
  state: AttractorState,
  celestial: CelestialState,
  dt: number = 0.005
): AttractorState {
  const { sigma, rho, beta } = getModulatedConstants(celestial);
  const dx = sigma * (state.y - state.x) * dt;
  const dy = (state.x * (rho - state.z) - state.y) * dt;
  const dz = (state.x * state.y - beta * state.z) * dt;
  return {
    x: state.x + dx,
    y: state.y + dy,
    z: state.z + dz
  };
}

export function normalizeAttractor(state: AttractorState): { nx: number; ny: number; nz: number } {
  return {
    nx: clamp((state.x + 20) / 40, 0, 1),
    ny: clamp((state.y + 30) / 60, 0, 1),
    nz: clamp(state.z / 50, 0, 1)
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const INITIAL_ATTRACTOR: AttractorState = { x: 1, y: 1, z: 1 };
