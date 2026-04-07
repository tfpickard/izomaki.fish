import { writable } from 'svelte/store';
import type { StateVector, AttractorState, ParameterTrajectories } from '$lib/engine/types';
import { DEFAULT_TRAJECTORIES } from '$lib/engine/types';
import { INITIAL_STATE } from '$lib/engine/state';
import { INITIAL_ATTRACTOR } from '$lib/engine/attractor';

export const creatureState = writable<StateVector>(INITIAL_STATE);
export const attractorState = writable<AttractorState>(INITIAL_ATTRACTOR);
export const trajectories = writable<ParameterTrajectories>(DEFAULT_TRAJECTORIES);
export const selectedFrameId = writable<string | null>(null);
