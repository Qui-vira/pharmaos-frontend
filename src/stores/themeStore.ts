import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;

  /** Set a specific theme preference */
  setTheme: (theme: ThemePreference) => void;

  /** Toggle between light and dark (skips system) */
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: resolveTheme('system'),

      setTheme: (theme) => {
        set({ theme, resolvedTheme: resolveTheme(theme) });
      },

      toggle: () => {
        const next: ResolvedTheme = get().resolvedTheme === 'light' ? 'dark' : 'light';
        set({ theme: next, resolvedTheme: next });
      },
    }),
    {
      name: 'pharmaos-theme',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
