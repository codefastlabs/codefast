import { createContext } from "react";

import type { ThemeContextType } from "#/types";

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

type ThemeContextValue = null | ThemeContextType;

/**
 * React context for theme state management.
 *
 * Provides access to current theme, resolved theme, setter function, and pending state.
 * Use {@link useTheme} hook instead of consuming this context directly.
 *
 * @see {@link ThemeProvider} - Provider component
 * @see {@link useTheme} - Consumer hook
 *
 * @since 0.3.16-canary.0
 */
export const ThemeContext = createContext<ThemeContextValue>(null);
