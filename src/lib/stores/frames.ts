import { writable } from 'svelte/store';
import type { Frame } from '$lib/engine/types';

const STORAGE_KEY = 'izomaki-frames';

function loadFrames(): Frame[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function createFrameStore() {
  const { subscribe, set, update } = writable<Frame[]>(loadFrames());

  return {
    subscribe,
    add(frame: Frame) {
      update(frames => {
        const next = [...frames, frame];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    remove(id: string) {
      update(frames => {
        const next = frames.filter(f => f.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      set([]);
    }
  };
}

export const frameStore = createFrameStore();
