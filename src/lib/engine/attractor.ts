import type { AttractorState, CelestialState } from './types';
import { createSprottB } from './attractors/sprott-b';
import { createDadras } from './attractors/dadras';
import { getSprottBParams } from './celestial';

const _sprottB = createSprottB();
const _dadras = createDadras();

export { getSprottBParams };

export function stepAttractor(state: AttractorState, celestial: CelestialState): AttractorState {
  const params = getSprottBParams(celestial);
  return _sprottB.step(state, params);
}

export function normalizeAttractor(state: AttractorState): { nx: number; ny: number; nz: number } {
  return _sprottB.normalize(state);
}

export interface CreatureExperience {
  avgX: number;
  avgY: number;
  avgZ: number;
  ageNormalized: number;
  generationNormalized: number;
}

export function getDadrasParams(
  sprottNorm: { nx: number; ny: number; nz: number },
  exp: CreatureExperience
): Record<string, number> {
  return {
    a: 3.0 + (sprottNorm.nx - 0.5) * 1.0 + exp.avgX * 0.2,
    b: 2.7 + (sprottNorm.ny - 0.5) * 0.8 + exp.avgY * 0.2,
    c: 1.7 + (sprottNorm.nz - 0.5) * 0.6 + exp.avgZ * 0.15,
    d: 2.0 + exp.ageNormalized * 0.3,
    e: 9.0 + exp.generationNormalized * 1.0
  };
}

export function stepDadras(state: AttractorState, params: Record<string, number>): AttractorState {
  return _dadras.step(state, params);
}

export function normalizeDadras(state: AttractorState): { nx: number; ny: number; nz: number } {
  return _dadras.normalize(state);
}

export const INITIAL_ATTRACTOR: AttractorState = { ..._sprottB.config.initialState };
export const INITIAL_DADRAS: AttractorState = { ..._dadras.config.initialState };
