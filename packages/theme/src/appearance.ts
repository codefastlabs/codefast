// ── Values & Types ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The appearance values, in display order: `['light', 'dark', 'automatic']`.
 *
 * The single source of truth for every appearance type and check. Useful for rendering appearance selectors.
 *
 * @since 0.5.0-canary.2
 */
export const appearances = ["light", "dark", "automatic"] as const;

/**
 * User's appearance preference.
 *
 * - `'light'` - Force light appearance
 * - `'dark'` - Force dark appearance
 * - `'automatic'` - Follow OS preference
 *
 * @since 0.5.0-canary.2
 */
export type Appearance = (typeof appearances)[number];

/**
 * Color scheme actually applied to the UI after resolving 'automatic'.
 *
 * When the appearance is 'automatic', this reflects the OS preference (light/dark).
 *
 * @since 0.5.0-canary.2
 */
export type ColorScheme = Exclude<Appearance, "automatic">;

/**
 * Reports whether a value is one of the {@link appearances}.
 *
 * Guards values that bypass TypeScript, such as stored strings, cross-tab messages and raw API data.
 */
export function isAppearance(value: unknown): value is Appearance {
  return appearances.some((item) => item === value);
}

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
