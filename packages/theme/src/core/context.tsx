import { createContext } from "react";

import type { ColorSchemeContextType } from "#/types";

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

type ColorSchemeContextValue = null | ColorSchemeContextType;

/**
 * React context for color scheme state management.
 *
 * Provides access to current color scheme, resolved color scheme, setter function, and pending state.
 * Use {@link useColorScheme} hook instead of consuming this context directly.
 *
 * @see {@link AppearanceProvider} - Provider component
 * @see {@link useColorScheme} - Consumer hook
 *
 * @since 0.3.16-canary.0
 */
export const ColorSchemeContext = createContext<ColorSchemeContextValue>(null);
