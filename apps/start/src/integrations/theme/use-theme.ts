import { useContext } from 'react';
import type { ThemeContextType } from '@/integrations/theme/context';
import { ThemeContext } from '@/integrations/theme/context';

/**
 * Access the theme context and get theme state and control methods.
 *
 * This hook provides access to the theme context value, including the current
 * theme, resolved theme, system theme, available themes, and the setTheme function.
 *
 * @returns The theme context value containing theme state and methods.
 *
 * @throws {Error} If called outside of a ThemeProvider component.
 *
 * @example
 * ```tsx
 * function ThemeSwitcher() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       Current: {resolvedTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
