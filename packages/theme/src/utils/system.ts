import { DEFAULT_RESOLVED_COLOR_SCHEME, MEDIA } from "#/constants";
import type { ResolvedColorScheme, ColorScheme } from "#/types";

/* -----------------------------------------------------------------------------
 * System Color Scheme Detection
 * -------------------------------------------------------------------------- */

/**
 * Detect the user's OS color scheme preference.
 *
 * Uses `matchMedia()` to query the `prefers-color-scheme` media feature.
 * Returns {@link DEFAULT_RESOLVED_COLOR_SCHEME} during SSR since `window` is unavailable.
 *
 * @returns 'light' or 'dark' based on OS preference
 *
 * @since 0.3.16-canary.0
 */
export function getSystemColorScheme(): ResolvedColorScheme {
  if (typeof globalThis.window === "undefined") {
    return DEFAULT_RESOLVED_COLOR_SCHEME;
  }

  return globalThis.window.matchMedia(MEDIA).matches ? "dark" : "light";
}

/**
 * Resolve color scheme preference to actual light/dark value.
 *
 * - 'light' → 'light'
 * - 'dark' → 'dark'
 * - 'automatic' → on the client, result of {@link getSystemColorScheme}; on the server,
 *   `ssrColorScheme` when provided, otherwise {@link DEFAULT_RESOLVED_COLOR_SCHEME}
 *
 * @param colorScheme - User's color scheme preference (`light`, `dark`, or `automatic`)
 * @param ssrColorScheme - When `colorScheme` is `automatic` and this runs during SSR (no `window`),
 *   uses this as the resolved appearance—typically from Client Hints
 *   (`Sec-CH-Prefers-Color-Scheme`) so `<html class>` matches the real OS preference.
 *   Ignored for non-`automatic` schemes and on the client (where {@link getSystemColorScheme} wins).
 * @returns The resolved color scheme to apply (`light` or `dark`)
 *
 * @since 0.3.16-canary.0
 */
export function resolveColorScheme(
  colorScheme: ColorScheme,
  ssrColorScheme?: ResolvedColorScheme,
): ResolvedColorScheme {
  if (colorScheme !== "automatic") {
    return colorScheme;
  }

  if (typeof globalThis.window === "undefined") {
    return ssrColorScheme ?? DEFAULT_RESOLVED_COLOR_SCHEME;
  }

  return getSystemColorScheme();
}
