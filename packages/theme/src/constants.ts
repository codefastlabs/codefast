import type { ResolvedTheme, Theme } from "@/types";

/* -----------------------------------------------------------------------------
 * Public Constants
 * -------------------------------------------------------------------------- */

/**
 * Default theme when no user preference exists.
 *
 * Set to 'system' to respect OS preference by default.
 */
export const DEFAULT_THEME: Theme = "system";

/**
 * Fallback theme for SSR when system preference cannot be detected.
 *
 * Used during server-side rendering since `window.matchMedia()` is unavailable.
 */
export const DEFAULT_RESOLVED_THEME: ResolvedTheme = "dark";

/**
 * Cookie name for the httpOnly theme preference (`@codefast/theme/start`).
 *
 * Re-exported only from `@codefast/theme/constants` so custom middleware matches the adapter.
 */
export const THEME_STORAGE_KEY = "ui-theme";

/* -----------------------------------------------------------------------------
 * Internal Constants
 * -------------------------------------------------------------------------- */

/**
 * CSS media query for detecting dark mode preference.
 * @internal
 */
export const MEDIA = "(prefers-color-scheme: dark)";

/**
 * BroadcastChannel name for cross-tab theme synchronization.
 *
 * Enables instant theme updates across all open browser tabs.
 * @internal
 */
export const THEME_CHANNEL = "theme-sync";
