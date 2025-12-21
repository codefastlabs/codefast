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
 * Constants
 * -------------------------------------------------------------------------- */

/**
 * Array of all available themes, derived from the Zod schema.
 * Use this for rendering theme options in UI components.
 */
export const themes = themeSchema.options;

/**
 * Default theme used when no preference is set.
 */
export const DEFAULT_THEME: Theme = 'system';

/**
 * Cookie storage key for persisting theme preference.
 */
export const THEME_STORAGE_KEY = 'ui-theme';
