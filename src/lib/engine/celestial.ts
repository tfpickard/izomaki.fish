import type { CelestialState } from './types';

const TIME_ACCELERATION = 300;
const SOLAR_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const LUNAR_MONTH_MS = 29.53059 * 24 * 60 * 60 * 1000;
const EPOCH = new Date('2025-01-01T00:00:00Z').getTime();

export function getCelestialState(now: number): CelestialState {
  const elapsed = (now - EPOCH) * TIME_ACCELERATION;
  const sun = (elapsed % SOLAR_YEAR_MS) / SOLAR_YEAR_MS;
  const moon = (elapsed % LUNAR_MONTH_MS) / LUNAR_MONTH_MS;
  return { sun, moon };
}