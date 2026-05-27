import { z } from "zod";

/* -----------------------------------------------------------------------------
 * Schema & Types
 * -------------------------------------------------------------------------- */

/**
 * Zod schema for color scheme validation.
 *
 * Acts as the single source of truth for all color-scheme-related types.
 * Valid values: 'light', 'dark', 'automatic'.
 *
 * @since 0.3.16-canary.0
 */
export const colorSchemeSchema = z.enum(["light", "dark", "automatic"]);

/**
 * User's color scheme preference.
 *
 * - `'light'` - Force light appearance
 * - `'dark'` - Force dark appearance
 * - `'automatic'` - Follow OS preference
 *
 * @since 0.3.16-canary.0
 */
export type ColorScheme = z.infer<typeof colorSchemeSchema>;

/**
 * Actual color scheme applied to the UI after resolving 'automatic'.
 *
 * When color scheme is 'automatic', this reflects the OS preference (light/dark).
 *
 * @since 0.3.16-canary.0
 */
export type ResolvedColorScheme = Exclude<ColorScheme, "automatic">;

/**
 * Array of all available color scheme options: `['light', 'dark', 'automatic']`.
 *
 * Useful for rendering appearance selectors in UI components.
 *
 * @since 0.3.16-canary.0
 */
export const colorSchemes = colorSchemeSchema.options;

/**
 * Shape of the color scheme context value provided by AppearanceProvider.
 *
 * - `colorScheme` - Current color scheme preference
 * - `resolvedColorScheme` - Actual color scheme applied (automatic resolved to light/dark)
 * - `setPreferredColorScheme` - Async function to update color scheme (triggers optimistic update)
 * - `isPending` - True while color scheme change is being persisted
 *
 * @since 0.3.16-canary.0
 */
export type ColorSchemeContextType = {
  readonly isPending: boolean;
  readonly resolvedColorScheme: ResolvedColorScheme;
  readonly setColorScheme: (value: ColorScheme) => Promise<void>;
  readonly colorScheme: ColorScheme;
};
