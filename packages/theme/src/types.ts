import { z } from 'zod';

/* -----------------------------------------------------------------------------
 * Schema & Types
 * -------------------------------------------------------------------------- */

/**
 * Zod schema for theme validation.
 *
 * Acts as the single source of truth for all theme-related types.
 * Valid values: 'light', 'dark', 'system'.
 */
export const themeSchema = z.enum(['light', 'dark', 'system']);

/**
 * User's theme preference.
 *
 * - `'light'` - Force light mode
 * - `'dark'` - Force dark mode
 * - `'system'` - Follow OS preference
 */
export type Theme = z.infer<typeof themeSchema>;

/**
 * Actual theme applied to the UI after resolving 'system'.
 *
 * When theme is 'system', this reflects the OS preference (light/dark).
 */
export type ResolvedTheme = Exclude<Theme, 'system'>;

/**
 * Array of all available theme options: `['light', 'dark', 'system']`.
 *
 * Useful for rendering theme selectors in UI components.
 */
export const themes = themeSchema.options;

/**
 * Shape of the theme context value provided by ThemeProvider.
 *
 * - `theme` - Current theme preference
 * - `resolvedTheme` - Actual theme applied (system resolved to light/dark)
 * - `setTheme` - Async function to update theme (triggers optimistic update)
 * - `isPending` - True while theme change is being persisted
 */
export interface ThemeContextType {
  isPending: boolean;
  resolvedTheme: ResolvedTheme;
  setTheme: (value: Theme) => Promise<void>;
  theme: Theme;
}
