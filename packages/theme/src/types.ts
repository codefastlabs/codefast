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

/**
 * Array of all available themes, derived from the Zod schema.
 * Use this for rendering theme options in UI components.
 */
export const themes = themeSchema.options;

/**
 * Theme context type for React context consumers.
 */
export interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (value: Theme) => Promise<void>;
  isPending: boolean;
}
