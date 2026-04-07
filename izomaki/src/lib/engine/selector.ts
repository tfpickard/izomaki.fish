import type { Frame, StateVector } from './types';
import { PARAMETER_KEYS } from './types';

export function selectFrame(frames: Frame[], state: StateVector): Frame | null {
  if (frames.length === 0) return null;

  let bestFrame = frames[0];
  let bestDistance = Infinity;

  for (const frame of frames) {
    const distance = euclideanDistance(frame.weights, state);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestFrame = frame;
    }
  }

  return bestFrame;
}

function euclideanDistance(a: StateVector, b: StateVector): number {
  let sum = 0;
  for (const key of PARAMETER_KEYS) {
    const diff = a[key] - b[key];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
