/**
 * \@codefast/theme
 *
 * React 19 theme management: SSR-friendly `system` resolution, cross-tab sync, optimistic updates.
 *
 * - **Root** (this module): `ThemeProvider`, `useTheme`, `ThemeScript`, `resolveTheme`, types, defaults.
 * - **`@codefast/theme/start`**: TanStack Start server functions + `persistThemeCookie`.
 * - **`@codefast/theme/utils`**: `getSystemTheme`, `applyTheme`, `disableAnimation`.
 * - **`@codefast/theme/core`**: `ThemeContext` for rare custom wiring.
 */

// Types & Schema
export type { ResolvedTheme, Theme, ThemeContextType } from "@/types";
export { themes, themeSchema } from "@/types";

// Constants
export { DEFAULT_RESOLVED_THEME, DEFAULT_THEME } from "@/constants";

// Core (Provider, Hook — use `@codefast/theme/core` for `ThemeContext`)
export { ThemeProvider, useTheme } from "@/core";

// Script (FOUC prevention)
export { ThemeScript } from "@/script";

// Utilities: DOM + `getSystemTheme` live under `@codefast/theme/utils`
export { resolveTheme } from "@/utils/system";
