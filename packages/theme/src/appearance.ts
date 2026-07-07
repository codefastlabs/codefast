import { z } from "zod";

/* -----------------------------------------------------------------------------
 * Schema & Types
 *
 * Vocabulary follows Apple's Human Interface Guidelines: "appearance" is the
 * user's preference (Light / Dark / Auto), "color scheme" is the resolved
 * light-or-dark value actually applied (matching CSS `color-scheme` and
 * `prefers-color-scheme`).
 * -------------------------------------------------------------------------- */

/**
 * Zod schema for appearance validation.
 *
 * Acts as the single source of truth for all appearance-related types.
 * Valid values: 'light', 'dark', 'automatic'.
 *
 * @since 0.5.0-canary.2
 */
export const appearanceSchema = z.enum(["light", "dark", "automatic"]);

/**
 * User's appearance preference.
 *
 * - `'light'` - Force light appearance
 * - `'dark'` - Force dark appearance
 * - `'automatic'` - Follow OS preference
 *
 * @since 0.5.0-canary.2
 */
export type Appearance = z.infer<typeof appearanceSchema>;

/**
 * Color scheme actually applied to the UI after resolving 'automatic'.
 *
 * When the appearance is 'automatic', this reflects the OS preference (light/dark).
 *
 * @since 0.5.0-canary.2
 */
export type ColorScheme = Exclude<Appearance, "automatic">;

/**
 * Array of all available appearance options: `['light', 'dark', 'automatic']`.
 *
 * Useful for rendering appearance selectors in UI components.
 *
 * @since 0.5.0-canary.2
 */
export const appearances = appearanceSchema.options;

/**
 * Shape of the context value provided by AppearanceProvider.
 *
 * - `appearance` - Current appearance preference
 * - `colorScheme` - Color scheme actually applied (automatic resolved to light/dark)
 * - `setAppearance` - Async function to update the preference (triggers optimistic update)
 * - `isPending` - True while an appearance change is being persisted
 *
 * @since 0.5.0-canary.2
 */
export type AppearanceContextValue = {
  readonly isPending: boolean;
  readonly colorScheme: ColorScheme;
  readonly setAppearance: (value: Appearance) => Promise<void>;
  readonly appearance: Appearance;
};
