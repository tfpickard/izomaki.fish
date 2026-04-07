import { writable } from 'svelte/store';
import type { CelestialState } from '$lib/engine/types';

export const celestialState = writable<CelestialState>({ sun: 0, moon: 0 });
