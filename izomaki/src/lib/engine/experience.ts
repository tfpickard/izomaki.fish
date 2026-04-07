import type { ExperienceSummary } from './types';

export function modulateState(
  rawValue: number,
  _attractorAxis: number,
  experience: ExperienceSummary | null
): number {
  if (!experience || experience.total_logs < 10) return rawValue;

  // creatures that have experienced a lot of high-attractor values
  // become slightly dampened in their response to those values.
  // creatures with wide variance remain sensitive.
  // this is aging, not learning.
  const sensitivity = Math.min(1, (experience.std_x + experience.std_y + experience.std_z) / 3);
  const damping = 1 - (1 - sensitivity) * 0.3;

  return rawValue * damping;
}
