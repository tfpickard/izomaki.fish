import { writable } from 'svelte/store';
import type { TrailPoint } from '$lib/engine/visualization';

export const trailStore = writable<TrailPoint[]>([]);
