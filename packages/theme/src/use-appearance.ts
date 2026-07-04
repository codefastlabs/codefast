import { use } from "react";

import type { AppearanceContextType } from "#/appearance";
import { AppearanceContext } from "#/appearance-context";

/* -----------------------------------------------------------------------------
 * Hook
 * -------------------------------------------------------------------------- */

/**
 * Hook to access appearance context.
 *
 * Uses React 19's `use()` API for context consumption, enabling:
 * - Conditional context reading
 * - Better Suspense boundary integration
 *
 * @returns Appearance context with `appearance`, `colorScheme`, `setAppearance`, and `isPending`
 * @throws Error if called outside of AppearanceProvider
 *
 * @example
 * ```tsx
 * function AppearanceToggle() {
 *   const { appearance, setAppearance, isPending } = useAppearance();
 *
 *   return (
 *     <button
 *       onClick={() => setAppearance(appearance === 'dark' ? 'light' : 'dark')}
 *       disabled={isPending}
 *     >
 *       {appearance}
 *     </button>
 *   );
 * }
 * ```
 *
 * @since 0.5.0-canary.2
 */
export function useAppearance(): AppearanceContextType {
  const value = use(AppearanceContext);

  if (!value) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }

  return value;
}
