import { createContext } from "react";

import type { AppearanceContextType } from "#/appearance";

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

type AppearanceContextValue = null | AppearanceContextType;

/**
 * React context for appearance state management.
 *
 * Provides access to the current appearance, resolved color scheme, setter function, and pending state.
 * Use {@link useAppearance} hook instead of consuming this context directly.
 *
 * @see {@link AppearanceProvider} - Provider component
 * @see {@link useAppearance} - Consumer hook
 */
export const AppearanceContext = createContext<AppearanceContextValue>(null);
