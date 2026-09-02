import { useSyncExternalStore } from "react";

const emptySubscribe = (): (() => void) => () => {};

/**
 * Reports `false` during SSR and the first client render, then `true` once hydrated.
 *
 * Locale- or platform-dependent text (clock formatting, the ⌘K hint) must match the
 * server markup on the first paint, so components gate on this flag instead of a
 * mount effect.
 *
 * @since 0.7.1
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export { useHasHydrated };
