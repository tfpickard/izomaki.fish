import type { StateVector, ParameterTrajectories } from './types';
import { PARAMETER_KEYS } from './types';
import { oscillate } from './trajectory';

export function evolveState(
  _current: StateVector,
  trajectories: ParameterTrajectories,
  attractorModulation: { nx: number; ny: number; nz: number },
  time: number
): StateVector {
  const attractorMap: Record<keyof StateVector, number> = {
    wakefulness: attractorModulation.nx,
    contentment: attractorModulation.nx,
    curiosity: attractorModulation.ny,
    agitation: attractorModulation.ny,
    hunger: attractorModulation.nz,
    presence: attractorModulation.nz
  };

  const next: Partial<StateVector> = {};

  for (const key of PARAMETER_KEYS) {
    const attractorBase = attractorMap[key];
    const localOscillation = oscillate(trajectories[key], time);
    const raw = attractorBase + localOscillation;
    next[key] = clamp(raw, 0, 1);
  }

  return next as StateVector;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const INITIAL_STATE: StateVector = {
  wakefulness: 0.5,
  contentment: 0.5,
  curiosity: 0.5,
  agitation: 0.2,
  hunger: 0.3,
  presence: 0.7
};
