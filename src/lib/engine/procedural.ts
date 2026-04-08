import type { StateVector } from './types';
import { seededRandom, valueNoise2D, idToSeed } from './noise';

export interface MutationConfig {
  rate: number;
  intensity: number;
  charSet: string;
}

export function deriveMutationConfig(state: StateVector): MutationConfig {
  const rate = state.agitation * 0.4 + state.curiosity * 0.2;
  const intensity = state.agitation * 0.6 + (1 - state.contentment) * 0.3;
  const charSet = state.agitation > 0.6
    ? '!|/\\-_=+*~:.,'
    : state.curiosity > 0.5
    ? ':.-~+*'
    : ':.,-';

  return { rate, intensity, charSet };
}

export function shouldMutate(state: StateVector): boolean {
  if (state.wakefulness < 0.1) return false;
  return (state.agitation * 0.5 + state.curiosity * 0.2 + state.wakefulness * 0.1) > 0.15;
}

export function mutateFrame(
  ascii: string,
  state: StateVector,
  timeSeed: number,
  creatureId: string
): string {
  const config = deriveMutationConfig(state);
  const seed = idToSeed(creatureId);
  const chars = ascii.split('');

  let col = 0;
  let row = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    if (ch === '\n') {
      row++;
      col = 0;
      continue;
    }

    if (ch === ' ') {
      col++;
      continue;
    }

    const n = valueNoise2D(col * 0.3 + timeSeed * 0.1, row * 0.3, seed * 0.001 + timeSeed * 0.07);

    if (n < config.rate * config.intensity) {
      const idx = Math.floor(seededRandom(i + timeSeed + seed) * config.charSet.length);
      chars[i] = config.charSet[idx];
    }

    col++;
  }

  return chars.join('');
}
