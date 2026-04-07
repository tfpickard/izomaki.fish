import type { TrajectoryConfig } from './types';

export function oscillate(config: TrajectoryConfig, time: number): number {
  const base = Math.sin(time * config.frequency * Math.PI * 2 + config.phase) * config.amplitude;
  const noise = (Math.random() - 0.5) * 2 * config.noise;
  return base + noise;
}
