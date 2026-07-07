/**
 * \@codefast/theme
 *
 * React 19 appearance management, with vocabulary following Apple's Human Interface
 * Guidelines: **appearance** is the user's preference (light / dark / automatic),
 * **color scheme** is the resolved light-or-dark value actually applied. Client-only
 * `localStorage` persistence, SSR-safe `automatic` resolution, cross-tab sync,
 * optimistic updates.
 *
 * - **Root** (this module): `AppearanceProvider`, `useAppearance`, `AppearanceScript`, `resolveColorScheme`, types, defaults.
 * - **`@codefast/theme/color-scheme` / `@codefast/theme/dom`**: `getSystemColorScheme`, `applyColorScheme`, `suppressTransitions`.
 * - **`@codefast/theme/appearance-context`**: `AppearanceContext` for rare custom wiring.
 */

// Types & Schema
export type { Appearance, AppearanceContextValue, ColorScheme } from "#/appearance";
export { appearances, appearanceSchema } from "#/appearance";

// Constants
export { DEFAULT_APPEARANCE, DEFAULT_COLOR_SCHEME } from "#/constants";

// Provider & Hook (use `@codefast/theme/appearance-context` for `AppearanceContext`)
export { AppearanceProvider } from "#/appearance-provider";
export type { AppearanceProviderProps } from "#/appearance-provider";
export { useAppearance } from "#/use-appearance";

// Script (FOUC prevention)
export { AppearanceScript } from "#/appearance-script";
export type { AppearanceScriptProps } from "#/appearance-script";

// Resolution: `getSystemColorScheme` lives under `@codefast/theme/color-scheme`
export { resolveColorScheme } from "#/color-scheme";
