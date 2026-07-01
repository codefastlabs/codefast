import type { ResolvedColorScheme, ColorScheme } from "#/types";

/* -----------------------------------------------------------------------------
 * Public Constants
 * -------------------------------------------------------------------------- */

/**
 * Default color scheme when no user preference exists.
 *
 * Set to 'automatic' to respect OS preference by default.
 *
 * @since 0.3.16-canary.0
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = "automatic";

/**
 * Fallback color scheme for SSR when system preference cannot be detected.
 *
 * Used during server-side rendering since `window.matchMedia()` is unavailable.
 *
 * @since 0.3.16-canary.0
 */
export const DEFAULT_RESOLVED_COLOR_SCHEME: ResolvedColorScheme = "dark";

/**
 * Storage key for the color scheme preference — the httpOnly cookie name for the
 * `@codefast/theme/start` adapter, and the recommended `localStorage` key for the
 * client-only `storageKey` path (`AppearanceScript`/`AppearanceProvider`).
 *
 * Re-exported only from `@codefast/theme/constants` so custom middleware / consumers can match it exactly.
 *
 * @since 0.3.16-canary.0
 */
export const STORAGE_KEY = "ui-theme";

/* -----------------------------------------------------------------------------
 * Internal Constants
 * -------------------------------------------------------------------------- */

/**
 * CSS media query for detecting dark mode preference.
 * @internal
 *
 * @since 0.3.16-canary.0
 */
export const MEDIA = "(prefers-color-scheme: dark)";

/**
 * BroadcastChannel name for cross-tab color scheme synchronization.
 * @internal
 *
 * @since 0.3.16-canary.0
 */
export const SYNC_CHANNEL = "color-scheme-sync";
