import { createContext } from 'react';
import type { ThemeContextType } from '@/types';

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

type ThemeContextValue = ThemeContextType | null;

/**
 * React context for theme state management.
 *
 * Provides access to current theme, resolved theme, setter function, and pending state.
 * Use {@link useTheme} hook instead of consuming this context directly.
 *
 * @see {@link ThemeProvider} - Provider component
 * @see {@link useTheme} - Consumer hook
 */
export const ThemeContext = createContext<ThemeContextValue>(null);
