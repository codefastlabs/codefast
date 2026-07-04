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
 * - 'automatic' → on the client, result of {@link getSystemColorScheme};
 *   on the server, {@link DEFAULT_RESOLVED_COLOR_SCHEME}
 *
 * @since 0.3.16-canary.0
 */
export function resolveColorScheme(colorScheme: ColorScheme): ResolvedColorScheme {
  if (colorScheme !== "automatic") {
    return colorScheme;
  }

  return getSystemColorScheme();
}
