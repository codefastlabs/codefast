import { createContext } from 'react';
import type { SystemTheme, Theme } from '@/integrations/theme/types';

/**
 * The theme context value that provides theme state and control methods.
 *
 * This type defines the shape of the context value that is provided by the
 * Theme component and consumed by the useTheme hook.
 */
export type ThemeContextType = {
  /** The current theme value (may be 'system' if following OS preference). */
  theme: Theme;
  /** Function to update the theme and persist it to localStorage. */
  setTheme: (theme: Theme) => void;
  /** The resolved theme value (never 'system', always 'light' or 'dark' or custom theme). */
  resolvedTheme: Theme | undefined;
  /** Available theme options based on enableSystem prop. */
  themes: Theme[];
  /** The current system theme preference ('light' or 'dark') if system detection is enabled. */
  systemTheme: SystemTheme | undefined;
};

/**
 * React context for theme management.
 *
 * This context provides access to theme state and methods throughout the component tree.
 * Use the useTheme hook to access this context instead of using it directly.
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
