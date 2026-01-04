import type { ResolvedTheme, Theme } from '@/types';
import { DEFAULT_RESOLVED_THEME, MEDIA } from '@/constants';

/* -----------------------------------------------------------------------------
 * System Theme Detection
 * -------------------------------------------------------------------------- */

/**
 * Get the system theme based on user's OS preference.
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return DEFAULT_RESOLVED_THEME;
  }

  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

/**
 * Resolve theme to light/dark value.
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}
