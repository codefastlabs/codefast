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
 * Cookie key for persisting user's theme preference.
 *
 * The cookie is httpOnly for security (only server can read it).
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
