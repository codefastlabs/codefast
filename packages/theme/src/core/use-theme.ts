import { use } from "react";

import { ColorSchemeContext } from "#/core/context";
import type { ColorSchemeContextType } from "#/types";

/* -----------------------------------------------------------------------------
 * Hook
 * -------------------------------------------------------------------------- */

/**
 * Hook to access color scheme context.
 *
 * Uses React 19's `use()` API for context consumption, enabling:
 * - Conditional context reading
 * - Better Suspense boundary integration
 *
 * @returns Color scheme context with `colorScheme`, `resolvedColorScheme`, `setPreferredColorScheme`, and `isPending`
 * @throws Error if called outside of AppearanceProvider
 *
 * @example
 * ```tsx
 * function AppearanceToggle() {
 *   const { colorScheme, setPreferredColorScheme, isPending } = useColorScheme();
 *
 *   return (
 *     <button
 *       onClick={() => setPreferredColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
 *       disabled={isPending}
 *     >
 *       {colorScheme}
 *     </button>
 *   );
 * }
 * ```
 *
 * @since 0.3.16-canary.0
 */
export function useColorScheme(): ColorSchemeContextType {
  const value = use(ColorSchemeContext);

  if (!value) {
    throw new Error("useColorScheme must be used within an AppearanceProvider");
  }

  return value;
}
