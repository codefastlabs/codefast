import { createContext } from "react";

import type { AppearanceContextValue } from "#/appearance";

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

/**
 * React context for appearance state management.
 *
 * Provides access to the current appearance, resolved color scheme, setter function, and pending state.
 * Use {@link useAppearance} hook instead of consuming this context directly.
 *
 * @see {@link AppearanceProvider} - Provider component
 * @see {@link useAppearance} - Consumer hook
 *
 * @since 0.5.0-canary.2
 */
export const AppearanceContext = createContext<null | AppearanceContextValue>(null);
