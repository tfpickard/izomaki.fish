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

export function getSprottBParams(celestial: CelestialState): Record<string, number> {
  const sunAngle = celestial.sun * Math.PI * 2;
  const moonAngle = celestial.moon * Math.PI * 2;
  const combinedAngle = (celestial.sun + celestial.moon) * Math.PI * 2;
  return {
    a: 0.4 + Math.sin(sunAngle) * 0.15,
    b: 1.2 + Math.sin(moonAngle) * 0.3,
    c: 1.0 + Math.sin(combinedAngle) * 0.2
  };
}