import type { Appearance, ColorScheme } from "#/appearance";

/* -----------------------------------------------------------------------------
 * Public Constants
 * -------------------------------------------------------------------------- */

/**
 * Default appearance preference when no stored value exists.
 *
 * Set to 'automatic' to respect OS preference by default.
 *
 * @since 0.5.0-canary.2
 */
export const DEFAULT_APPEARANCE: Appearance = "automatic";

/**
 * Fallback color scheme when the system color scheme cannot be detected.
 *
 * Applies wherever `window.matchMedia()` is unavailable, e.g. during server render.
 *
 * @since 0.5.0-canary.2
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = "dark";

/**
 * Default `localStorage` key for the appearance preference, shared by
 * `AppearanceScript` and `AppearanceProvider`.
 *
 * Re-exported only from `@codefast/theme/constants` so custom integrations can match it exactly.
 *
 * @since 0.3.16-canary.0
 */
export const STORAGE_KEY = "ui-appearance";

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
 * BroadcastChannel name for cross-tab appearance synchronization.
 * @internal
 *
 * @since 0.3.16-canary.0
 */
export const SYNC_CHANNEL = "appearance-sync";
