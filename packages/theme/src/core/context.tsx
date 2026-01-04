import { createContext } from 'react';
import type { ThemeContextType } from '@/types';

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

type ThemeContextValue = ThemeContextType | null;

/**
 * React context for theme state.
 * Provides theme, resolvedTheme, setTheme, and isPending to descendants.
 */
export const ThemeContext = createContext<ThemeContextValue>(null);
