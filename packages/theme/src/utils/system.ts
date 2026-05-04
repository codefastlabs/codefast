import type { ResolvedTheme, Theme } from "#/types";

import { DEFAULT_RESOLVED_THEME, MEDIA } from "#/constants";

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
 *
 * @since 0.3.16-canary.0
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof globalThis.window === "undefined") {
    return DEFAULT_RESOLVED_THEME;
  }

  return globalThis.window.matchMedia(MEDIA).matches ? "dark" : "light";
}

/**
 * Resolve theme preference to actual light/dark value.
 * 
 * - 'light' → 'light'
 * - 'dark' → 'dark'
 * - 'system' → on the client, result of {@link getSystemTheme}; on the server,
 *   `ssrSystemTheme` when provided, otherwise {@link DEFAULT_RESOLVED_THEME}
 * 
 * @param theme - User's theme preference (`light`, `dark`, or `system`)
 * @param ssrSystemTheme - When `theme` is `system` and this runs during SSR (no `window`),
 *   uses this as the resolved appearance—typically from Client Hints
 *   (`Sec-CH-Prefers-Color-Scheme`) so `<html class>` matches the real OS preference.
 *   Ignored for non-`system` themes and on the client (where {@link getSystemTheme} wins).
 * @returns The resolved theme to apply (`light` or `dark`)
 *
 * @since 0.3.16-canary.0
 */
export function resolveTheme(theme: Theme, ssrSystemTheme?: ResolvedTheme): ResolvedTheme {
  if (theme !== "system") {
    return theme;
  }

  if (typeof globalThis.window === "undefined") {
    return ssrSystemTheme ?? DEFAULT_RESOLVED_THEME;
  }

  return getSystemTheme();
}
