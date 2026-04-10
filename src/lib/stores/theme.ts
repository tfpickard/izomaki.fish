import { writable, derived } from 'svelte/store';

export type ThemeMode = 'dark' | 'light' | 'auto' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'izomaki-theme';

function loadMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'auto' || stored === 'system') {
    return stored;
  }
  return 'dark';
}

function resolveAuto(): ResolvedTheme {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 19 ? 'light' : 'dark';
}

function resolveSystem(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (mode === 'auto') return resolveAuto();
  return resolveSystem();
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

function createThemeStore() {
  const modeStore = writable<ThemeMode>('dark');
  const resolvedStore = writable<ResolvedTheme>('dark');

  const combined = derived([modeStore, resolvedStore], ([$m, $r]) => ({ mode: $m, resolved: $r }));

  let autoInterval: ReturnType<typeof setInterval> | null = null;
  let systemMql: MediaQueryList | null = null;

  function setMode(next: ThemeMode) {
    modeStore.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }

    const r = resolve(next);
    resolvedStore.set(r);
    applyTheme(r);

    if (autoInterval !== null) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
    if (systemMql !== null) {
      systemMql.removeEventListener('change', onSystemChange);
      systemMql = null;
    }

    if (next === 'auto') {
      autoInterval = setInterval(() => {
        const r2 = resolveAuto();
        resolvedStore.set(r2);
        applyTheme(r2);
      }, 5 * 60 * 1000);
    }

    if (next === 'system') {
      systemMql = window.matchMedia('(prefers-color-scheme: light)');
      systemMql.addEventListener('change', onSystemChange);
    }
  }

  function onSystemChange() {
    const r = resolveSystem();
    resolvedStore.set(r);
    applyTheme(r);
  }

  function hydrate() {
    const m = loadMode();
    setMode(m);
  }

  return { subscribe: combined.subscribe, mode: modeStore, resolved: resolvedStore, setMode, hydrate };
}

export const themeStore = createThemeStore();
