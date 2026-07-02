/**
 * \@codefast/theme
 *
 * React 19 color scheme management: client-only `localStorage` persistence, SSR-safe
 * `automatic` resolution, cross-tab sync, optimistic updates.
 *
 * - **Root** (this module): `AppearanceProvider`, `useColorScheme`, `AppearanceScript`, `resolveColorScheme`, types, defaults.
 * - **`@codefast/theme/utils`**: `getSystemColorScheme`, `applyColorScheme`, `suppressTransitions`.
 * - **`@codefast/theme/core`**: `ColorSchemeContext` for rare custom wiring.
 */

// Types & Schema
export type { ResolvedColorScheme, ColorScheme, ColorSchemeContextType } from "#/types";
export { colorSchemes, colorSchemeSchema } from "#/types";

// Constants
export { DEFAULT_RESOLVED_COLOR_SCHEME, DEFAULT_COLOR_SCHEME } from "#/constants";

// Core (Provider, Hook — use `@codefast/theme/core` for `ColorSchemeContext`)
export { AppearanceProvider } from "#/core/provider";
export type { AppearanceProviderProps } from "#/core/provider";
export { useColorScheme } from "#/core/use-theme";

// Script (FOUC prevention)
export { AppearanceScript } from "#/script/theme-script";
export type { AppearanceScriptProps } from "#/script/theme-script";

// Utilities: DOM + `getSystemColorScheme` live under `@codefast/theme/utils`
export { resolveColorScheme } from "#/utils/system";
