import { createClientOnlyFn } from '@tanstack/react-start';
import type { Theme } from '@/integrations/theme/types';

export const getSystemTheme = createClientOnlyFn((): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

export const getStoredTheme = createClientOnlyFn((storageKey: string): Theme | null => {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? (value as Theme) : null;
  } catch {
    return null;
  }
});

export const setStoredTheme = createClientOnlyFn((storageKey: string, theme: Theme): void => {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // noop
  }
});

export const applyTheme = createClientOnlyFn(
  (theme: 'light' | 'dark', attribute: string, enableColorScheme: boolean): void => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    if (attribute !== 'class') {
      root.setAttribute(attribute, theme);
    }

    if (enableColorScheme) {
      root.style.colorScheme = theme;
    }
  },
);
