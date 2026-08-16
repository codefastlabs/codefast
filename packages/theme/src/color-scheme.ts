import type { Appearance, ColorScheme } from "#/appearance";
import { DEFAULT_COLOR_SCHEME, MEDIA } from "#/constants";

// ── Color Scheme Resolution ──────────────────────────────────────────────────────────────────────────────────────────

/**
 * Detects the OS color scheme preference.
 *
 * Uses `matchMedia()` to query the `prefers-color-scheme` media feature.
 * Returns {@link DEFAULT_COLOR_SCHEME} during SSR since `window` is unavailable.
 *
 * @returns 'light' or 'dark' based on OS preference
 *
 * @since 0.3.16-canary.0
 */
export function getSystemColorScheme(): ColorScheme {
  if (typeof globalThis.window === "undefined") {
    return DEFAULT_COLOR_SCHEME;
  }

  return globalThis.window.matchMedia(MEDIA).matches ? "dark" : "light";
}

/**
 * Resolves an appearance preference to the color scheme to apply.
 *
 * - 'light' → 'light'
 * - 'dark' → 'dark'
 * - 'automatic' → on the client, result of {@link getSystemColorScheme};
 *   on the server, {@link DEFAULT_COLOR_SCHEME}
 *
 * @since 0.3.16-canary.0
 */
export function resolveColorScheme(appearance: Appearance): ColorScheme {
  if (appearance !== "automatic") {
    return appearance;
  }

  return getSystemColorScheme();
}
