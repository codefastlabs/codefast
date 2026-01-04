import { z } from 'zod';

/* -----------------------------------------------------------------------------
 * Schema & Types
 * -------------------------------------------------------------------------- */

/**
 * Zod schema for validating theme values.
 * Single source of truth for all theme-related types.
 */
export const themeSchema = z.enum(['light', 'dark', 'system']);

/**
 * Theme type derived from the Zod schema.
 * Represents the user's theme preference.
 */
export type Theme = z.infer<typeof themeSchema>;

/**
 * Resolved theme type - the actual theme applied to the UI.
 * 'system' is resolved to either 'light' or 'dark' based on user's OS preference.
 */
export type ResolvedTheme = Exclude<Theme, 'system'>;

/* -----------------------------------------------------------------------------
 * Constants (Public)
 * -------------------------------------------------------------------------- */

/**
 * Array of all available themes, derived from the Zod schema.
 * Use this for rendering theme options in UI components.
 * @public
 */
export const themes = themeSchema.options;

/**
 * Default theme used when no preference is set.
 * @public
 */
export const DEFAULT_THEME: Theme = 'system';

/**
 * Default resolved theme used for server-side rendering when 'system' cannot be determined.
 * @public
 */
export const DEFAULT_RESOLVED_THEME: ResolvedTheme = 'dark';

/**
 * Cookie storage key for persisting theme preference.
 * @public
 */
export const THEME_STORAGE_KEY = 'ui-theme';

/* -----------------------------------------------------------------------------
 * Constants (Internal)
 * -------------------------------------------------------------------------- */

/**
 * Media query for detecting dark mode preference.
 * @internal
 */
export const MEDIA = '(prefers-color-scheme: dark)';

/**
 * BroadcastChannel name for cross-tab theme synchronization.
 * @internal
 */
export const THEME_CHANNEL = 'theme-sync';
