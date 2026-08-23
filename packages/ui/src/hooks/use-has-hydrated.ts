import { useSyncExternalStore } from "react";

const emptySubscribe = (): (() => void) => () => {};

/**
 * Reports `false` during SSR and the first client render, then `true` once hydrated.
 *
 * Client-only UI (a restored preference, viewport readouts) must match the server
 * markup on the first paint to avoid a hydration mismatch, so components gate on
 * this flag instead of a mount effect.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export { useHasHydrated };
