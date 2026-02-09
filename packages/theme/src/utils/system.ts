import type { ResolvedTheme, Theme } from '@/types';

import { DEFAULT_RESOLVED_THEME, MEDIA } from '@/constants';

/* -----------------------------------------------------------------------------
 * System Theme Detection
 * -------------------------------------------------------------------------- */

/**
 * Detect the user's OS theme preference.
 *
 * Uses `matchMedia()` to query the `prefers-color-scheme` media feature.
 * Returns {@link DEFAULT_RESOLVED_THEME} during SSR since `window` is unavailable.
 *
 * @returns 'light' or 'dark' based on OS preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return DEFAULT_RESOLVED_THEME;
  }

  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

/**
 * Resolve theme preference to actual light/dark value.
 *
 * - 'light' → 'light'
 * - 'dark' → 'dark'
 * - 'system' → result of {@link getSystemTheme}
 *
 * @param theme - User's theme preference
 * @returns The resolved theme to apply
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}
