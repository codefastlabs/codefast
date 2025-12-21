import { use } from 'react';
import type { ThemeContextType } from '@/integrations/theme/provider';
import { ThemeContext } from '@/integrations/theme/provider';

/* -----------------------------------------------------------------------------
 * Hook: useTheme
 * -------------------------------------------------------------------------- */

/**
 * Hook to access the theme context.
 *
 * Uses React 19's `use` API to read context, which allows for conditional
 * context reading and better integration with Suspense boundaries.
 *
 * @returns The theme context value containing `theme` and `setTheme`
 * @throws {Error} If called outside of a ThemeProvider
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme } = useTheme();
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const value = use(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return value;
}
