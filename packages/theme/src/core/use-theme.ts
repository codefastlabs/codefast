import { use } from "react";

import type { ThemeContextType } from "#/types";

import { ThemeContext } from "#/core/context";

/* -----------------------------------------------------------------------------
 * Hook
 * -------------------------------------------------------------------------- */

/**
 * Hook to access theme context.
 * 
 * Uses React 19's `use()` API for context consumption, enabling:
 * - Conditional context reading
 * - Better Suspense boundary integration
 * 
 * @returns Theme context with `theme`, `resolvedTheme`, `setTheme`, and `isPending`
 * @throws Error if called outside of ThemeProvider
 * 
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, isPending } = useTheme();
 * 
 *   return (
 *     <button
 *       onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
 *       disabled={isPending}
 *     >
 *       {theme}
 *     </button>
 *   );
 * }
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function useTheme(): ThemeContextType {
  const value = use(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return value;
}
