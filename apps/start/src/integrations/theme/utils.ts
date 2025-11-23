import { createClientOnlyFn } from '@tanstack/react-start';
import type { SystemTheme, Theme } from '@/integrations/theme/types';

export const getSystemTheme = createClientOnlyFn((): SystemTheme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
});

export const getStoredTheme = createClientOnlyFn((storageKey: string): Theme | null => {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? value : null;
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

export const applyTheme = createClientOnlyFn((theme: Theme, attribute: string, enableColorScheme: boolean): void => {
  const root = document.documentElement;

  // Remove standard theme classes
  root.classList.remove('light', 'dark');

  // Only add theme as class if it's 'light' or 'dark', otherwise apply as an attribute
  if (theme === 'light' || theme === 'dark') {
    root.classList.add(theme);
  }

  if (attribute !== 'class') {
    root.setAttribute(attribute, theme);
  } else if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    // For custom themes, add as class when the attribute is 'class'
    root.classList.add(theme);
  }

  // Only set the colorScheme for 'light' or 'dark'
  if (enableColorScheme && (theme === 'light' || theme === 'dark')) {
    root.style.colorScheme = theme;
  }
});
