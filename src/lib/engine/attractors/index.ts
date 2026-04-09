import { createSprottB } from './sprott-b';
import { createDadras } from './dadras';
import { createChenLee } from './chen-lee';
import { createAizawa } from './aizawa';
import { createHalvorsen } from './halvorsen';
import { createRossler } from './rossler';
import type { Attractor } from './types';

export { createSprottB, createDadras };
export type { Attractor, AttractorState, AttractorConfig } from './types';

export const GLOBAL_ATTRACTOR = createSprottB;
export const CREATURE_ATTRACTOR = createDadras;

const LANDING_ATTRACTORS = [
  createChenLee,
  createSprottB,
  createAizawa,
  createHalvorsen,
  createDadras,
  createRossler
];

export function getRandomLandingAttractor(): Attractor {
  const index = Math.floor(Math.random() * LANDING_ATTRACTORS.length);
  return LANDING_ATTRACTORS[index]();
}

export function getLandingAttractorByName(name: string): Attractor | null {
  const map: Record<string, () => Attractor> = {
    'chen-lee': createChenLee,
    'sprott-b': createSprottB,
    'aizawa': createAizawa,
    'halvorsen': createHalvorsen,
    'dadras': createDadras,
    'rossler': createRossler
  };
  const factory = map[name];
  return factory ? factory() : null;
}
